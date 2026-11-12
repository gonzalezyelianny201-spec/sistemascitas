/* ==========================================================================
   TALLER 18 · SISTEMA DE RESERVAS Y CITAS
   Universidad de Caldas · Programación Web Creativa II


   Regla de oro para las fechas:
   las fechas se guardan como texto "AAAA-MM-DD" y se construyen siempre con
   new Date(anio, mes, dia), que usa la zona horaria local. Nunca se usa
   new Date("AAAA-MM-DD") ni toISOString() para fechas de calendario, porque
   interpretan el texto como UTC y pueden mostrar el día anterior.
   ========================================================================== */


/* 1. CONSTANTES DE CONFIGURACIÓN ------------------------------------------ */
const CLAVE_CLIENTES = "taller18_clientes";
const CLAVE_RESERVAS = "taller18_reservas";


const HORA_INICIO_MIN = 8 * 60;      // 8:00 a. m. expresado en minutos
const HORA_FIN_MIN = 17 * 60;        // 5:00 p. m. expresado en minutos
const INTERVALO_MIN = 30;            // duración de cada cita en minutos
const BLOQUEAR_HORAS_PASADAS = true; // en el día actual, bloquea horas ya vencidas
const MAX_OBSERVACIONES = 250;


const SERVICIOS = [
    "Consulta general",
    "Odontología",
    "Fisioterapia",
    "Psicología",
    "Nutrición",
    "Exámenes de laboratorio"
];


const ESTADOS = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada"
};


const ORDEN_ESTADOS = { pendiente: 0, confirmada: 1, cancelada: 2 };
const NOMBRES_DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];


/* 2. ESTADO GLOBAL DE LA APLICACIÓN --------------------------------------- */
const app = {
    clientes: [],
    reservas: [],
    vista: { anio: 0, mes: 0 },   // mes visible en el calendario (mes de 0 a 11)
    fechaSeleccionada: "",        // fecha en formato AAAA-MM-DD
    editandoReservaId: null,
    editandoClienteId: null
};


let temporizadorMensaje = null;


/* 3. UTILIDADES GENERALES ------------------------------------------------- */
function $(id) {
    return document.getElementById(id);
}


function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) {
        elemento.className = clase;
    }
    if (texto !== undefined) {
        elemento.textContent = texto;
    }
    return elemento;
}


function agregarOpcion(select, valor, texto) {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = texto;
    select.appendChild(opcion);
}


function generarId(prefijo) {
    return prefijo + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}


function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


function pluralizar(cantidad, singular, plural) {
    return cantidad + " " + (cantidad === 1 ? singular : plural);
}


/* 4. UTILIDADES DE FECHA Y HORA ------------------------------------------- */
function rellenar(numero) {
    return String(numero).padStart(2, "0");
}


// Convierte un objeto Date local en texto AAAA-MM-DD.
function formatearFechaISO(fecha) {
    return fecha.getFullYear() + "-" + rellenar(fecha.getMonth() + 1) + "-" + rellenar(fecha.getDate());
}


// Construye el texto AAAA-MM-DD a partir de año, mes (0 a 11) y día.
function construirFechaISO(anio, mes, dia) {
    return anio + "-" + rellenar(mes + 1) + "-" + rellenar(dia);
}


// Convierte AAAA-MM-DD en un Date local (a las 00:00 de la zona del usuario).
function parsearFechaISO(texto) {
    const partes = texto.split("-").map(Number);
    return new Date(partes[0], partes[1] - 1, partes[2]);
}


// Verifica el formato y que la fecha exista realmente (ej.: rechaza 2026-02-30).
function esFechaISOValida(texto) {
    if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return false;
    }
    return formatearFechaISO(parsearFechaISO(texto)) === texto;
}


function obtenerHoyISO() {
    return formatearFechaISO(new Date());
}


function sumarDiasISO(fechaISO, dias) {
    const base = parsearFechaISO(fechaISO);
    return formatearFechaISO(new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias));
}


function formatearFechaLarga(fechaISO) {
    const texto = parsearFechaISO(fechaISO).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    return capitalizar(texto);
}


function formatearFechaCorta(fechaISO) {
    const partes = fechaISO.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}


function nombreMes(anio, mes) {
    const texto = new Date(anio, mes, 1).toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric"
    });
    return capitalizar(texto);
}


// Convierte "14:30" en "2:30 p. m.".
function formatearHora(hora) {
    const partes = hora.split(":").map(Number);
    const sufijo = partes[0] >= 12 ? "p. m." : "a. m.";
    const hora12 = partes[0] % 12 === 0 ? 12 : partes[0] % 12;
    return hora12 + ":" + rellenar(partes[1]) + " " + sufijo;
}


/* 5. PERSISTENCIA CON LOCALSTORAGE ---------------------------------------- */
function leerLocalStorage(clave) {
    try {
        const texto = localStorage.getItem(clave);
        if (!texto) {
            return [];
        }
        const datos = JSON.parse(texto);
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("No fue posible leer " + clave + ":", error);
        return [];
    }
}


function escribirLocalStorage(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error("No fue posible guardar " + clave + ":", error);
        mostrarMensaje("No fue posible guardar los datos en el navegador.", "error");
        return false;
    }
}


function cargarDatos() {
    app.clientes = leerLocalStorage(CLAVE_CLIENTES).filter(function (cliente) {
        return cliente && typeof cliente.id === "string" && typeof cliente.nombre === "string";
    });
    app.reservas = leerLocalStorage(CLAVE_RESERVAS).filter(function (reserva) {
        return reserva
            && typeof reserva.id === "string"
            && esFechaISOValida(reserva.fecha)
            && typeof reserva.hora === "string"
            && ESTADOS[reserva.estado] !== undefined;
    });
}


function guardarDatos() {
    escribirLocalStorage(CLAVE_CLIENTES, app.clientes);
    escribirLocalStorage(CLAVE_RESERVAS, app.reservas);
}


/* 6. MENSAJES Y ERRORES DE FORMULARIO ------------------------------------- */
function mostrarMensaje(texto, tipo) {
    const contenedor = $("mensaje");
    contenedor.textContent = texto;
    contenedor.className = "mensaje mensaje--" + (tipo || "exito") + " mensaje--visible";
    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(function () {
        contenedor.classList.remove("mensaje--visible");
    }, 3500);
}


function limpiarErrorCampo(campo) {
    if (!campo || !campo.id) {
        return;
    }
    const error = $("error-" + campo.id);
    if (error) {
        error.textContent = "";
    }
    campo.classList.remove("es-invalido");
    campo.removeAttribute("aria-invalid");
}


function limpiarErrores(formulario) {
    formulario.querySelectorAll(".error-campo").forEach(function (error) {
        error.textContent = "";
    });
    formulario.querySelectorAll(".es-invalido").forEach(function (campo) {
        campo.classList.remove("es-invalido");
        campo.removeAttribute("aria-invalid");
    });
}


function mostrarErrores(errores) {
    const claves = Object.keys(errores);
    claves.forEach(function (clave) {
        const campo = $(clave);
        const error = $("error-" + clave);
        if (error) {
            error.textContent = errores[clave];
        }
        if (campo) {
            campo.classList.add("es-invalido");
            campo.setAttribute("aria-invalid", "true");
        }
    });
    const primero = $(claves[0]);
    if (primero && !primero.disabled) {
        primero.focus();
    }
}


/* 7. BÚSQUEDAS EN LOS DATOS ----------------------------------------------- */
function buscarCliente(id) {
    return app.clientes.find(function (cliente) {
        return cliente.id === id;
    });
}


function buscarReserva(id) {
    return app.reservas.find(function (reserva) {
        return reserva.id === id;
    });
}


function nombreDelCliente(reserva) {
    const cliente = buscarCliente(reserva.clienteId);
    return cliente ? cliente.nombre : "Cliente eliminado";
}


function contarReservasDeCliente(clienteId) {
    return app.reservas.filter(function (reserva) {
        return reserva.clienteId === clienteId;
    }).length;
}


function agruparReservasPorFecha() {
    const grupos = {};
    app.reservas.forEach(function (reserva) {
        if (!grupos[reserva.fecha]) {
            grupos[reserva.fecha] = [];
        }
        grupos[reserva.fecha].push(reserva);
    });
    return grupos;
}


/* 8. CONTROL DE DISPONIBILIDAD -------------------------------------------- */
// Genera ["08:00", "08:30", ..., "16:30"]. La última cita termina a las 5:00 p. m.
function generarHorarios() {
    const horarios = [];
    for (let minutos = HORA_INICIO_MIN; minutos < HORA_FIN_MIN; minutos += INTERVALO_MIN) {
        horarios.push(rellenar(Math.floor(minutos / 60)) + ":" + rellenar(minutos % 60));
    }
    return horarios;
}


// Una hora está ocupada si existe otra reserva NO cancelada en la misma fecha y hora.
function horaOcupada(fecha, hora, excluirId) {
    return app.reservas.some(function (reserva) {
        return reserva.fecha === fecha
            && reserva.hora === hora
            && reserva.estado !== "cancelada"
            && reserva.id !== excluirId;
    });
}


// En el día actual, una hora ya iniciada no se puede reservar.
function horaPasada(fecha, hora) {
    if (!BLOQUEAR_HORAS_PASADAS || fecha !== obtenerHoyISO()) {
        return false;
    }
    const ahora = new Date();
    const partes = hora.split(":").map(Number);
    return partes[0] * 60 + partes[1] <= ahora.getHours() * 60 + ahora.getMinutes();
}


// Devuelve [{ hora: "08:00", situacion: "libre" | "ocupado" | "pasado" }, ...]
function calcularHorarios(fecha, excluirId) {
    const original = excluirId ? buscarReserva(excluirId) : null;
    return generarHorarios().map(function (hora) {
        const esLaOriginal = original !== null && original.fecha === fecha && original.hora === hora;
        let situacion = "libre";
        if (horaOcupada(fecha, hora, excluirId)) {
            situacion = "ocupado";
        } else if (horaPasada(fecha, hora) && !esLaOriginal) {
            situacion = "pasado";
        }
        return { hora: hora, situacion: situacion };
    });
}


/* 9. VALIDACIONES --------------------------------------------------------- */
function validarReserva(datos, excluirId) {
    const errores = {};


    if (!datos.clienteId || !buscarCliente(datos.clienteId)) {
        errores.reservaCliente = "Seleccione un cliente registrado.";
    }


    if (!datos.fecha) {
        errores.reservaFecha = "Seleccione una fecha.";
    } else if (!esFechaISOValida(datos.fecha)) {
        errores.reservaFecha = "La fecha ingresada no es válida.";
    } else if (datos.fecha < obtenerHoyISO()) {
        errores.reservaFecha = "No se permiten fechas anteriores al día actual.";
    }


    if (!datos.hora) {
        errores.reservaHora = "Seleccione una hora disponible.";
    } else if (generarHorarios().indexOf(datos.hora) === -1) {
        errores.reservaHora = "La hora está fuera del horario de atención.";
    } else if (!errores.reservaFecha && datos.estado !== "cancelada") {
        const situacion = calcularHorarios(datos.fecha, excluirId).find(function (item) {
            return item.hora === datos.hora;
        }).situacion;
        if (situacion === "ocupado") {
            errores.reservaHora = "Ese horario ya está reservado. Elija otra hora.";
        } else if (situacion === "pasado") {
            errores.reservaHora = "No se puede reservar una hora que ya pasó.";
        }
    }


    if (!datos.servicio || SERVICIOS.indexOf(datos.servicio) === -1) {
        errores.reservaServicio = "Seleccione un servicio.";
    }


    if (datos.observaciones.length > MAX_OBSERVACIONES) {
        errores.reservaObservaciones = "Máximo " + MAX_OBSERVACIONES + " caracteres.";
    }


    if (ESTADOS[datos.estado] === undefined) {
        errores.reservaEstado = "Seleccione un estado válido.";
    } else if (!excluirId && datos.estado === "cancelada") {
        errores.reservaEstado = "Una reserva nueva no puede registrarse como cancelada.";
    }


    return errores;
}


function validarCliente(datos, excluirId) {
    const errores = {};


    if (datos.nombre.length < 5 || datos.nombre.split(" ").length < 2) {
        errores.clienteNombre = "Escriba el nombre completo (nombre y apellido).";
    } else if (!/^[\p{L}][\p{L}\s'.-]{3,59}$/u.test(datos.nombre)) {
        errores.clienteNombre = "El nombre solo puede contener letras y espacios.";
    }


    if (!/^\d{6,12}$/.test(datos.documento)) {
        errores.clienteDocumento = "El documento debe tener entre 6 y 12 dígitos.";
    } else if (app.clientes.some(function (cliente) {
        return cliente.documento === datos.documento && cliente.id !== excluirId;
    })) {
        errores.clienteDocumento = "Ya existe un cliente con ese documento.";
    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo)) {
        errores.clienteCorreo = "Ingrese un correo electrónico válido.";
    }


    if (!/^\d{7,10}$/.test(datos.telefono)) {
        errores.clienteTelefono = "El teléfono debe tener entre 7 y 10 dígitos.";
    }


    if (!datos.servicio || SERVICIOS.indexOf(datos.servicio) === -1) {
        errores.clienteServicio = "Seleccione el servicio solicitado.";
    }


    return errores;
}


/* 10. DASHBOARD ----------------------------------------------------------- */
function renderizarDashboard() {
    const hoy = obtenerHoyISO();
    const contar = function (estado) {
        return app.reservas.filter(function (reserva) {
            return reserva.estado === estado;
        }).length;
    };
    const citasHoy = app.reservas.filter(function (reserva) {
        return reserva.fecha === hoy && reserva.estado !== "cancelada";
    }).length;


    $("totalCitas").textContent = app.reservas.length;
    $("citasHoy").textContent = citasHoy;
    $("citasPendientes").textContent = contar("pendiente");
    $("citasConfirmadas").textContent = contar("confirmada");
    $("citasCanceladas").textContent = contar("cancelada");
}


/* 11. CALENDARIO ---------------------------------------------------------- */
function renderizarCalendario() {
    const anio = app.vista.anio;
    const mes = app.vista.mes;
    const hoy = obtenerHoyISO();
    const rejilla = $("rejillaCalendario");
    const reservasPorFecha = agruparReservasPorFecha();


    $("tituloMes").textContent = nombreMes(anio, mes);
    rejilla.innerHTML = "";


    NOMBRES_DIAS.forEach(function (nombre) {
        rejilla.appendChild(crearElemento("div", "calendario__dia-semana", nombre));
    });


    // La semana inicia en lunes: getDay() devuelve 0 para domingo.
    const desplazamiento = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();


    for (let i = 0; i < desplazamiento; i++) {
        rejilla.appendChild(crearElemento("div", "calendario__vacio"));
    }


    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaISO = construirFechaISO(anio, mes, dia);
        const delDia = reservasPorFecha[fechaISO] || [];
        const activas = delDia.filter(function (reserva) {
            return reserva.estado !== "cancelada";
        });


        const boton = crearElemento("button", "calendario__dia");
        boton.type = "button";
        boton.dataset.fecha = fechaISO;


        if (fechaISO === hoy) {
            boton.classList.add("es-hoy");
            boton.setAttribute("aria-current", "date");
        }
        if (fechaISO < hoy) {
            boton.classList.add("es-pasado");
        }
        if (fechaISO === app.fechaSeleccionada) {
            boton.classList.add("es-seleccionado");
        }
        if (delDia.length > 0) {
            boton.classList.add("con-reservas");
        }
        boton.setAttribute("aria-pressed", fechaISO === app.fechaSeleccionada ? "true" : "false");
        boton.setAttribute(
            "aria-label",
            formatearFechaLarga(fechaISO) + ", " +
            (activas.length > 0 ? pluralizar(activas.length, "cita activa", "citas activas") : "sin citas")
        );


        boton.appendChild(crearElemento("span", "calendario__numero", String(dia)));


        const puntos = crearElemento("span", "calendario__puntos");
        delDia.slice(0, 4).forEach(function (reserva) {
            puntos.appendChild(crearElemento("span", "punto punto--" + reserva.estado));
        });
        boton.appendChild(puntos);


        if (activas.length > 0) {
            boton.appendChild(crearElemento("span", "calendario__contador", String(activas.length)));
        }


        rejilla.appendChild(boton);
    }
}


function cambiarMes(cambio) {
    const nueva = new Date(app.vista.anio, app.vista.mes + cambio, 1);
    app.vista = { anio: nueva.getFullYear(), mes: nueva.getMonth() };
    renderizarCalendario();
}


function seleccionarFecha(fechaISO, desdeFormulario) {
    const fecha = parsearFechaISO(fechaISO);
    app.fechaSeleccionada = fechaISO;
    app.vista = { anio: fecha.getFullYear(), mes: fecha.getMonth() };


    if (!desdeFormulario && fechaISO >= obtenerHoyISO()) {
        $("reservaFecha").value = fechaISO;
        limpiarErrorCampo($("reservaFecha"));
    }


    renderizarCalendario();
    renderizarPanelDia();
    actualizarHorarios();
}


/* 12. TARJETAS Y PANEL DEL DÍA -------------------------------------------- */
function crearEtiquetaEstado(estado) {
    return crearElemento("span", "etiqueta etiqueta--" + estado, ESTADOS[estado]);
}


function crearBoton(texto, clase, accion, id) {
    const boton = crearElemento("button", "boton boton--pequeno " + clase, texto);
    boton.type = "button";
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    return boton;
}


function crearTarjetaReserva(reserva, mostrarFecha) {
    const cliente = buscarCliente(reserva.clienteId);
    const tarjeta = crearElemento("article", "tarjeta-reserva tarjeta-reserva--" + reserva.estado);


    const cabecera = crearElemento("div", "tarjeta-reserva__cabecera");
    const horario = (mostrarFecha ? formatearFechaCorta(reserva.fecha) + " · " : "") +
        formatearHora(reserva.hora);
    cabecera.appendChild(crearElemento("span", "tarjeta-reserva__hora", horario));
    cabecera.appendChild(crearEtiquetaEstado(reserva.estado));
    tarjeta.appendChild(cabecera);


    tarjeta.appendChild(crearElemento("h4", "tarjeta-reserva__cliente", nombreDelCliente(reserva)));
    tarjeta.appendChild(crearElemento("p", "tarjeta-reserva__servicio", reserva.servicio));


    if (cliente) {
        tarjeta.appendChild(crearElemento(
            "p",
            "tarjeta-reserva__detalle",
            "Doc. " + cliente.documento + " · Tel. " + cliente.telefono
        ));
    }
    if (reserva.observaciones) {
        tarjeta.appendChild(crearElemento(
            "p",
            "tarjeta-reserva__detalle",
            "Obs.: " + reserva.observaciones
        ));
    }


    const acciones = crearElemento("div", "tarjeta-reserva__acciones");
    if (reserva.fecha < obtenerHoyISO()) {
        acciones.appendChild(crearElemento("span", "tarjeta-reserva__nota", "Cita pasada (solo consulta)"));
    } else {
        if (reserva.estado === "pendiente") {
            acciones.app
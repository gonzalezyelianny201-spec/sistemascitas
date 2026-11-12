/* =====================================================
   Taller 19 - Plataforma educativa LMS
   Programación Web Creativa II - Universidad de Caldas
   JavaScript puro (ES6+), sin bibliotecas externas
   ===================================================== */


"use strict";


/* ---------- 1. CONSTANTES ---------- */
const STORAGE_KEY = "taller19_lms_v1";
const PASS_PERCENT = 70;      // Porcentaje mínimo para aprobar (3.5 / 5.0)
const QUIZ_SECONDS = 300;     // Tiempo máximo por evaluación (5 minutos)


const STUDENT = {
  name: "Camila Rodríguez Gómez",
  program: "Diseño Visual",
  code: "EST-2026-0419"
};


const VIEW_TITLES = {
  dashboard: "Panel del estudiante",
  catalog: "Catálogo de cursos",
  learn: "Módulo de aprendizaje",
  quiz: "Evaluaciones",
  history: "Historial de evaluaciones",
  certificates: "Certificados"
};


/* ---------- 2. DATOS DE DEMOSTRACIÓN ---------- */
const COURSES = [
  {
    id: "html5",
    title: "Fundamentos de HTML5",
    description: "Aprende a estructurar páginas web accesibles con etiquetas semánticas, listas, enlaces y formularios.",
    instructor: "Mg. Laura Beltrán",
    level: "Básico",
    icon: "🌐",
    cover: "linear-gradient(135deg, #0b1b45 0%, #2563eb 60%, #38bdf8 100%)",
    units: [
      {
        id: "u1",
        title: "Unidad 1 · Estructura de un documento",
        lessons: [
          {
            id: "l1",
            title: "¿Qué es HTML5?",
            minutes: 8,
            content: [
              "HTML (HyperText Markup Language) es el lenguaje de marcado que describe la estructura y el significado del contenido de una página web. HTML5 es su versión moderna e incorporó etiquetas semánticas, audio, video y nuevas interfaces de programación.",
              "Un documento HTML se compone de elementos formados por una etiqueta de apertura, un contenido y una etiqueta de cierre. Los navegadores leen ese código y construyen el árbol DOM que luego se muestra en pantalla."
            ],
            points: [
              "HTML define la estructura; CSS define la presentación; JavaScript define el comportamiento.",
              "Todo documento comienza con la declaración `<!DOCTYPE html>`.",
              "Los archivos se guardan con la extensión `.html` y se abren en el navegador."
            ],
            code: "<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Mi primera página</title>\n</head>\n<body>\n  <h1>Hola, mundo</h1>\n</body>\n</html>"
          },
          {
            id: "l2",
            title: "Etiquetas semánticas",
            minutes: 10,
            content: [
              "Las etiquetas semánticas describen el rol de cada bloque de la página. Gracias a ellas, los buscadores y los lectores de pantalla comprenden mejor el contenido y los desarrolladores escriben código más legible.",
              "Una página típica usa `<header>` para la cabecera, `<nav>` para los enlaces de navegación, `<main>` para el contenido principal único, `<section>` y `<article>` para agrupar contenido, `<aside>` para información complementaria y `<footer>` para el pie."
            ],
            points: [
              "Usa un solo `<main>` por página.",
              "Evita reemplazar etiquetas semánticas por `<div>` genéricos.",
              "La semántica mejora el SEO y la accesibilidad."
            ]
          }
        ]
      },
      {
        id: "u2",
        title: "Unidad 2 · Contenido y formularios",
        lessons: [
          {
            id: "l3",
            title: "Textos, listas y enlaces",
            minutes: 9,
            content: [
              "Los títulos se escriben con `<h1>` a `<h6>` respetando la jerarquía, y los párrafos con `<p>`. Para agrupar elementos se usan listas no ordenadas `<ul>` y ordenadas `<ol>`, cuyos elementos van dentro de `<li>`.",
              "Los enlaces se crean con la etiqueta `<a>` y el atributo `href`. Con `target=\"_blank\"` se abre el destino en una pestaña nueva; se recomienda añadir `rel=\"noopener\"` por seguridad."
            ],
            points: [
              "Un enlace interno puede apuntar a un identificador: `<a href=\"#contacto\">`.",
              "Las imágenes requieren el atributo `alt` con una descripción.",
              "Las listas deben usarse para contenido que realmente es una lista."
            ],
            code: "<ul>\n  <li><a href=\"index.html\">Inicio</a></li>\n  <li><a href=\"cursos.html\">Cursos</a></li>\n</ul>"
          },
          {
            id: "l4",
            title: "Formularios accesibles",
            minutes: 12,
            content: [
              "Los formularios permiten recoger datos del usuario. Se construyen con `<form>` y controles como `<input>`, `<select>` y `<textarea>`. Cada control debe tener una etiqueta `<label>` asociada mediante el atributo `for`, que coincide con el `id` del campo.",
              "HTML5 ofrece validación nativa con atributos como `required`, `minlength`, `pattern` y tipos de entrada como `email`, `number` o `date`. El navegador impide el envío si los datos no cumplen las reglas."
            ],
            points: [
              "`placeholder` es una pista, no reemplaza a `label`.",
              "`required` obliga a completar el campo.",
              "Agrupa campos relacionados con `<fieldset>` y `<legend>`."
            ],
            code: "<form>\n  <label for=\"correo\">Correo</label>\n  <input type=\"email\" id=\"correo\" name=\"correo\" required>\n  <button type=\"submit\">Enviar</button>\n</form>"
          }
        ]
      }
    ],
    quiz: [
      {
        q: "¿Qué etiqueta define el contenido principal y único de una página?",
        options: ["<section>", "<main>", "<div>", "<aside>"],
        answer: 1,
        feedback: "<main> representa el contenido principal del documento y debe aparecer una sola vez."
      },
      {
        q: "¿Qué declaración indica que el documento usa HTML5?",
        options: ["<!DOCTYPE html>", "<html5>", "<!HTML version=\"5\">", "<meta html5>"],
        answer: 0,
        feedback: "La declaración <!DOCTYPE html> activa el modo estándar de HTML5 en el navegador."
      },
      {
        q: "¿Qué atributo asocia un <label> con un campo de formulario?",
        options: ["name", "for", "href", "value"],
        answer: 1,
        feedback: "El atributo for del label debe coincidir con el id del campo."
      },
      {
        q: "¿Qué atributo impide enviar un formulario con un campo vacío?",
        options: ["placeholder", "disabled", "required", "readonly"],
        answer: 2,
        feedback: "required activa la validación nativa y exige que el campo tenga un valor."
      },
      {
        q: "¿Qué elemento es el adecuado para agrupar los enlaces de navegación principales?",
        options: ["<nav>", "<links>", "<menu-list>", "<footer>"],
        answer: 0,
        feedback: "<nav> es la etiqueta semántica destinada a los bloques de navegación."
      }
    ]
  },
  {
    id: "css3",
    title: "CSS3: Layouts con Flexbox y Grid",
    description: "Domina selectores, modelo de caja y los sistemas de diseño modernos para crear interfaces responsive.",
    instructor: "Ing. Mateo Giraldo",
    level: "Intermedio",
    icon: "🎨",
    cover: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #38bdf8 120%)",
    units: [
      {
        id: "u1",
        title: "Unidad 1 · Selectores y modelo de caja",
        lessons: [
          {
            id: "l1",
            title: "Selectores y especificidad",
            minutes: 10,
            content: [
              "CSS aplica estilos a los elementos mediante selectores. Existen selectores de etiqueta (`p`), de clase (`.tarjeta`), de identificador (`#menu`), de atributo y pseudoclases como `:hover`.",
              "Cuando varias reglas compiten, el navegador resuelve el conflicto con la especificidad: el identificador pesa más que la clase, y la clase más que la etiqueta. Si hay empate, gana la regla escrita al final."
            ],
            points: [
              "Orden de peso: `#id` > `.clase` > `etiqueta`.",
              "Evita abusar de `!important`.",
              "Usa variables CSS (`--color-principal`) para mantener una paleta coherente."
            ],
            code: ":root {\n  --violeta: #7c3aed;\n}\n.boton {\n  background: var(--violeta);\n  color: white;\n}\n.boton:hover {\n  opacity: 0.85;\n}"
          },
          {
            id: "l2",
            title: "El modelo de caja",
            minutes: 9,
            content: [
              "Todo elemento HTML es una caja rectangular formada, de adentro hacia afuera, por el contenido, el relleno (`padding`), el borde (`border`) y el margen (`margin`).",
              "Con `box-sizing: border-box` el ancho declarado incluye el relleno y el borde, lo que simplifica enormemente los cálculos de diseño."
            ],
            points: [
              "`padding` separa el contenido del borde.",
              "`margin` separa la caja de otras cajas.",
              "Aplica `*, *::before, *::after { box-sizing: border-box; }` al inicio de tus hojas de estilo."
            ]
          }
        ]
      },
      {
        id: "u2",
        title: "Unidad 2 · Layouts modernos",
        lessons: [
          {
            id: "l3",
            title: "Flexbox",
            minutes: 12,
            content: [
              "Flexbox organiza elementos en una dimensión (fila o columna). Se activa con `display: flex` en el contenedor, y sus hijos se convierten en elementos flexibles.",
              "La propiedad `justify-content` alinea los elementos en el eje principal, mientras que `align-items` los alinea en el eje transversal. Con `flex-wrap: wrap` los elementos saltan de línea cuando no caben."
            ],
            points: [
              "`gap` define el espacio entre elementos.",
              "`flex-direction: column` cambia el eje principal.",
              "Ideal para menús, barras y tarjetas alineadas."
            ],
            code: ".barra {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 1rem;\n}"
          },
          {
            id: "l4",
            title: "CSS Grid",
            minutes: 12,
            content: [
              "CSS Grid organiza el contenido en dos dimensiones: filas y columnas. Se activa con `display: grid` y se definen las columnas con `grid-template-columns`.",
              "La unidad `fr` reparte el espacio disponible en fracciones, y la función `repeat()` evita repetir valores. Combinada con `auto-fit` y `minmax()`, permite crear cuadrículas responsive sin media queries."
            ],
            points: [
              "`grid-template-columns: repeat(3, 1fr)` crea tres columnas iguales.",
              "`grid-column` y `grid-row` permiten que un elemento ocupe varias celdas.",
              "Grid y Flexbox se complementan: Grid para la página, Flexbox para los componentes."
            ],
            code: ".galeria {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 1rem;\n}"
          }
        ]
      }
    ],
    quiz: [
      {
        q: "¿Qué selector tiene la mayor especificidad?",
        options: [".clase", "#identificador", "p", "*"],
        answer: 1,
        feedback: "El selector de identificador (#) pesa más que los de clase, etiqueta y el universal."
      },
      {
        q: "¿Cuál es el orden del modelo de caja de adentro hacia afuera?",
        options: [
          "Contenido, padding, border, margin",
          "Contenido, margin, border, padding",
          "Margin, border, padding, contenido",
          "Contenido, border, padding, margin"
        ],
        answer: 0,
        feedback: "Las capas son: contenido, relleno (padding), borde (border) y margen (margin)."
      },
      {
        q: "¿Qué declaración activa Flexbox en un contenedor?",
        options: ["flex-wrap: wrap;", "display: flex;", "align-items: center;", "position: flex;"],
        answer: 1,
        feedback: "display: flex convierte al elemento en contenedor flexible."
      },
      {
        q: "¿Qué declaración crea tres columnas de igual tamaño en CSS Grid?",
        options: [
          "grid-template-columns: repeat(3, 1fr);",
          "grid-columns: 3;",
          "display: columns(3);",
          "flex-columns: 1fr 1fr 1fr;"
        ],
        answer: 0,
        feedback: "repeat(3, 1fr) repite tres veces una columna de una fracción del espacio disponible."
      },
      {
        q: "En un contenedor flex en fila, ¿qué propiedad alinea los elementos en el eje transversal?",
        options: ["justify-content", "align-items", "text-align", "float"],
        answer: 1,
        feedback: "align-items controla el eje transversal; justify-content controla el eje principal."
      }
    ]
  },
  {
    id: "js",
    title: "JavaScript ES6+ Esencial",
    description: "Programa la lógica de tus páginas: variables, funciones, manipulación del DOM, eventos y LocalStorage.",
    instructor: "Dra. Sofía Marín",
    level: "Intermedio",
    icon: "⚡",
    cover: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #a78bfa 110%)",
    units: [
      {
        id: "u1",
        title: "Unidad 1 · Fundamentos del lenguaje",
        lessons: [
          {
            id: "l1",
            title: "Variables y tipos de datos",
            minutes: 9,
            content: [
              "En JavaScript moderno se declaran variables con `let` (valor que puede cambiar) y `const` (valor que no se reasigna). Se evita `var` por su comportamiento de ámbito poco predecible.",
              "Los tipos primitivos son `string`, `number`, `boolean`, `undefined`, `null`, `bigint` y `symbol`. Además existen los objetos y los arrays, que permiten agrupar información compleja."
            ],
            points: [
              "Prefiere `const` por defecto y usa `let` solo si necesitas reasignar.",
              "Los template literals usan comillas invertidas: `Hola ${nombre}`.",
              "Un array de objetos es la estructura ideal para listas de datos."
            ],
            code: "const curso = { titulo: \"JavaScript\", lecciones: 4 };\nlet progreso = 0;\nprogreso = progreso + 25;\nconsole.log(`${curso.titulo}: ${progreso}%`);"
          },
          {
            id: "l2",
            title: "Funciones y arrow functions",
            minutes: 10,
            content: [
              "Una función encapsula un bloque de código reutilizable. Puede declararse con la palabra `function` o mediante una arrow function, que ofrece una sintaxis más corta con el operador `=>`.",
              "Los métodos de array como `map`, `filter`, `find` y `reduce` reciben funciones y permiten transformar listas sin escribir bucles manuales."
            ],
            points: [
              "Una función debe hacer una sola tarea.",
              "`filter` devuelve los elementos que cumplen una condición.",
              "`reduce` acumula una lista en un único valor."
            ],
            code: "const sumar = (a, b) => a + b;\nconst notas = [3.5, 4.2, 5.0];\nconst promedio = notas.reduce(sumar, 0) / notas.length;"
          }
        ]
      },
      {
        id: "u2",
        title: "Unidad 2 · Interacción con el DOM",
        lessons: [
          {
            id: "l3",
            title: "Selección y manipulación del DOM",
            minutes: 11,
            content: [
              "El DOM (Document Object Model) es la representación del documento HTML como un árbol de objetos que JavaScript puede leer y modificar. Para seleccionar elementos se usan `document.querySelector()` y `document.querySelectorAll()`.",
              "Una vez seleccionado un elemento, se puede cambiar su texto con `textContent`, su contenido HTML con `innerHTML`, sus clases con `classList` y sus atributos con `setAttribute`."
            ],
            points: [
              "Usa `textContent` cuando insertes texto escrito por el usuario.",
              "`classList.toggle('activo')` agrega o quita una clase.",
              "`createElement` y `appendChild` construyen nodos nuevos."
            ],
            code: "const titulo = document.querySelector(\"#titulo\");\ntitulo.textContent = \"Bienvenida, Camila\";\ntitulo.classList.add(\"destacado\");"
          },
          {
            id: "l4",
            title: "Eventos y LocalStorage",
            minutes: 12,
            content: [
              "Los eventos permiten reaccionar a las acciones del usuario. Se registran con `addEventListener`, indicando el tipo de evento (`click`, `input`, `submit`) y la función que se ejecutará.",
              "LocalStorage almacena pares clave-valor en el navegador y conserva los datos aunque se recargue la página. Solo guarda texto, por lo que los objetos se convierten con `JSON.stringify` y se recuperan con `JSON.parse`."
            ],
            points: [
              "`localStorage.setItem(clave, valor)` guarda un dato.",
              "`localStorage.getItem(clave)` lo recupera.",
              "Envuelve `JSON.parse` en `try...catch` para evitar errores con datos dañados."
            ],
            code: "const estado = { completadas: [\"l1\", \"l2\"] };\nlocalStorage.setItem(\"progreso\", JSON.stringify(estado));\nconst guardado = JSON.parse(localStorage.getItem(\"progreso\"));"
          }
        ]
      }
    ],
    quiz: [
      {
        q: "¿Qué palabra clave declara una variable cuyo valor no se reasigna?",
        options: ["var", "let", "const", "static"],
        answer: 2,
        feedback: "const declara una referencia que no puede reasignarse."
      },
      {
        q: "¿Cuál de las siguientes es una arrow function válida?",
        options: [
          "const sumar = (a, b) => a + b;",
          "const sumar = (a, b) -> a + b;",
          "function => sumar(a, b) { a + b }",
          "const sumar = fn(a, b) => a + b;"
        ],
        answer: 0,
        feedback: "La sintaxis correcta usa los parámetros, el operador => y la expresión de retorno."
      },
      {
        q: "¿Qué método selecciona el primer elemento que coincide con un selector CSS?",
        options: ["document.getElement()", "document.querySelector()", "document.select()", "document.find()"],
        answer: 1,
        feedback: "document.querySelector() recibe un selector CSS y devuelve el primer elemento coincidente."
      },
      {
        q: "¿Qué instrucción guarda un dato en LocalStorage?",
        options: [
          "localStorage.setItem(clave, valor)",
          "localStorage.saveItem(clave, valor)",
          "localStorage.put(clave, valor)",
          "localStorage.store(clave, valor)"
        ],
        answer: 0,
        feedback: "setItem es el método estándar para almacenar un par clave-valor."
      },
      {
        q: "¿Cómo se convierte un objeto en texto para guardarlo en LocalStorage?",
        options: ["JSON.stringify(objeto)", "objeto.toText()", "JSON.parse(objeto)", "String.json(objeto)"],
        answer: 0,
        feedback: "JSON.stringify serializa el objeto a texto; JSON.parse hace el proceso inverso."
      }
    ]
  },
  {
    id: "ux",
    title: "Diseño de Interfaces UX/UI",
    description: "Aplica principios de experiencia de usuario, jerarquía visual, prototipado y pruebas de usabilidad.",
    instructor: "Dis. Julián Restrepo",
    level: "Avanzado",
    icon: "🧭",
    cover: "linear-gradient(135deg, #1e1b4b 0%, #6d28d9 55%, #22d3ee 125%)",
    units: [
      {
        id: "u1",
        title: "Unidad 1 · Principios de diseño",
        lessons: [
          {
            id: "l1",
            title: "¿Qué son UX y UI?",
            minutes: 8,
            content: [
              "UX (User Experience) estudia la experiencia completa de una persona al usar un producto: qué tan fácil, eficiente y satisfactorio resulta. UI (User Interface) se ocupa de la parte visual e interactiva: colores, tipografías,
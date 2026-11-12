/* =====================================================
   Taller 20 - Constructor visual de páginas web
   Programación Web Creativa II - Universidad de Caldas
   JavaScript puro (ES6+), sin bibliotecas externas


   Idea central:
   1. La página se guarda como DATOS (arrays y objetos).
   2. Cada componente se convierte en un "nodo virtual"
      con buildVNode().
   3. El mismo nodo virtual se usa para:
        - la vista previa (toDOM: createElement + textContent)
        - el código HTML exportado (toHTML: texto escapado)
   Así la vista previa y el archivo exportado coinciden.
   ===================================================== */


"use strict";


/* ---------- 1. CONSTANTES ---------- */
const STORAGE_KEY = "taller20_webbuilder_v1";
const MAX_COMPONENTS = 100;
const ALIGNS = ["left", "center", "right"];
const VOID_TAGS = ["img", "br", "hr", "meta", "input"];


const FONTS = {
  sans: "\"Segoe UI\", system-ui, -apple-system, Roboto, Arial, sans-serif",
  serif: "Georgia, \"Times New Roman\", serif",
  mono: "Consolas, \"Courier New\", monospace"
};


const DEVICES = { desktop: "Escritorio", tablet: "Tableta", mobile: "Móvil" };


const TYPES = {
  heading: { label: "Encabezado", icon: "H" },
  paragraph: { label: "Párrafo", icon: "¶" },
  image: { label: "Imagen", icon: "▣" },
  button: { label: "Botón", icon: "▭" },
  card: { label: "Tarjeta", icon: "▤" },
  section: { label: "Sección", icon: "▦" },
  list: { label: "Lista", icon: "☰" },
  block: { label: "Bloque", icon: "◼" }
};


/* Imagen de ejemplo incluida como SVG (no requiere internet) */
const PLACEHOLDER_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>" +
  "<rect width='800' height='450' fill='#e0e7ff'/>" +
  "<text x='400' y='236' font-size='34' text-anchor='middle' fill='#4f46e5' font-family='Arial'>Imagen de ejemplo</text>" +
  "</svg>";
const PLACEHOLDER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(PLACEHOLDER_SVG);


/* ---------- 2. PROPIEDADES POR DEFECTO Y CAMPOS EDITABLES ---------- */
function defaultProps(type) {
  const base = { color: "#1f2937", fontSize: 16, align: "left", bg: "", padding: 16, radius: 0 };
  const defaults = {
    heading: { ...base, text: "Título principal", level: "h1", fontSize: 36, color: "#111827" },
    paragraph: { ...base, text: "Escribe aquí tu párrafo. Selecciona este componente para cambiar su texto, color, tamaño y alineación.", color: "#374151" },
    image: { ...base, src: "", alt: "Imagen de ejemplo", width: 60, align: "center", radius: 12 },
    button: { ...base, text: "Haz clic aquí", href: "#", color: "#ffffff", bg: "#4f46e5", radius: 10 },
    card: { ...base, title: "Título de la tarjeta", text: "Describe aquí el contenido de la tarjeta.", bg: "#ffffff", padding: 24, radius: 14 },
    section: { ...base, title: "Sección destacada", text: "Presenta aquí una idea importante de tu sitio web.", color: "#ffffff", bg: "#1e1b4b", fontSize: 18, align: "center", padding: 56 },
    list: { ...base, items: "Primer elemento\nSegundo elemento\nTercer elemento", listType: "ul" },
    block: { ...base, text: "Bloque de contenido libre. Úsalo para destacar avisos, citas o información importante.", color: "#1e1b4b", bg: "#ede9fe", padding: 32, radius: 16 }
  };
  return { ...defaults[type] };
}


const FIELD_SIZE = { key: "fontSize", label: "Tamaño de fuente (px)", kind: "number", min: 10, max: 96 };
const FIELD_COLOR = { key: "color", label: "Color del texto", kind: "color" };
const FIELD_ALIGN = { key: "align", label: "Alineación", kind: "align" };
const FIELD_BG = { key: "bg", label: "Color de fondo", kind: "colorOpt" };
const FIELD_PADDING = { key: "padding", label: "Espaciado interno (px)", kind: "number", min: 0, max: 160 };
const FIELD_RADIUS = { key: "radius", label: "Bordes redondeados (px)", kind: "number", min: 0, max: 80 };


const FIELDS = {
  heading: [
    { key: "text", label: "Texto", kind: "text", required: true, max: 200 },
    { key: "level", label: "Nivel del encabezado", kind: "select", options: [["h1", "Título 1 (H1)"], ["h2", "Título 2 (H2)"], ["h3", "Título 3 (H3)"]] },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, FIELD_BG, FIELD_PADDING, FIELD_RADIUS
  ],
  paragraph: [
    { key: "text", label: "Texto", kind: "textarea", required: true, max: 2000 },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, FIELD_BG, FIELD_PADDING, FIELD_RADIUS
  ],
  image: [
    { key: "src", label: "URL de la imagen", kind: "url", urlType: "image", hint: "Usa una dirección http:// o https://. Déjala vacía para usar la imagen de ejemplo." },
    { key: "alt", label: "Texto alternativo", kind: "text", max: 150 },
    { key: "width", label: "Ancho de la imagen (%)", kind: "number", min: 10, max: 100 },
    FIELD_ALIGN, FIELD_BG, FIELD_PADDING, FIELD_RADIUS
  ],
  button: [
    { key: "text", label: "Texto del botón", kind: "text", required: true, max: 60 },
    { key: "href", label: "Enlace del botón", kind: "url", urlType: "link", hint: "Acepta http://, https://, mailto:, tel: o #ancla." },
    { key: "color", label: "Color del texto", kind: "color" },
    { key: "bg", label: "Color del botón", kind: "color" },
    FIELD_SIZE, FIELD_ALIGN, FIELD_PADDING, FIELD_RADIUS
  ],
  card: [
    { key: "title", label: "Título", kind: "text", required: true, max: 120 },
    { key: "text", label: "Contenido", kind: "textarea", max: 1000 },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, { key: "bg", label: "Fondo de la tarjeta", kind: "colorOpt" }, FIELD_PADDING, FIELD_RADIUS
  ],
  section: [
    { key: "title", label: "Título", kind: "text", required: true, max: 120 },
    { key: "text", label: "Contenido", kind: "textarea", max: 1000 },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, { key: "bg", label: "Fondo de la sección", kind: "colorOpt" }, FIELD_PADDING, FIELD_RADIUS
  ],
  list: [
    { key: "items", label: "Elementos (uno por línea)", kind: "textarea", required: true, max: 1500 },
    { key: "listType", label: "Tipo de lista", kind: "select", options: [["ul", "Con viñetas"], ["ol", "Numerada"]] },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, FIELD_BG, FIELD_PADDING, FIELD_RADIUS
  ],
  block: [
    { key: "text", label: "Contenido (una línea por párrafo)", kind: "textarea", required: true, max: 2000 },
    FIELD_SIZE, FIELD_COLOR, FIELD_ALIGN, FIELD_BG, FIELD_PADDING, FIELD_RADIUS
  ]
};


const PAGE_FIELDS = [
  { key: "bg", label: "Color de fondo de la página", kind: "color" },
  { key: "font", label: "Tipo de letra", kind: "select", options: [["sans", "Sans-serif (moderna)"], ["serif", "Serif (clásica)"], ["mono", "Monoespaciada"]] }
];


/* ---------- 3. ESTADO DEL EDITOR ---------- */
const editor = {
  project: null,
  selectedId: null,
  device: "desktop",
  mode: "edit",
  dirty: false,
  savedOnce: false,
  nextId: 1,
  codeTab: "html"
};


/* ---------- 4. UTILIDADES ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));


function h(tag, className = "", text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}


function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function toast(message, type = "info") {
  const box = h("div", `ed-toast ${type}`, message);
  $("#toasts").appendChild(box);
  setTimeout(() => box.classList.add("hide"), 3000);
  setTimeout(() => box.remove(), 3400);
}


function newId() {
  const id = `c${editor.nextId}`;
  editor.nextId += 1;
  return id;
}


function getSelected() {
  return editor.project.components.find(c => c.id === editor.selectedId) || null;
}


function indexOfSelected() {
  return editor.project.components.findIndex(c => c.id === editor.selectedId);
}


function slugify(text) {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "pagina";
}


function splitLines(text) {
  return String(text).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}


/* ---------- 5. VALIDACIONES ---------- */
function isSafeUrl(value, type) {
  const v = value.trim();
  if (!v) return false;
  if (type === "image" && /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(v)) return true;
  if (type === "link" && /^(#|mailto:|tel:)/i.test(v)) return true;
  try {
    const url = new URL(v, "https://ejemplo.local/");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}


const okResult = value => ({ ok: true, value });
const failResult = msg => ({ ok: false, msg });


function validateField(def, raw) {
  const str = raw === undefined || raw === null ? "" : String(raw);
  switch (def.kind) {
    case "text":
    case "textarea": {
      const value = def.kind === "text" ? str.replace(/\s*[\r\n]+\s*/g, " ") : str.replace(/\r/g, "");
      if (def.required && !value.trim()) return failResult("Este campo es obligatorio.");
      if (def.max && value.length > def.max) return failResult(`Máximo ${def.max} caracteres.`);
      return okResult(value);
    }
    case "number": {
      const n = Number(str);
      if (str.trim() === "" || !Number.isFinite(n) || n < def.min || n > def.max) {
        return failResult(`Escribe un número entre ${def.min} y ${def.max}.`);
      }
      return okResult(Math.round(n));
    }
    case "color":
      return /^#[0-9a-f]{6}$/i.test(str) ? okResult(str.toLowerCase()) : failResult("Color no válido.");
    case "colorOpt":
      if (str === "") return okResult("");
      return /^#[0-9a-f]{6}$/i.test(str) ? okResult(str.toLowerCase()) : failResult("Color no válido.");
    case "align":
      return ALIGNS.includes(str) ? okResult(str) : failResult("Alineación no válida.");
    case "select":
      return def.options.some(option => option[0] === str) ? okResult(str) : failResult("Opción no válida.");
    case "url": {
      const value = str.trim();
      if (!value) return def.required ? failResult("Este campo es obligatorio.") : okResult("");
      if (isSafeUrl(value, def.urlType)) return okResult(value);
      return failResult(def.urlType === "image"
        ? "Escribe una URL válida que comience con http:// o https://."
        : "Escribe un enlace válido (http://, https://, mailto:, tel: o #ancla).");
    }
    default:
      return failResult("Campo desconocido.");
  }
}


/* Limpia las propiedades de un componente (útil al cargar datos guardados) */
function sanitizeProps(type, props) {
  const clean = defaultProps(type);
  FIELDS[type].forEach(def => {
    const result = validateField(def, props[def.key]);
    if (result.ok) clean[def.key] = result.value;
  });
  return clean;
}


function sanitizeProject(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.components)) return null;
  editor.nextId = 1;
  const components = raw.components
    .filter(item => item && TYPES[item.type])
    .slice(0, MAX_COMPONENTS)
    .map(item => ({ id: newId(), type: item.type, props: sanitizeProps(item.type, item.props || {}) }));
  const bgOk = validateField(PAGE_FIELDS[0], raw.bg);
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 40) : "Mi página",
    bg: bgOk.ok ? bgOk.value : "#ffffff",
    font: FONTS[raw.font] ? raw.font : "sans",
    components
  };
}


/* ---------- 6. MODELO: CREAR COMPONENTES Y PROYECTOS ---------- */
function createComponent(type, props = {}) {
  return { id: newId(), type, props: { ...defaultProps(type), ...props } };
}


function createStarterProject() {
  editor.nextId = 1;
  return {
    name: "Mi página de ejemplo",
    bg: "#ffffff",
    font: "sans",
    components: [
      createComponent("section", { title: "Crea tu página en minutos", text: "Un sitio sencillo, hecho con componentes visuales y sin escribir código." }),
      createComponent("heading", { text: "¿Qué incluye?", level: "h2", align: "center", fontSize: 30 }),
      createComponent("list", { items: "Componentes prediseñados\nEdición en tiempo real\nExportación a un archivo HTML" }),
      createComponent("card", { title: "Diseño personalizable", text: "Cambia colores, tamaños, alineaciones y fondos desde el panel de propiedades." }),
      createComponent("button", { text: "Contáctanos", href: "#contacto", align: "center" })
    ]
  };
}


function createBlankProject() {
  editor.nextId = 1;
  return { name: "Nueva página", bg: "#ffffff", font: "sans", components: [] };
}


/* ---------- 7. NODOS VIRTUALES (estructura de cada componente) ---------- */
function node(tag, cls = "", attrs = {}, text, kids) {
  return { t: tag, c: cls, a: attrs, x: text, k: kids };
}


function paragraphs(text) {
  return splitLines(text).map(line => node("p", "", {}, line));
}


function buildVNode(comp) {
  const p = comp.props;
  switch (comp.type) {
    case "heading":
      return node(p.level, `pg-heading ${comp.id}`, {}, p.text.replace(/\s*\n\s*/g, " "));
    case "paragraph":
      return node("div", `pg-paragraph ${comp.id}`, {}, undefined, paragraphs(p.text));
    case "image":
      return node("div", `pg-image ${comp.id}`, {}, undefined, [
        node("img", "", { src: p.src || PLACEHOLDER, alt: p.alt })
      ]);
    case "button":
      return node("div", `pg-button ${comp.id}`, {}, undefined, [
        node("a", "pg-btn", { href: p.href || "#" }, p.text)
      ]);
    case "card":
      return node("div", `pg-card ${comp.id}`, {}, undefined, [
        node("article", "pg-card-box", {}, undefined, [node("h3", "", {}, p.title), ...paragraphs(p.text)])
      ]);
    case "section":
      return node("section", `pg-section ${comp.id}`, {}, undefined, [
        node("div", "pg-section-inner", {}, undefined, [node("h2", "", {}, p.title), ...paragraphs(p.text)])
      ]);
    case "list": {
      const items = splitLines(p.items);
      return node("div", `pg-list ${comp.id}`, {}, undefined, [
        node(p.listType, "pg-list-items", {}, undefined, (items.length ? items : ["Elemento"]).map(t => node("li", "", {}, t)))
      ]);
    }
    default:
      return node("div", `pg-block ${comp.id}`, {}, undefined, paragraphs(p.text));
  }
}


/* Renderizador 1: nodo virtual -> elementos DOM (seguro: usa textContent) */
function toDOM(vnode) {
  const el = document.createElement(vnode.t);
  if (vnode.c) el.className = vnode.c;
  Object.entries(vnode.a || {}).forEach(([name, value]) => el.setAttribute(name, value));
  if (vnode.x !== undefined) el.textContent = vnode.x;
  (vnode.k || []).forEach(child => el.appendChild(toDOM(child)));
  return el;
}


/* Renderizador 2: nodo virtual -> texto HTML (escapa todo el contenido) */
function toHTML(vnode, depth = 0) {
  const pad = "  ".repeat(depth);
  const attrs =
    (vnode.c ? ` class="${escapeHTML(vnode.c)}"` : "") +
    Object.entries(vnode.a || {}).map(([name, value]) => ` ${name}="${escapeHTML(value)}"`).join("");
  if (VOID_TAGS.includes(vnode.t)) return `${pad}<${vnode.t}${attrs}>`;
  if (vnode.k && vnode.k.length) {
    const inner = vnode.k.map(child => toHTML(child, depth + 1)).join("\n");
    return `${pad}<${vnode.t}${attrs}>\n${inner}\n${pad}</${vnode.t}>`;
  }
  return `${pad}<${vnode.t}${attrs}>${escapeHTML(vnode.x || "")}</${vnode.t}>`;
}


/* ---------- 8. GENERACIÓN DE CSS ---------- */
const px = value => `${value}px`;


function cssRule(selector, props) {
  const lines = Object.entries(props)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}


function componentRules(comp) {
  const p = comp.props;
  const s = `.${comp.id}`;
  const flexAlign = { left: "flex-start", center: "center", right: "flex-end" }[p.align];
  switch (comp.type) {
    case "heading":
    case "paragraph":
    case "block":
      return [cssRule(s, {
        color: p.color, "font-size": px(p.fontSize), "text-align": p.align,
        "background-color": p.bg, padding: px(p.padding), "border-radius": px(p.radius)
      })];
    case "image":
      return [
        cssRule(s, { "text-align": p.align, "background-color": p.bg, padding: px(p.padding) }),
        cssRule(`${s} img`, { width: `${p.width}%`, "border-radius": px(p.radius) })
      ];
    case "button":
      return [
        cssRule(s, { "text-align": p.align, padding: px(p.padding) }),
        cssRule(`${s} .pg-btn`, { color: p.color, "background-color": p.bg, "font-size": px(p.fontSize), "border-radius": px(p.radius) })
      ];
    case "card":
      return [
        cssRule(s, { "justify-content": flexAlign }),
        cssRule(`${s} .pg-card-box`, {
          color: p.color, "font-size": px(p.fontSize), "text-align": p.align,
          "background-color": p.bg, padding: px(p.padding), "border-radius": px(p.radius)
        })
      ];
    case "section":
      return [cssRule(s, {
        color: p.color, "font-size": px(p.fontSize), "text-align": p.align,
        "background-color": p.bg, padding: `${p.padding}px 24px`, "border-radius": px(p.radius)
      })];
    default:
      return [
        cssRule(s, {
          color: p.color, "font-size": px(p.fontSize), "text-align": p.align,
          "background-color": p.bg, padding: px(p.padding), "border-radius": px(p.radius)
        }),
        cssRule(`${s} .pg-list-items`, {
          margin: "0",
          "padding-left": p.align === "left" ? "1.4em" : "0",
          "list-style-position": p.align === "left" ? "outside" : "inside"
        })
      ];
  }
}


const BASE_CSS = [
  "body {\n  margin: 0;\n}",
  ".page, .page * {\n  box-sizing: border-box;\n}",
  ".page {\n  min-height: 100vh;\n  color: #1f2937;\n  line-height: 1.6;\n  overflow-wrap: break-word;\n}",
  ".page img {\n  display: inline-block;\n  max-width: 100%;\n  height: auto;\n  vertical-align: middle;\n}",
  ".pg-heading {\n  margin: 0;\n  font-weight: 700;\n  line-height: 1.2;\n}",
  ".pg-paragraph p, .pg-block p, .pg-card-box p, .pg-section p {\n  margin: 0 0 0.75em;\n}",
  ".pg-paragraph p:last-child, .pg-block p:last-child, .pg-card-box p:last-child, .pg-section p:last-child {\n  margin-bottom: 0;\n}",
  ".pg-card {\n  display: flex;\n  padding: 16px;\n}",
  ".pg-card-box {\n  width: 100%;\n  max-width: 420px;\n  border: 1px solid rgba(0, 0, 0, 0.08);\n  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);\n}",
  ".pg-card-box h3 {\n  margin: 0 0 0.5em;\n  font-size: 1.25em;\n  line-height: 1.25;\n}",
  ".pg-section-inner {\n  max-width: 760px;\n  margin: 0 auto;\n}",
  ".pg-section h2 {\n  margin: 0 0 0.5em;\n  font-size: 1.75em;\n  line-height: 1.2;\n}",
  ".pg-btn {\n  display: inline-block;\n  padding: 0.7em 1.5em;\n  font-weight: 600;\n  text-decoration: none;\n}",
  ".pg-list-items li {\n  margin-bottom: 0.3em;\n}"
];


function generateCSS(project) {
  const pageRule = cssRule(".page", { "background-color": project.bg, "font-family": FONTS[project.font] });
  const rules = project.components.flatMap(componentRules);
  return [...BASE_CSS, pageRule, ...rules].join("\n\n");
}


/* ---------- 9. GENERACIÓN DE HTML ---------- */
function pageRoot(project, tag) {
  return node(tag, "page", {}, undefined, project.components.map(buildVNode));
}


function generateHTML(project) {
  return toHTML(pageRoot(project, "main"), 0);
}


function generateDocument(project) {
  const css = generateCSS(project)
    .split("\n")
    .map(line => (line ? `    ${line}` : line))
    .join("\n");
  return [
    "<!DOCTYPE html>",
    "<html lang=\"es\">",
    "<head>",
    "  <meta charset=\"UTF-8\">",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
    `  <title>${escapeHTML(project.name)}</title>`,
    "  <style>",
    css,
    "  </style>",
    "</head>",
    "<body>",
    toHTML(pageRoot(project, "main"),
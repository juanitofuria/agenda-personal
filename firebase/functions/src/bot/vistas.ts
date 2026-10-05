import { Teclado } from "../canal";
import { esc } from "../canal";
import { formatearFechaHora } from "../fechas";
import { ORDEN_SECCIONES, SECCIONES, Usuario } from "../modelo";
import { modoEfectivo, textoModo } from "../apariencia";
import { signoDe } from "../signos";
import { bloque, cabecera } from "../util";
import { BTN_MENU } from "./ctx";

/** Menú principal listo para enviar: texto, botones y, si hay dirección pública, la cabecera (imagen) del estilo y modo elegidos. */
export interface MenuPrincipal { html: string; teclado: Teclado; foto?: string }

/**
 * Iconos del menú. Informal: pictogramas. Formal: un cuadrado de color como acento (el «filo» de color de las tarjetas del diseño formal).
 * Telegram no permite cambiar la tipografía ni dibujar iconos en los botones: solo texto y emojis.
 */
const ICONOS = {
  informal: { resumen: "📋", nueva: "⏰", eventos: "📅", secciones: "🧩", perfil: "👤", ayuda: "❓", ajustes: "⚙️", acceso: "🔐" },
  formal: { resumen: "🟦", nueva: "🟪", eventos: "🟧", secciones: "🟩", perfil: "🟦", ayuda: "🟥", ajustes: "🟩", acceso: "🟫" },
} as const;

export function menuPrincipal(u: Usuario, admin: boolean, urlBase?: string, ahora: Date = new Date()): MenuPrincipal {
  const ic = ICONOS[u.estilo];
  const modo = modoEfectivo(u, ahora); // con el modo automático, el que toca a esta hora
  const activas = seccionesActivas(u).length;
  const ajustes = activas ? `${activas} ${activas === 1 ? "sección" : "secciones"} activa${activas === 1 ? "" : "s"} · tu perfil` : "Activa tus secciones y completa tu perfil";
  const filas = [
    bloque(ic.resumen, "Resumen de hoy", "Lo que tienes activado, al momento"),
    bloque(ic.nueva, "Alarmas, citas y tareas", "Crearlas, verlas y modificarlas"),
    bloque(ic.ajustes, "Ajustes", ajustes),
  ];
  const cabecera_ = u.estilo === "formal"
    ? [`<b>AGENDA PERSONAL</b>`, `<i>${u.nombre ? `Hola, ${esc(u.nombre)}` : "Bienvenido"} · Tu tiempo, tus planes</i>`, "──────────────"]
    : [cabecera("🗓", "Agenda Personal", u.nombre ? `¡Hola, ${esc(u.nombre)}! 👋` : "¿Qué quieres hacer?")];
  const html = [...cabecera_, "", filas.join("\n\n"), "", u.estilo === "formal" ? "<i>Seleccione una opción 👇</i>" : "<i>Elige una opción 👇</i>"].join("\n");

  const b = (icono: string, texto: string, datos: string, color?: "primary" | "success" | "danger") => ({ texto: `${icono} ${texto}`, datos, ...(color ? { color } : {}) });
  const resumen = b(ic.resumen, "Resumen de hoy", "m:hoy", "primary"), nueva = b(ic.nueva, "Nueva alarma, cita o tarea", "n:menu");
  const eventos = b(ic.eventos, "Mis eventos", "e:lista"), secciones = b(ic.secciones, "Mis secciones", "s:lista", "success");
  const perfil = b(ic.perfil, "Mi perfil", "p:ver", "primary"), ayuda = b(ic.ayuda, "Ayuda", "m:ayuda", "danger");
  const teclado: Teclado =
    u.estilo === "formal" ? [[resumen, eventos], [nueva, secciones], [perfil, ayuda]]
      : modo === "oscuro" ? [[resumen], [nueva, eventos], [secciones, perfil], [ayuda]]
        : [[resumen, eventos], [nueva, secciones], [perfil], [ayuda]];
  if (admin) teclado.splice(teclado.length - 1, 0, [b(ic.acceso, "Acceso", "acc:menu")]);
  return { html, teclado, ...(urlBase ? { foto: `${urlBase.replace(/\/+$/, "")}/menu-${u.estilo}-${modo}.png` } : {}) };
}

export const textoAyuda = [
  cabecera("❓", "Ayuda", "Cómo funciona tu agenda"),
  "",
  bloque("📬", "Qué recibes", "Cada día, a la hora que elijas: el tiempo, las noticias, tu agenda, tu horóscopo y los temas que sigas.", "Y un aviso de cada alarma, cita o tarea."),
  "",
  bloque("⌨️", "Comandos",
    "/menu · menú principal",
    "/hoy · resumen de hoy",
    "/nueva · crear alarma, cita o tarea",
    "/eventos · ver y modificar lo creado",
    "/secciones · activar y cambiar horas",
    "/perfil · tus datos",
    "/cancelar · cancelar lo que haces",
    "/borrar · borrar todos tus datos"),
  "",
  bloque("🕒", "Fechas", "Escríbelas como quieras:", "• mañana 9:30", "• 15/10 18:00", "• lunes 10h", "• en 2 horas"),
].join("\n");

/** Secciones activas del usuario (integradas y temas) con su emoji y título. */
export function seccionesActivas(u: Usuario): { ref: string; emoji: string; titulo: string }[] {
  const base = ORDEN_SECCIONES.filter((s) => u.secciones[s]?.activa).map((s) => ({ ref: s as string, emoji: SECCIONES[s].emoji, titulo: SECCIONES[s].titulo }));
  const temas = u.temas.filter((t) => t.activa).map((t) => ({ ref: `tema:${t.id}`, emoji: t.emoji, titulo: t.titulo }));
  return [...base, ...temas];
}

export function tecladoHoy(u: Usuario): Teclado {
  const filas: Teclado = [];
  const botones = [...ORDEN_SECCIONES.map((s) => ({ texto: `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`, datos: `sec:${s}` })),
    ...u.temas.filter((t) => t.activa).map((t) => ({ texto: `${t.emoji} ${t.titulo}`, datos: `sec:tema:${t.id}` }))];
  for (let i = 0; i < botones.length; i += 2) filas.push(botones.slice(i, i + 2));
  filas.push([{ texto: "📋 Todo lo activado", datos: "sec:todo" }], [BTN_MENU]);
  return filas;
}

export function textoPerfil(u: Usuario): string {
  const signo = u.nacimiento ? signoDe(u.nacimiento) : null;
  const sin = "<i>sin indicar</i>";
  return [
    cabecera("👤", "Tu perfil", "Los datos con los que preparo tus resúmenes"),
    "",
    bloque("✏️", "Nombre", u.nombre ? esc(u.nombre) : sin),
    "",
    bloque("🎂", "Nacimiento", u.nacimiento ? `${u.nacimiento.split("-").reverse().join("/")} · ${signo!.simbolo} ${signo!.nombre}` : sin),
    "",
    bloque("📍", "Ciudad", u.ciudad ? `${esc(u.ciudad.nombre)}${u.ciudad.provincia ? ` (${esc(u.ciudad.provincia)})` : ""}` : sin),
    "",
    bloque("🕐", "Zona horaria", esc(u.zona)),
    "",
    bloque("🎨", "Apariencia", `${u.estilo === "formal" ? "Formal" : "Informal"} · ${textoModo(u).toLowerCase()}`),
    "",
    "<i>Solo guardo esto para prepararte los resúmenes. Puedes borrarlo cuando quieras con /borrar.</i>",
  ].join("\n");
}

export const tecladoPerfil: Teclado = [
  [{ texto: "✏️ Nombre", datos: "p:nombre" }, { texto: "🎂 Nacimiento", datos: "p:nacimiento" }],
  [{ texto: "📍 Ciudad", datos: "p:ciudad" }, { texto: "🎨 Apariencia", datos: "p:apar" }],
  [{ texto: "🗑 Borrar mis datos", datos: "p:borrar" }],
  [BTN_MENU],
];

export const cuando = (d: Date | null, zona: string, ahora: Date) => (d ? formatearFechaHora(d, zona, ahora) : "sin fecha");

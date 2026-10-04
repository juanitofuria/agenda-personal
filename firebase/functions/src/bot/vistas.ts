import { Teclado } from "../canal";
import { esc } from "../canal";
import { formatearFechaHora } from "../fechas";
import { ORDEN_SECCIONES, SECCIONES, Usuario } from "../modelo";
import { signoDe } from "../signos";
import { bloque, cabecera } from "../util";
import { BTN_MENU } from "./ctx";

export function textoMenu(u: Usuario): string {
  const activas = seccionesActivas(u).length;
  return [
    cabecera("🗓", "Agenda Personal", u.nombre ? `Hola, ${esc(u.nombre)} 👋` : "¿Qué quieres hacer?"),
    "",
    bloque("📋", "Resumen de hoy", "Lo que tienes activado, al momento"),
    "",
    bloque("⏰", "Alarmas, citas y tareas", "Crearlas, verlas y modificarlas"),
    "",
    bloque("⚙️", "Ajustes", activas ? `${activas} ${activas === 1 ? "sección" : "secciones"} activa${activas === 1 ? "" : "s"} · tu perfil` : "Activa tus secciones y completa tu perfil"),
    "",
    "<i>Elige una opción 👇</i>",
  ].join("\n");
}

export const tecladoMenu: Teclado = [
  [{ texto: "📋 Resumen de hoy", datos: "m:hoy" }],
  [{ texto: "➕ Nueva alarma, cita o tarea", datos: "n:menu" }, { texto: "📅 Mis eventos", datos: "e:lista" }],
  [{ texto: "🧩 Mis secciones", datos: "s:lista" }, { texto: "👤 Mi perfil", datos: "p:ver" }],
  [{ texto: "❓ Ayuda", datos: "m:ayuda" }],
];

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
    "<i>Solo guardo esto para prepararte los resúmenes. Puedes borrarlo cuando quieras con /borrar.</i>",
  ].join("\n");
}

export const tecladoPerfil: Teclado = [
  [{ texto: "✏️ Nombre", datos: "p:nombre" }, { texto: "🎂 Nacimiento", datos: "p:nacimiento" }],
  [{ texto: "📍 Ciudad", datos: "p:ciudad" }, { texto: "🗑 Borrar mis datos", datos: "p:borrar" }],
  [BTN_MENU],
];

export const cuando = (d: Date | null, zona: string, ahora: Date) => (d ? formatearFechaHora(d, zona, ahora) : "sin fecha");

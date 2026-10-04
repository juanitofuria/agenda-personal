import { Teclado } from "../canal";
import { esc } from "../canal";
import { formatearFechaHora } from "../fechas";
import { ORDEN_SECCIONES, SECCIONES, Usuario } from "../modelo";
import { signoDe } from "../signos";
import { BTN_MENU } from "./ctx";

export function textoMenu(u: Usuario): string {
  return `🗓 <b>Agenda Personal</b>\n${u.nombre ? `Hola, ${esc(u.nombre)}. ` : ""}¿Qué quieres hacer?`;
}

export const tecladoMenu: Teclado = [
  [{ texto: "📋 Resumen de hoy", datos: "m:hoy" }],
  [{ texto: "➕ Nueva alarma, cita o tarea", datos: "n:menu" }, { texto: "📅 Mis eventos", datos: "e:lista" }],
  [{ texto: "🧩 Mis secciones", datos: "s:lista" }, { texto: "👤 Mi perfil", datos: "p:ver" }],
  [{ texto: "❓ Ayuda", datos: "m:ayuda" }],
];

export const textoAyuda = [
  "❓ <b>Ayuda</b>",
  "Te mando cada día, a la hora que elijas, el tiempo, las noticias, tu agenda, tu horóscopo y los temas que sigas. También te aviso de tus alarmas, citas y tareas.",
  "",
  "<b>Comandos</b>",
  "/menu — menú principal",
  "/hoy — resumen de hoy",
  "/nueva — nueva alarma, cita o tarea",
  "/eventos — tus alarmas, citas y tareas",
  "/secciones — activar, desactivar y cambiar horas",
  "/perfil — tus datos",
  "/cancelar — cancelar lo que estés haciendo",
  "/borrar — borrar todos tus datos",
  "",
  "<i>Al crear un evento puedes escribir la fecha como quieras: «mañana 9:30», «15/10 18:00», «lunes 10h», «en 2 horas».</i>",
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
  return [
    "👤 <b>Tu perfil</b>",
    `Nombre: ${u.nombre ? esc(u.nombre) : "<i>sin indicar</i>"}`,
    `Nacimiento: ${u.nacimiento ? `${u.nacimiento.split("-").reverse().join("/")} · ${signo!.simbolo} ${signo!.nombre}` : "<i>sin indicar</i>"}`,
    `Ciudad: ${u.ciudad ? `${esc(u.ciudad.nombre)}${u.ciudad.provincia ? ` (${esc(u.ciudad.provincia)})` : ""}` : "<i>sin indicar</i>"}`,
    `Zona horaria: ${esc(u.zona)}`,
    "",
    "<i>Solo guardo estos datos para prepararte los resúmenes. Puedes borrarlos cuando quieras con /borrar.</i>",
  ].join("\n");
}

export const tecladoPerfil: Teclado = [
  [{ texto: "✏️ Nombre", datos: "p:nombre" }, { texto: "🎂 Nacimiento", datos: "p:nacimiento" }],
  [{ texto: "📍 Ciudad", datos: "p:ciudad" }, { texto: "🗑 Borrar mis datos", datos: "p:borrar" }],
  [BTN_MENU],
];

export const cuando = (d: Date | null, zona: string, ahora: Date) => (d ? formatearFechaHora(d, zona, ahora) : "sin fecha");

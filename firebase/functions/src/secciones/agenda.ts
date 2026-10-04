import { esc } from "../canal";
import { fechaIso, formatearFechaHora, partesEnZona } from "../fechas";
import { Evento } from "../modelo";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

export const EMOJI_TIPO = { alarma: "⏰", cita: "🩺", tarea: "✅" } as const;

const hhmm = (d: Date, zona: string) => { const p = partesEnZona(d, zona); return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };

export function lineaEvento(e: Evento, zona: string, ahora: Date): string {
  const cuando = e.fechaHora ? formatearFechaHora(e.fechaHora, zona, ahora) : "sin fecha";
  return `${EMOJI_TIPO[e.tipo]} ${esc(e.titulo)}${e.lugar ? ` (${esc(e.lugar)})` : ""} <i>· ${cuando}</i>`;
}

/** Citas y alarmas de hoy y mañana, y tareas pendientes. */
export async function contenidoAgenda(ctx: Contexto): Promise<Contenido> {
  const { usuario: u, ahora } = ctx;
  const todos = await ctx.almacen.listarEventos(u.id);
  const hoy = fechaIso(ahora, u.zona);
  const manana = fechaIso(new Date(ahora.getTime() + 24 * 3_600_000), u.zona);
  const proximos = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && [hoy, manana].includes(fechaIso(e.fechaHora, u.zona)) && (e.repeticion !== "ninguna" || e.fechaHora.getTime() >= ahora.getTime() - 3_600_000))
    .sort((a, b) => a.fechaHora!.getTime() - b.fechaHora!.getTime());
  const tareas = todos.filter((e) => e.tipo === "tarea" && !e.hecho);
  const lineasEv = proximos.map((e) => `${EMOJI_TIPO[e.tipo]} ${fechaIso(e.fechaHora!, u.zona) === hoy ? "hoy" : "mañana"} ${hhmm(e.fechaHora!, u.zona)} · ${esc(e.titulo)}${e.lugar ? ` (${esc(e.lugar)})` : ""}`);
  const lineasTa = tareas.map((e) => `• ${esc(e.titulo)}${e.fechaHora ? ` <i>(${formatearFechaHora(e.fechaHora, u.zona, ahora)})</i>` : ""}`);
  const html = [
    "🗓 <b>Tu agenda</b>",
    "<b>Hoy y mañana</b>\n" + (lineasEv.length ? lineasEv.join("\n") : "<i>Sin citas ni alarmas.</i>"),
    "<b>Tareas pendientes</b>\n" + (lineasTa.length ? lineasTa.join("\n") : "<i>Nada pendiente 🎉</i>"),
  ].join("\n\n");
  return { html, teclado: [[{ texto: "➕ Nueva", datos: "n:menu" }, { texto: "📅 Mis eventos", datos: "e:lista" }], NAV_MENU] };
}

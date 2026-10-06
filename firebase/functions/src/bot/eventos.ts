import { esc, Teclado } from "../canal";
import { formatearFechaHora, parseFechaHora, Repeticion } from "../fechas";
import { Evento, momentoAviso, TipoEvento } from "../modelo";
import { cancelarEvento, posponerEvento, programarEvento } from "../programar";
import { EMOJI_TIPO } from "../secciones/agenda";
import { bloque, cabecera } from "../util";
import { BTN_CANCELAR, BTN_MENU, Ctx } from "./ctx";
import { enlaceWhatsApp } from "../whatsapp";

const NOMBRE_TIPO: Record<TipoEvento, string> = { alarma: "Alarma", cita: "Cita", tarea: "Tarea", mensaje: "Mensaje de WhatsApp", nota: "Nota" };
const REP_TEXTO: Record<Repeticion, string> = { ninguna: "solo una vez", diaria: "cada día", semanal: "cada semana", laborables: "de lunes a viernes", anual: "cada año" };
const ANT_TEXTO = (m: number) => (m === 0 ? "sin aviso previo" : m < 60 ? `${m} min antes` : m < 1440 ? `${m / 60} h antes` : `${m / 1440} día${m >= 2880 ? "s" : ""} antes`);

const AYUDA_CUANDO = [
  cabecera("🕒", "¿Cuándo?", "Escríbelo como quieras"),
  "",
  "• <i>mañana 9:30</i>",
  "• <i>15/10 18:00</i>",
  "• <i>lunes 10h</i>",
  "• <i>en 2 horas</i>",
  "",
  "<i>O elige un atajo 👇</i>",
].join("\n");
const TECLADO_CUANDO = (extra: Teclado = []): Teclado => [
  [{ texto: "En 1 hora", datos: "n:t:1h" }, { texto: "Mañana 9:00", datos: "n:t:m9" }, { texto: "Mañana 18:00", datos: "n:t:m18" }],
  ...extra, [BTN_CANCELAR],
];

/** Detalle de un evento con sus acciones. */
export function textoEvento(e: Evento, zona: string, ahora: Date): string {
  const bloques = [
    cabecera(EMOJI_TIPO[e.tipo], esc(e.titulo), NOMBRE_TIPO[e.tipo]),
    "",
    bloque("🕐", "Cuándo", e.fechaHora ? formatearFechaHora(e.fechaHora, zona, ahora) : "<i>sin fecha</i>"),
  ];
  if (e.lugar) bloques.push("", bloque("📍", "Dónde", esc(e.lugar)));
  if (e.mensaje) bloques.push("", bloque("💬", `Para ${esc(e.mensaje.para || "quien elijas")}`, `«${esc(e.mensaje.texto)}»`));
  if (e.nota) bloques.push("", bloque("📝", "Nota", esc(e.nota)));
  if (e.tipo === "cita") bloques.push("", bloque("🔔", "Aviso", ANT_TEXTO(e.antelacionMin)));
  if (e.tipo === "alarma" || e.repeticion !== "ninguna") bloques.push("", bloque("🔁", "Se repite", REP_TEXTO[e.repeticion]));
  if (e.tipo === "tarea" && e.hecho) bloques.push("", bloque("✅", "Estado", "Hecha"));
  return bloques.join("\n");
}

function tecladoEvento(e: Evento): Teclado {
  const filas: Teclado = [[{ texto: "✏️ Título", datos: `e:ed:titulo:${e.id}` }, { texto: "🕒 Fecha y hora", datos: `e:ed:cuando:${e.id}` }]];
  if (e.tipo === "cita") filas.push([{ texto: "📍 Lugar", datos: `e:ed:lugar:${e.id}` }, { texto: "🔔 Antelación", datos: `e:ed:ant:${e.id}` }]);
  if (e.tipo !== "tarea") filas.push([{ texto: "🔁 Repetición", datos: `e:ed:rep:${e.id}` }]);
  if (e.tipo === "tarea") filas.push([{ texto: e.hecho ? "↩️ Marcar pendiente" : "✅ Marcar hecha", datos: `e:hecho:${e.id}` }]);
  filas.push([{ texto: "🗑 Eliminar", datos: `e:del:${e.id}` }], [{ texto: "⬅️ Mis eventos", datos: "e:lista" }, BTN_MENU]);
  return filas;
}

async function verEvento(c: Ctx, e: Evento): Promise<void> { await c.responder(textoEvento(e, c.u.zona, c.ahora), tecladoEvento(e)); }

const recortar = (t: string, n = 34) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

export async function lista(c: Ctx): Promise<void> {
  const ahora = c.ahora;
  const todos = await c.almacen.listarEventos(c.u.id);
  const futuros = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && (e.repeticion !== "ninguna" || e.fechaHora.getTime() > ahora.getTime())).sort((a, b) => a.fechaHora!.getTime() - b.fechaHora!.getTime());
  const tareas = todos.filter((e) => e.tipo === "tarea").sort((a, b) => Number(a.hecho) - Number(b.hecho) || (a.fechaHora?.getTime() ?? Infinity) - (b.fechaHora?.getTime() ?? Infinity));
  const pasados = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && e.repeticion === "ninguna" && e.fechaHora.getTime() <= ahora.getTime()).sort((a, b) => b.fechaHora!.getTime() - a.fechaHora!.getTime()).slice(0, 4);
  const filas: Teclado = [
    ...futuros.slice(0, 10).map((e) => [{ texto: `${EMOJI_TIPO[e.tipo]} ${formatearFechaHora(e.fechaHora!, c.u.zona, ahora)} · ${recortar(e.titulo)}`, datos: `e:ver:${e.id}` }]),
    ...tareas.slice(0, 8).map((e) => [{ texto: `${e.hecho ? "☑️" : "✅"} ${recortar(e.titulo)}${e.fechaHora ? ` · ${formatearFechaHora(e.fechaHora, c.u.zona, ahora)}` : ""}`, datos: `e:ver:${e.id}` }]),
    ...pasados.map((e) => [{ texto: `🕘 ${recortar(e.titulo)}`, datos: `e:ver:${e.id}` }]),
    [{ texto: "➕ Nueva", datos: "n:menu" }, BTN_MENU],
  ];
  const vacio = futuros.length + tareas.length + pasados.length === 0;
  const pendientes = tareas.filter((t) => !t.hecho).length;
  await c.responder(vacio
    ? [cabecera("📅", "Mis eventos", "Aún no hay nada"), "", "Todavía no tienes alarmas, citas ni tareas.", "", "<i>¡Crea la primera con «➕ Nueva»! 👇</i>"].join("\n")
    : [
      cabecera("📅", "Mis eventos", `${futuros.length} próximo${futuros.length === 1 ? "" : "s"} · ${pendientes} tarea${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`),
      "",
      bloque("🔎", "Cómo leerlo", "⏰ alarma · 🩺 cita · ✅ tarea · 🕘 pasado"),
      "",
      "<i>Toca uno para verlo, modificarlo o eliminarlo 👇</i>",
    ].join("\n"), filas);
}

export async function menuNueva(c: Ctx): Promise<void> {
  await c.responder([
    cabecera("➕", "Crear nuevo", "¿Qué quieres crear?"),
    "",
    bloque("⏰", "Alarma", "Te avisa a una hora y puede repetirse"),
    "",
    bloque("🩺", "Cita", "Con lugar y aviso con antelación"),
    "",
    bloque("✅", "Tarea", "Algo pendiente, con o sin fecha"),
  ].join("\n"), [
    [{ texto: "⏰ Alarma", datos: "n:tipo:alarma" }, { texto: "🩺 Cita", datos: "n:tipo:cita" }, { texto: "✅ Tarea", datos: "n:tipo:tarea" }],
    [BTN_MENU],
  ]);
}

interface DatosNuevo { tipo: TipoEvento; titulo?: string; cuando?: string; lugar?: string; ant?: number; rep?: Repeticion }

/** Guarda el evento que se estaba creando y lo programa. */
async function guardarNuevo(c: Ctx, d: DatosNuevo): Promise<void> {
  const ahora = c.ahora;
  const fecha = d.cuando ? new Date(d.cuando) : null;
  let ant = d.tipo === "cita" ? d.ant ?? 60 : 0;
  let aviso = "";
  if (fecha && fecha.getTime() - ant * 60_000 <= ahora.getTime() && ant > 0) { ant = 0; aviso = "\n<i>El aviso previo ya habría pasado, así que te avisaré a la hora del evento.</i>"; }
  const base = { uid: c.u.id, tipo: d.tipo, titulo: d.titulo ?? "Sin título", lugar: d.lugar ?? "", fechaHora: fecha, antelacionMin: ant, repeticion: d.rep ?? "ninguna", avisado: false, hecho: false, creadoEn: ahora } satisfies Omit<Evento, "id">;
  let ev = await c.almacen.guardarEvento(base);
  ev = await programarEvento(c.almacen, ev, c.u.zona, ahora);
  await c.almacen.guardarEvento(ev);
  await c.terminarFlujo();
  const extra = ev.fechaHora && momentoAviso(ev)!.getTime() > ahora.getTime() ? "" : ev.fechaHora ? "" : "\n<i>Sin fecha: no habrá aviso.</i>";
  await c.responder(`✅ <b>¡Guardado!</b>\n\n${textoEvento(ev, c.u.zona, ahora)}${aviso}${extra}`, [[{ texto: "📅 Ver mis eventos", datos: "e:lista" }, { texto: "➕ Otra", datos: "n:menu" }], [BTN_MENU]]);
}

async function preguntarTrasFecha(c: Ctx, d: DatosNuevo): Promise<void> {
  if (d.tipo === "cita") {
    c.u.estado = { flujo: "nuevo", paso: "lugar", datos: d as unknown as Record<string, unknown> }; await c.guardar();
    await c.nuevo([cabecera("📍", "¿Dónde es?", "Paso 3: el lugar"), "", "<i>Por ejemplo: hospital, consulta, centro de salud…</i>"].join("\n"), [[{ texto: "Omitir", datos: "n:skip" }], [BTN_CANCELAR]]);
  } else if (d.tipo === "alarma") {
    c.u.estado = { flujo: "nuevo", paso: "rep", datos: d as unknown as Record<string, unknown> }; await c.guardar();
    await c.nuevo([cabecera("🔁", "¿Se repite?", "Paso 3: la repetición"), "", "<i>Elige una opción 👇</i>"].join("\n"), [[{ texto: "Solo una vez", datos: "n:rep:ninguna" }, { texto: "Cada día", datos: "n:rep:diaria" }], [{ texto: "Lunes a viernes", datos: "n:rep:laborables" }, { texto: "Cada semana", datos: "n:rep:semanal" }], [BTN_CANCELAR]]);
  } else {
    await guardarNuevo(c, d);
  }
}

const TEXTO_ANT = [cabecera("🔔", "¿Cuándo te aviso?", "Paso 4: la antelación"), "", "<i>¿Cuánto tiempo antes quieres el aviso? 👇</i>"].join("\n");
const TECLADO_ANT: Teclado = [[{ texto: "30 min", datos: "n:ant:30" }, { texto: "1 h", datos: "n:ant:60" }, { texto: "3 h", datos: "n:ant:180" }, { texto: "1 día", datos: "n:ant:1440" }], [{ texto: "Sin aviso previo", datos: "n:ant:0" }], [BTN_CANCELAR]];

/** Interpreta una fecha escrita; si no vale, avisa y devuelve null. */
async function leerCuando(c: Ctx, texto: string): Promise<Date | null> {
  const r = parseFechaHora(texto, c.ahora, c.u.zona);
  if (!r) { await c.nuevo("No he entendido la fecha 🤔\n" + AYUDA_CUANDO, TECLADO_CUANDO()); return null; }
  if (r.pasada) { await c.nuevo("Esa fecha ya ha pasado. Prueba con otra.", TECLADO_CUANDO()); return null; }
  return r.utc;
}

const ATAJOS: Record<string, string> = { "1h": "en 60 min", m9: "mañana 9:00", m18: "mañana 18:00" };

export async function callback(c: Ctx, p: string[]): Promise<boolean> {
  const [ns, acc, a1, a2] = p;
  if (ns === "n") {
    if (acc === "menu") { await menuNueva(c); return true; }
    if (acc === "tipo") {
      const tipo = a1 as TipoEvento;
      await c.esperar("nuevo", "titulo", { tipo });
      await c.responder([cabecera(EMOJI_TIPO[tipo], `Nueva ${NOMBRE_TIPO[tipo].toLowerCase()}`, "Paso 1: el nombre"), "", "¿Cómo la llamamos?", "", `<i>Por ejemplo: ${tipo === "cita" ? "Cardiología" : tipo === "alarma" ? "Tomar la pastilla" : "Llamar al fontanero"}</i>`].join("\n"), [[BTN_CANCELAR]]);
      return true;
    }
    if (c.estado?.flujo !== "nuevo") { await menuNueva(c); return true; } // botón de una creación ya terminada
    const d = c.estado.datos as unknown as DatosNuevo;
    if (acc === "t") { // atajo de fecha
      const f = await leerCuando(c, ATAJOS[a1] ?? ""); if (!f) return true;
      d.cuando = f.toISOString(); await preguntarTrasFecha(c, d); return true;
    }
    if (acc === "sinfecha") { await guardarNuevo(c, d); return true; }
    if (acc === "skip") { d.lugar = ""; c.u.estado = { flujo: "nuevo", paso: "ant", datos: d as unknown as Record<string, unknown> }; await c.guardar(); await c.responder(TEXTO_ANT, TECLADO_ANT); return true; }
    if (acc === "ant") { d.ant = +a1; await guardarNuevo(c, d); return true; }
    if (acc === "rep") { d.rep = a1 as Repeticion; await guardarNuevo(c, d); return true; }
    return true;
  }

  // ns === "e"
  if (acc === "lista") { await lista(c); return true; }
  // Formatos: e:ver:<id>, e:ed:<campo>:<id>, e:rep:<repetición>:<id>, e:ant:<minutos>:<id>
  const id = acc === "ed" || acc === "rep" || acc === "ant" ? p[3] : a1;
  const ev = id ? await c.almacen.getEvento(c.u.id, id) : null;
  if (!ev) { await c.responder("Ese evento ya no existe.", [[{ texto: "📅 Mis eventos", datos: "e:lista" }, BTN_MENU]]); return true; }
  const ahora = c.ahora;
  switch (acc) {
    case "ver": await verEvento(c, ev); return true;
    case "del": await c.responder([cabecera("🗑", "¿Eliminar?", esc(ev.titulo)), "", "<i>No se puede deshacer.</i>"].join("\n"), [[{ texto: "🗑 Sí, eliminar", datos: `e:delok:${ev.id}` }, { texto: "Cancelar", datos: `e:ver:${ev.id}` }]]); return true;
    case "delok": await cancelarEvento(c.almacen, c.u.id, ev.id); await c.responder(`🗑 Eliminado: <b>${esc(ev.titulo)}</b>`, [[{ texto: "📅 Mis eventos", datos: "e:lista" }, BTN_MENU]]); return true;
    case "keep": await c.responder(`✅ Conservado: <b>${esc(ev.titulo)}</b>`, [[{ texto: "✏️ Modificar", datos: `e:ver:${ev.id}` }, { texto: "📅 Mis eventos", datos: "e:lista" }]]); return true;
    case "snz": {
      const cuando = await posponerEvento(c.almacen, c.u.id, ev.id, 10, ahora);
      await c.responder(`💤 Te lo recuerdo de nuevo a las ${formatearFechaHora(cuando, c.u.zona).split(" · ")[1]}: <b>${esc(ev.titulo)}</b>`); return true;
    }
    case "hecho": { const nuevo = { ...ev, hecho: !ev.hecho }; await c.almacen.guardarEvento(nuevo); await programarEvento(c.almacen, nuevo, c.u.zona, ahora); await verEvento(c, nuevo); return true; }
    case "ed": {
      const campo = a1;
      if (campo === "rep") { await c.responder([cabecera("🔁", "¿Se repite?", esc(ev.titulo)), "", "<i>Elige una opción 👇</i>"].join("\n"), [[{ texto: "Solo una vez", datos: `e:rep:ninguna:${ev.id}` }, { texto: "Cada día", datos: `e:rep:diaria:${ev.id}` }], [{ texto: "Lunes a viernes", datos: `e:rep:laborables:${ev.id}` }, { texto: "Cada semana", datos: `e:rep:semanal:${ev.id}` }], [{ texto: "Cancelar", datos: `e:ver:${ev.id}` }]]); return true; }
      if (campo === "ant") { await c.responder([cabecera("🔔", "¿Cuándo te aviso?", esc(ev.titulo)), "", "<i>¿Cuánto tiempo antes quieres el aviso? 👇</i>"].join("\n"), [[30, 60, 180, 1440].map((m) => ({ texto: ANT_TEXTO(m).replace(" antes", ""), datos: `e:ant:${m}:${ev.id}` })), [{ texto: "Sin aviso previo", datos: `e:ant:0:${ev.id}` }, { texto: "Cancelar", datos: `e:ver:${ev.id}` }]]); return true; }
      await c.esperar("editar", campo, { id: ev.id });
      const pregunta = campo === "titulo" ? [cabecera("✏️", "Nuevo título", esc(ev.titulo)), "", "<i>Escríbelo ahora 👇</i>"].join("\n") : campo === "lugar" ? [cabecera("📍", "Nuevo lugar", esc(ev.titulo)), "", "<i>Escríbelo ahora 👇</i>"].join("\n") : AYUDA_CUANDO;
      await c.responder(pregunta, campo === "cuando" ? TECLADO_CUANDO() : [[BTN_CANCELAR]]);
      return true;
    }
    case "rep": { const nuevo = await programarEvento(c.almacen, { ...ev, repeticion: a1 as Repeticion }, c.u.zona, ahora); await c.almacen.guardarEvento(nuevo); await verEvento(c, nuevo); return true; }
    case "ant": { const nuevo = await programarEvento(c.almacen, { ...ev, antelacionMin: +a1 }, c.u.zona, ahora); await c.almacen.guardarEvento(nuevo); await verEvento(c, nuevo); return true; }
    default: return true;
  }
}

/** Respuestas de texto: creación de un evento (título, fecha, lugar) o edición de un campo. */
export async function texto(c: Ctx): Promise<boolean> {
  const est = c.estado;
  if (!est) return false;
  if (est.flujo === "nuevo") {
    const d = est.datos as unknown as DatosNuevo;
    if (est.paso === "titulo") {
      d.titulo = c.texto.slice(0, 80);
      c.u.estado = { flujo: "nuevo", paso: "cuando", datos: d as unknown as Record<string, unknown> }; await c.guardar();
      await c.nuevo(AYUDA_CUANDO, TECLADO_CUANDO(d.tipo === "tarea" ? [[{ texto: "Sin fecha", datos: "n:sinfecha" }]] : []));
      return true;
    }
    if (est.paso === "cuando") {
      const r = parseFechaHora(c.texto, c.ahora, c.u.zona);
      const f = await leerCuando(c, c.texto); if (!f) return true;
      d.cuando = f.toISOString();
      if (r?.horaPorDefecto) await c.nuevo("<i>No indicaste hora: uso las 09:00.</i>");
      await preguntarTrasFecha(c, d); return true;
    }
    if (est.paso === "lugar") {
      d.lugar = c.texto.slice(0, 80);
      c.u.estado = { flujo: "nuevo", paso: "ant", datos: d as unknown as Record<string, unknown> }; await c.guardar();
      await c.nuevo(TEXTO_ANT, TECLADO_ANT); return true;
    }
    return false;
  }
  if (est.flujo === "editar") {
    const id = String(est.datos.id);
    const ev = await c.almacen.getEvento(c.u.id, id);
    if (!ev) { await c.terminarFlujo(); await c.nuevo("Ese evento ya no existe.", [[BTN_MENU]]); return true; }
    let nuevo: Evento = ev;
    if (est.paso === "titulo") nuevo = { ...ev, titulo: c.texto.slice(0, 80) };
    else if (est.paso === "lugar") nuevo = { ...ev, lugar: c.texto.slice(0, 80) };
    else if (est.paso === "cuando") {
      const f = await leerCuando(c, c.texto); if (!f) return true;
      nuevo = { ...ev, fechaHora: f, avisado: false };
    } else return false;
    nuevo = await programarEvento(c.almacen, nuevo, c.u.zona, c.ahora);
    await c.almacen.guardarEvento(nuevo);
    await c.terminarFlujo();
    await c.nuevo(`✅ Actualizado\n\n${textoEvento(nuevo, c.u.zona, c.ahora)}`, tecladoEvento(nuevo));
    return true;
  }
  return false;
}

/** Mensaje de aviso de un evento, con los botones Eliminar / Conservar / Modificar / Posponer. */
export function mensajeAviso(e: Evento, zona: string, ahora: Date, retrasado = false): { html: string; teclado: Teclado } {
  const cuando = e.fechaHora ? formatearFechaHora(e.fechaHora, zona, ahora) : "";
  const frase = e.tipo === "cita" ? "Tienes una cita" : e.tipo === "tarea" ? "Tienes una tarea pendiente" : e.tipo === "mensaje" ? "Es la hora de enviar un mensaje" : "Es la hora de tu alarma";
  const bloques = [cabecera(EMOJI_TIPO[e.tipo], esc(e.titulo), `${frase}${retrasado ? " · aviso retrasado" : ""}`)];
  if (e.antelacionMin > 0 && cuando) bloques.push("", bloque("⏳", "Es", `${cuando} <i>(${ANT_TEXTO(e.antelacionMin).replace("antes", "de antelación")})</i>`));
  if (e.lugar) bloques.push("", bloque("📍", "Dónde", esc(e.lugar)));
  if (e.mensaje) bloques.push("", bloque("💬", `Para ${esc(e.mensaje.para || "quien elijas")}`, `«${esc(e.mensaje.texto)}»`), "", "<i>Pulsa el botón verde: se abre WhatsApp con el mensaje escrito y solo tienes que enviarlo 👇</i>");
  else bloques.push("", "<i>¿Qué hago con él? 👇</i>");
  const html = bloques.join("\n");
  return {
    html,
    teclado: [
      ...(e.mensaje ? [[{ texto: "💬 Enviar por WhatsApp", url: enlaceWhatsApp(e.mensaje), color: "success" as const }]] : []),
      [{ texto: "🗑 Eliminar", datos: `e:delok:${e.id}` }, { texto: "✅ Conservar", datos: `e:keep:${e.id}` }, { texto: "✏️ Modificar", datos: `e:ver:${e.id}` }],
      [{ texto: "💤 Posponer 10 min", datos: `e:snz:${e.id}` }],
    ],
  };
}

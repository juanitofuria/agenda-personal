import { Entrada, esc, Teclado } from "../canal";
import { Acceso } from "../modelo";
import { bloque, cabecera } from "../util";
import { BTN_MENU, Ctx, Deps } from "./ctx";

/**
 * Bot privado. Si hay administrador (`deps.adminId`), solo entran él y quien llegue con una invitación suya:
 *   - un enlace de invitación (`/invitar`): un uso, caduca;
 *   - o una solicitud de acceso que el administrador aprueba (se le manda una invitación personal, solo válida para esa persona).
 * Los demás reciben un aviso de que el bot es privado y un botón para pedir acceso.
 */
const DIAS_INVITACION = 7;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // sin letras que se confunden (I, l, O, 0, 1)

export const nuevoCodigo = (): string => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(14)), (b) => ALFABETO[b % ALFABETO.length]).join("");

const quien = (nombre: string, usuario: string | undefined, id: string) =>
  `${esc(nombre || "Sin nombre")}${usuario ? ` (@${esc(usuario)})` : ""} · <code>${esc(id)}</code>`;

/** Enlace que abre el bot y entra con la invitación (null si no se conoce el nombre del bot). */
async function enlace(deps: Deps, codigo: string): Promise<string | null> {
  const bot = await deps.canal.nombreUsuario?.().catch(() => undefined);
  return bot ? `https://t.me/${bot}?start=inv_${codigo}` : null;
}

async function avisarAdmin(deps: Deps, html: string, teclado?: Teclado): Promise<void> {
  if (!deps.adminId) return;
  try { await deps.canal.enviar(deps.adminId, html, teclado); } catch { /* el administrador no ha iniciado el bot o lo bloqueó: nada que hacer */ }
}

/**
 * Primera comprobación de cada mensaje. Devuelve true si la persona puede seguir (administrador, autorizada, o recién entrada con una
 * invitación); false si ya se ha atendido aquí (aviso de bot privado, solicitud, /miid…).
 */
export async function puerta(deps: Deps, e: Entrada): Promise<boolean> {
  const ahora = deps.ahora();
  const id = e.chatId;
  const texto = (e.texto ?? "").trim();

  // /miid lo contesta siempre (también con el bot abierto): es como el administrador averigua su número para configurarlo.
  if (/^\/miid(@\w+)?$/i.test(texto)) {
    await deps.canal.enviar(id, [cabecera("🆔", "Tu ID de Telegram"), "", `<code>${esc(id)}</code>`, "", "<i>Es un número, no un dato secreto. El dueño del bot lo usa para darte permisos.</i>"].join("\n"));
    return false;
  }
  if (!deps.adminId) return true; // bot abierto

  let acceso = await deps.almacen.getAcceso(id);
  if (id === deps.adminId && acceso?.rol !== "admin") {
    acceso = { id, rol: "admin", nombre: e.nombre, desde: acceso?.desde ?? ahora } satisfies Acceso;
    await deps.almacen.guardarAcceso(acceso);
  }
  if (acceso) return true;

  // --- Persona sin acceso ---
  const cb = e.callback;
  if (cb) await deps.canal.responderCallback(cb.id).catch(() => undefined);

  // 1) Llega con una invitación: /start inv_CODIGO
  const inv = /^\/start(?:@\w+)?\s+inv_([A-Za-z0-9_-]{8,40})$/.exec(texto);
  if (inv) {
    const usada = await deps.almacen.consumirInvitacion(inv[1], id, ahora);
    if (usada) {
      await deps.almacen.guardarAcceso({ id, rol: "usuario", nombre: e.nombre, desde: ahora });
      await deps.almacen.borrarSolicitud(id);
      await avisarAdmin(deps, `✅ <b>${quien(e.nombre, e.usuario, id)}</b> ha entrado con una invitación.`);
      return true; // sigue: el bot lo trata como un /start normal
    }
    await deps.canal.enviar(id, [cabecera("🔒", "Invitación no válida", "Ha caducado, ya se usó o no es para ti"), "", "Si quieres usar el bot, puedes pedir acceso al dueño.", "", "<i>Pulsa el botón 👇</i>"].join("\n"), [[{ texto: "🙋 Pedir acceso", datos: "acc:pedir" }]]);
    return false;
  }

  // 2) Pide acceso
  const previa = await deps.almacen.getSolicitud(id);
  if (cb?.datos === "acc:pedir" && !previa) {
    await deps.almacen.guardarSolicitud({ id, nombre: e.nombre, usuario: e.usuario, fecha: ahora, estado: "pendiente" });
    await avisarAdmin(deps, [cabecera("🙋", "Solicitud de acceso", "Alguien quiere usar el bot"), "", bloque("👤", "Quién", quien(e.nombre, e.usuario, id)), "", "<i>Si la apruebas, le llegará una invitación personal 👇</i>"].join("\n"),
      [[{ texto: "✅ Aprobar", datos: `acc:ok:${id}` }, { texto: "🚫 Rechazar", datos: `acc:no:${id}` }]]);
    await deps.canal.enviar(id, [cabecera("📨", "Solicitud enviada", "Ahora decide el dueño"), "", "Te avisaré aquí en cuanto responda.", "", "<i>No hace falta que hagas nada más.</i>"].join("\n"));
    return false;
  }

  // 3) Cualquier otra cosa: bot privado
  if (previa?.estado === "rechazada") {
    await deps.canal.enviar(id, [cabecera("🔒", "Bot privado", "Tu solicitud no ha sido aprobada"), "", "Si crees que es un error, habla directamente con el dueño del bot."].join("\n"));
  } else if (previa) {
    await deps.canal.enviar(id, [cabecera("⏳", "Solicitud pendiente", "Ahora decide el dueño"), "", "Te avisaré aquí en cuanto responda."].join("\n"));
  } else {
    await deps.canal.enviar(id, [cabecera("🔒", "Bot privado", "Solo pueden usarlo personas invitadas"), "", "Si quieres usarlo, pide acceso: el dueño decidirá si te envía una invitación.", "", "<i>Pulsa el botón 👇</i>"].join("\n"), [[{ texto: "🙋 Pedir acceso", datos: "acc:pedir" }]]);
  }
  return false;
}

// ===================== Panel del administrador =====================

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

async function panel(c: Ctx): Promise<void> {
  const pendientes = (await c.almacen.listarSolicitudes("pendiente")).length;
  const personas = (await c.almacen.listarAccesos()).length;
  await c.responder([
    cabecera("🔐", "Acceso", "Quién puede usar tu bot"),
    "",
    bloque("🙋", "Solicitudes pendientes", String(pendientes)),
    "",
    bloque("👥", "Personas con acceso", `${personas} (contándote a ti)`),
    "",
    "<i>Elige qué hacer 👇</i>",
  ].join("\n"), [
    [{ texto: "➕ Invitar", datos: "acc:inv" }, { texto: `🙋 Solicitudes (${pendientes})`, datos: "acc:sol" }],
    [{ texto: "👥 Usuarios", datos: "acc:usr" }, BTN_MENU],
  ]);
}

/** Crea una invitación de un solo uso (7 días), sin persona fija, para repartirla. */
async function invitar(c: Ctx): Promise<void> {
  const codigo = nuevoCodigo();
  await c.almacen.guardarInvitacion({ codigo, caduca: new Date(c.ahora.getTime() + DIAS_INVITACION * 86_400_000), creadaPor: c.u.id });
  const url = await enlace(c.deps, codigo);
  await c.nuevo([
    cabecera("🔗", "Invitación creada", `Vale para una persona · caduca en ${DIAS_INVITACION} días`),
    "",
    url ? `Reenvía este enlace a quien quieras invitar:\n${url}` : `No conozco el nombre del bot. La persona debe abrirlo y escribir:\n<code>/start inv_${codigo}</code>`,
    "",
    "<i>Cuando alguien entre te aviso.</i>",
  ].join("\n"), [[{ texto: "🔐 Acceso", datos: "acc:menu" }, BTN_MENU]]);
}

async function solicitudes(c: Ctx): Promise<void> {
  const lista = await c.almacen.listarSolicitudes("pendiente");
  if (lista.length === 0) { await c.nuevo([cabecera("🙋", "Solicitudes", "No hay ninguna pendiente")].join("\n"), [[{ texto: "🔐 Acceso", datos: "acc:menu" }, BTN_MENU]]); return; }
  await c.nuevo(cabecera("🙋", "Solicitudes pendientes", plural(lista.length, "persona espera", "personas esperan") + " tu respuesta"));
  for (const s of lista.slice(0, 15)) {
    await c.nuevo(bloque("👤", "Quién", quien(s.nombre, s.usuario, s.id)), [[{ texto: "✅ Aprobar", datos: `acc:ok:${s.id}` }, { texto: "🚫 Rechazar", datos: `acc:no:${s.id}` }]]);
  }
}

async function usuarios(c: Ctx): Promise<void> {
  const lista = await c.almacen.listarAccesos();
  const filas: Teclado = lista.filter((a) => a.rol !== "admin").slice(0, 20).map((a) => [{ texto: `🗑 Quitar a ${a.nombre || a.id}`.slice(0, 40), datos: `acc:del:${a.id}` }]);
  await c.responder([
    cabecera("👥", "Personas con acceso", plural(lista.length, "persona", "personas")),
    "",
    ...lista.map((a) => `${a.rol === "admin" ? "👑" : "👤"} ${quien(a.nombre, undefined, a.id)}${a.rol === "admin" ? " · tú" : ""}`),
    "",
    "<i>Pulsa para quitar el acceso a alguien (se borran también sus datos).</i>",
  ].join("\n"), [...filas, [{ texto: "🔐 Acceso", datos: "acc:menu" }, BTN_MENU]]);
}

/** Pulsaciones «acc:…» del administrador. (Las de quien pide acceso se atienden en `puerta`.) */
export async function callback(c: Ctx, p: string[]): Promise<void> {
  if (!c.esAdmin) return; // solo el administrador
  const acc = p[1], id = p[2];
  switch (acc) {
    case "menu": await panel(c); return;
    case "inv": await invitar(c); return;
    case "sol": await solicitudes(c); return;
    case "usr": await usuarios(c); return;
    case "ok": {
      const s = id ? await c.almacen.getSolicitud(id) : null;
      if (!s || s.estado !== "pendiente") { await c.responder("Esa solicitud ya no está pendiente.", [[{ texto: "🔐 Acceso", datos: "acc:menu" }]]); return; }
      const codigo = nuevoCodigo();
      await c.almacen.guardarInvitacion({ codigo, caduca: new Date(c.ahora.getTime() + DIAS_INVITACION * 86_400_000), creadaPor: c.u.id, para: s.id });
      await c.almacen.borrarSolicitud(s.id);
      const url = await enlace(c.deps, codigo);
      const aviso = [cabecera("🎉", "¡Solicitud aprobada!", "Ya puedes usar el bot"), "", `Tienes una invitación personal (solo vale para ti, caduca en ${DIAS_INVITACION} días).`, "", url ? "<i>Pulsa el botón para entrar 👇</i>" : `Escribe:\n<code>/start inv_${codigo}</code>`].join("\n");
      let enviado = true;
      try { await c.deps.canal.enviar(s.id, aviso, url ? [[{ texto: "🚀 Entrar", url }]] : undefined); } catch { enviado = false; }
      await c.responder([cabecera(enviado ? "✅" : "⚠️", enviado ? "Invitación enviada" : "No he podido avisar", quien(s.nombre, s.usuario, s.id)), "", enviado ? "<i>Te aviso cuando entre.</i>" : "<i>Puede que haya bloqueado el bot.</i>"].join("\n"), [[{ texto: "🙋 Solicitudes", datos: "acc:sol" }, { texto: "🔐 Acceso", datos: "acc:menu" }]]);
      return;
    }
    case "no": {
      const s = id ? await c.almacen.getSolicitud(id) : null;
      if (!s || s.estado !== "pendiente") { await c.responder("Esa solicitud ya no está pendiente.", [[{ texto: "🔐 Acceso", datos: "acc:menu" }]]); return; }
      await c.almacen.guardarSolicitud({ ...s, estado: "rechazada" });
      try { await c.deps.canal.enviar(s.id, [cabecera("🔒", "Solicitud no aprobada", "El dueño no ha podido darte acceso"), "", "Si crees que es un error, habla directamente con él."].join("\n")); } catch { /* sin más */ }
      await c.responder([cabecera("🚫", "Solicitud rechazada", quien(s.nombre, s.usuario, s.id)), "", "<i>No podrá volver a pedirlo, pero puedes invitarle cuando quieras.</i>"].join("\n"), [[{ texto: "🔐 Acceso", datos: "acc:menu" }]]);
      return;
    }
    case "del": {
      const a = id ? await c.almacen.getAcceso(id) : null;
      if (!a || a.rol === "admin") { await usuarios(c); return; }
      await c.responder([cabecera("🗑", "¿Quitar el acceso?", esc(a.nombre || a.id)), "", "Se borrarán también sus datos, alarmas, citas y tareas, y dejará de recibir mensajes.", "<i>No se puede deshacer.</i>"].join("\n"),
        [[{ texto: "🗑 Sí, quitar", datos: `acc:delok:${a.id}` }, { texto: "Cancelar", datos: "acc:usr" }]]);
      return;
    }
    case "delok": {
      const a = id ? await c.almacen.getAcceso(id) : null;
      if (a && a.rol !== "admin") {
        await c.almacen.borrarAcceso(a.id);
        await c.almacen.borrarInvitacionesPara(a.id);
        await c.almacen.borrarUsuario(a.id);
        try { await c.deps.canal.enviar(a.id, cabecera("🔒", "Acceso retirado", "Ya no puedes usar este bot")); } catch { /* sin más */ }
      }
      await usuarios(c);
      return;
    }
    default: return;
  }
}

/** Comandos del administrador. Devuelve false si no es uno de ellos (o si quien escribe no es el administrador). */
export async function comando(c: Ctx, cmd: string): Promise<boolean> {
  if (!c.esAdmin) return false;
  switch (cmd) {
    case "/acceso": await panel(c); return true;
    case "/invitar": await invitar(c); return true;
    case "/solicitudes": await solicitudes(c); return true;
    case "/usuarios": await usuarios(c); return true;
    default: return false;
  }
}

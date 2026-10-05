import { Entrada, esc } from "../canal";
import { Usuario, usuarioNuevo } from "../modelo";
import { sincronizarSecciones } from "../programar";
import { construirContenido } from "../secciones";
import { cabecera } from "../util";
import { Contenido } from "../secciones/tipos";
import * as ajustes from "./ajustes";
import { diagnostico } from "./diagnostico";
import { Ctx, Deps, BTN_MENU } from "./ctx";
import * as eventos from "./eventos";
import * as onboarding from "./onboarding";
import { seccionesActivas, tecladoHoy, tecladoMenu, textoAyuda, textoMenu } from "./vistas";

async function menu(c: Ctx): Promise<void> { await c.responder(textoMenu(c.u), tecladoMenu); }

/** Envía una sección. `editar`: sustituye el mensaje del botón (navegación dentro de una misma sección). */
async function mostrarSeccion(c: Ctx, ref: string, editar = false): Promise<void> {
  await entregarSeccion(c, ref, construirSeccion(c, ref), editar);
}

/** Genera el contenido de una sección con las dependencias dadas (es lo que hace la ejecución a la que se encarga cada sección). */
export const contenidoDeSeccion = (deps: Deps, u: Usuario, ref: string): Promise<Contenido> =>
  construirContenido(ref, { usuario: u, http: deps.http, almacen: deps.almacen, ahora: deps.ahora(), horoscopoCfg: deps.horoscopoCfg, podcastFeed: deps.podcastFeed });

/** Pide el contenido de una sección: en otra ejecución si la plataforma lo ofrece, y si no, aquí mismo. */
const construirSeccion = (c: Ctx, ref: string): Promise<Contenido> =>
  c.deps.construirRemoto ? c.deps.construirRemoto({ uid: c.u.id, ref }) : contenidoDeSeccion(c.deps, c.u, ref);

/** Envía el contenido (ya pedido o en camino) de una sección; si falló, avisa con el motivo y un botón para reintentar. */
async function entregarSeccion(c: Ctx, ref: string, pendiente: Promise<Contenido>, editar = false): Promise<void> {
  try {
    const cont = await pendiente;
    if (editar) await c.responder(cont.html, cont.teclado); else await c.nuevo(cont.html, cont.teclado);
  } catch (e) {
    const motivo = esc(String((e as Error).message ?? e).slice(0, 90));
    console.error(`sección ${ref}:`, (e as Error).message);
    await c.nuevo(`⚠️ No he podido obtener esa información ahora mismo.\n<i>${motivo}</i>`, [[{ texto: "🔄 Reintentar", datos: `sec:${ref}` }, BTN_MENU]]);
  }
}

async function resumenHoy(c: Ctx): Promise<void> {
  const activas = seccionesActivas(c.u);
  await c.responder([cabecera("📋", "Resumen de hoy", activas.length ? `${activas.length} ${activas.length === 1 ? "sección" : "secciones"} activa${activas.length === 1 ? "" : "s"}` : "Aún no tienes secciones activas"), "", "<i>Elige una sección, o pulsa «Todo lo activado» para recibirlas todas 👇</i>"].join("\n"), tecladoHoy(c.u));
}

async function todo(c: Ctx): Promise<void> {
  const activas = seccionesActivas(c.u);
  if (activas.length === 0) { await c.nuevo("No tienes ninguna sección activada. Actívalas en 🧩 Mis secciones.", [[{ texto: "🧩 Mis secciones", datos: "s:lista" }]]); return; }
  const fecha = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: c.u.zona }).format(c.ahora);
  await c.nuevo([cabecera("📋", "Tu resumen de hoy", fecha.replace(/^./, (x) => x.toUpperCase())), "", ...activas.map((s) => `${s.emoji} ${s.titulo}`), "", "<i>Te lo envío ahora, uno por uno 👇</i>"].join("\n"));
  // Todas se piden a la vez (tarda lo de la más lenta, no la suma) y se envían en orden.
  const pendientes = activas.map((s) => { const p = construirSeccion(c, s.ref); p.catch(() => undefined); return p; });
  for (let i = 0; i < activas.length; i++) await entregarSeccion(c, activas[i].ref, pendientes[i]);
}

async function cancelar(c: Ctx): Promise<void> {
  const habia = !!c.u.estado;
  await c.terminarFlujo();
  if (habia && !c.u.onboardingHecho) { await onboarding.terminar(c, true); return; }
  await c.nuevo(habia ? "Cancelado." : "No había nada que cancelar.", tecladoMenu);
}

async function comando(c: Ctx, texto: string): Promise<boolean> {
  const cmd = texto.split(/[\s@]/)[0].toLowerCase();
  switch (cmd) {
    case "/start": if (c.u.onboardingHecho) { await c.terminarFlujo(); await c.nuevo(textoMenu(c.u), tecladoMenu); } else await onboarding.iniciar(c); return true;
    case "/menu": await c.terminarFlujo(); await c.nuevo(textoMenu(c.u), tecladoMenu); return true;
    case "/hoy": await c.terminarFlujo(); await c.nuevo("📋 <b>Resumen de hoy</b>\n¿Qué quieres ver?", tecladoHoy(c.u)); return true;
    case "/nueva": await c.terminarFlujo(); await eventos.menuNueva(c); return true;
    case "/eventos": await c.terminarFlujo(); await eventos.lista(c); return true;
    case "/secciones": await c.terminarFlujo(); await ajustes.listaSecciones(c); return true;
    case "/perfil": await c.terminarFlujo(); await ajustes.callback(c, ["p", "ver"]); return true;
    case "/ayuda": case "/help": await c.nuevo(textoAyuda, [[BTN_MENU]]); return true;
    case "/cancelar": await cancelar(c); return true;
    case "/borrar": await ajustes.callback(c, ["p", "borrar"]); return true;
    case "/diagnostico": await diagnostico(c); return true; // no sale en el menú: es para encontrar fallos
    default: return false;
  }
}

async function despachar(c: Ctx): Promise<void> {
  const cb = c.entrada.callback;
  if (cb) {
    const p = cb.datos.split(":");
    // Se confirma el botón a la vez que se trabaja (no antes): así no se suma la espera. En las secciones, con un aviso de «cargando».
    const confirmado = c.deps.canal.responderCallback(cb.id, p[0] === "sec" || p[0] === "sev" ? "⏳ Preparando…" : undefined);
    try { await atenderBoton(c, p); } finally { await confirmado; }
    return;
  }
  await atenderTexto(c);
}

async function atenderBoton(c: Ctx, p: string[]): Promise<void> {
  if (!c.u.onboardingHecho && p[0] !== "o" && p[0] !== "x") { await onboarding.iniciar(c); return; }
  switch (p[0]) {
    case "o": await onboarding.callback(c, p); return;
    case "m":
      if (p[1] === "hoy") await resumenHoy(c); else if (p[1] === "ayuda") await c.responder(textoAyuda, [[BTN_MENU]]); else { await c.terminarFlujo(); await menu(c); }
      return;
    case "sec": if (p[1] === "todo") await todo(c); else await mostrarSeccion(c, p.slice(1).join(":")); return;
    case "sev": await mostrarSeccion(c, p.slice(1).join(":"), true); return;
    case "n": case "e": await eventos.callback(c, p); return;
    case "s": case "p": await ajustes.callback(c, p); return;
    case "x": await cancelar(c); return;
    default: return; // "noop" y botones desconocidos
  }
}

async function atenderTexto(c: Ctx): Promise<void> {
  const t = c.texto;
  if (!t) return;
  if (t.startsWith("/") && (await comando(c, t))) return;
  if (!c.u.onboardingHecho && !c.u.estado) { await onboarding.iniciar(c); return; }
  if (c.u.estado && ((await onboarding.texto(c)) || (await eventos.texto(c)) || (await ajustes.texto(c)))) return;
  await c.nuevo("Usa el menú para moverte por la agenda 👇", tecladoMenu);
}

/** Punto de entrada de cada mensaje o botón que llega del canal. */
export async function manejarEntrada(deps: Deps, entrada: Entrada): Promise<void> {
  const { almacen, canal } = deps;
  const ahora = deps.ahora();
  let u = await almacen.getUsuario(entrada.chatId);

  if (entrada.bloqueado) { // el usuario ha bloqueado el bot: se dejan de programar envíos
    if (u) { u.activo = false; await almacen.guardarUsuario(u); await almacen.borrarProgramacionesDe(u.id); }
    return;
  }
  let reactivado = false;
  if (!u) u = usuarioNuevo(entrada.chatId, "", ahora);
  else if (entrada.updateId && entrada.updateId <= u.ultimoUpdate) return; // Telegram reenvía a veces la misma actualización
  if (!u.activo) { u.activo = true; reactivado = true; }
  u.ultimoUpdate = Math.max(u.ultimoUpdate, entrada.updateId);
  await almacen.guardarUsuario(u);
  if (reactivado && u.onboardingHecho) await sincronizarSecciones(almacen, u, ahora);

  const c = new Ctx(deps, u, entrada);
  try {
    await despachar(c);
  } catch (e) {
    console.error("error en el bot:", (e as Error).message);
    try { await canal.enviar(u.id, "⚠️ Ha ocurrido un error. Inténtalo de nuevo o escribe /menu.", [[BTN_MENU]]); } catch { /* sin más */ }
  }
}

import { createHmac } from "node:crypto";
import { modoEfectivo, textoSol } from "./apariencia";
import { Deps } from "./bot/ctx";
import { contenidoDeSeccion } from "./bot/bot";
import { buscarLugares } from "./geocoding";
import { formatearFechaHora, localAUtc, Repeticion } from "./fechas";
import { ConfigSeccion, Evento, ORDEN_SECCIONES, SECCIONES, SeccionId, Tema, TipoEvento, Usuario } from "./modelo";
import { slug } from "./bot/catalogo";
import { AVATARES, avatarEmoji, claveFoto, fotoValida, VIGENCIA_FOTO_MS } from "./avatares";
import { Teclado } from "./canal";
import { cancelarEvento, programarEvento, programarSeccion, sincronizarSecciones } from "./programar";
import { iguales } from "./webhook";
import { fotoCiudad } from "./fotoCiudad";
import { horaLocal, leerResumen, resumenesDeHoy } from "./resumen";
import { enlaceWhatsApp, MensajeWa, normalizarTelefono } from "./whatsapp";
import { claveVapid, suscripcionValida } from "./webpush";
import { crearAcceso } from "./sesiones";
import { parseNacimiento } from "./fechas";

/** Antigüedad máxima de los datos de inicio que da Telegram al abrir la mini app. */
const VIGENCIA_S = 24 * 3600;

/**
 * Comprueba los datos (`initData`) que Telegram entrega a la mini app: vienen firmados con el token del bot, así que solo Telegram
 * puede haberlos generado. Devuelve el id y el nombre de quien abre la app, o null si la firma no vale o están caducados.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validarInitData(initData: string, token: string, ahora: Date): { id: string; nombre: string } | null {
  try {
    const p = new URLSearchParams(initData);
    const hash = p.get("hash");
    if (!hash || !token) return null;
    p.delete("hash");
    const texto = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
    const clave = createHmac("sha256", "WebAppData").update(token).digest();
    if (!iguales(createHmac("sha256", clave).update(texto).digest("hex"), hash)) return null;
    const fecha = Number(p.get("auth_date"));
    if (!fecha || ahora.getTime() / 1000 - fecha > VIGENCIA_S) return null;
    const u = JSON.parse(p.get("user") ?? "null") as { id?: number; first_name?: string } | null;
    return u?.id ? { id: String(u.id), nombre: u.first_name ?? "" } : null;
  } catch { return null; }
}

export interface RespuestaApi { estado: number; cuerpo: unknown }
const ok = (cuerpo: unknown = { ok: true }): RespuestaApi => ({ estado: 200, cuerpo });
const error = (estado: number, mensaje: string): RespuestaApi => ({ estado, cuerpo: { error: mensaje } });

const TIPOS: TipoEvento[] = ["alarma", "cita", "tarea", "mensaje", "nota"];
const REPS: Repeticion[] = ["ninguna", "diaria", "semanal", "laborables", "anual"];

const eventoJson = (e: Evento, u: Usuario, ahora: Date) => ({
  id: e.id, tipo: e.tipo, titulo: e.titulo, lugar: e.lugar, hecho: e.hecho, repeticion: e.repeticion, antelacionMin: e.antelacionMin,
  ...(e.mensaje ? { mensaje: e.mensaje, enlaceWa: enlaceWhatsApp(e.mensaje) } : {}),
  ...(e.nota ? { nota: e.nota } : {}),
  ...(e.subtareas ? { subtareas: e.subtareas } : {}),
  cuando: e.fechaHora ? e.fechaHora.toISOString() : null, texto: e.fechaHora ? formatearFechaHora(e.fechaHora, u.zona, ahora) : "sin fecha",
});

async function estado(deps: Deps, u: Usuario): Promise<RespuestaApi> {
  const ahora = deps.ahora();
  const eventos = (await deps.almacen.listarEventos(u.id))
    .sort((a, b) => (a.fechaHora?.getTime() ?? Infinity) - (b.fechaHora?.getTime() ?? Infinity)).slice(0, 100);
  const secciones = [
    ...ORDEN_SECCIONES.map((s) => ({ ref: s as string, emoji: SECCIONES[s].emoji, titulo: SECCIONES[s].titulo, descripcion: SECCIONES[s].descripcion, activa: u.secciones[s].activa, hora: u.secciones[s].hora, oculta: !!u.secciones[s].oculta })),
    ...u.temas.map((t) => ({ ref: `tema:${t.id}`, emoji: t.emoji, titulo: t.titulo, descripcion: `Noticias sobre «${t.consulta}»`, activa: t.activa, hora: t.hora })),
  ];
  return ok({
    usuario: { nombre: u.nombre, nacimiento: u.nacimiento, estilo: u.estilo, modo: u.modo, modoBot: modoEfectivo(u, ahora), ciudad: u.ciudad?.nombre ?? null, zona: u.zona, sol: textoSol(u, ahora), admin: !!deps.adminId && u.id === deps.adminId },
    avatar: u.avatar, fotoAvatar: u.avatar?.tipo === "foto" ? await deps.almacen.cacheGet(claveFoto(u.id), ahora) : null, avatares: AVATARES,
    notificaciones: { canal: u.notificaciones.canal, sonido: u.notificaciones.sonido, dispositivos: u.notificaciones.suscripciones.map((x) => ({ id: x.endpoint.slice(-24), nombre: x.dispositivo, desde: x.desde })) },
    resumenHoy: (await resumenesDeHoy(deps.almacen, u, ahora)).map((r) => { const info = r.ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === r.ref) : SECCIONES[r.ref as SeccionId]; return { ref: r.ref, emoji: info?.emoji ?? "📬", titulo: info?.titulo ?? r.ref, hora: horaLocal(r.hora, u.zona), previa: r.previa }; }),
    compra: u.compra, secciones, eventos: eventos.map((e) => eventoJson(e, u, ahora)), ahora: ahora.toISOString(),
  });
}

const refsActivas = (u: Usuario): string[] => ORDEN_SECCIONES.filter((x) => u.secciones[x].activa).map(String).concat(u.temas.filter((t) => t.activa).map((t) => `tema:${t.id}`));

/** Botones de una sección que tienen sentido dentro de la mini app: enlaces, subpantallas de la misma sección y atajos a otras pantallas. */
export function botonesApp(t?: Teclado): { texto: string; url?: string; ref?: string; ir?: string }[] {
  const res: { texto: string; url?: string; ref?: string; ir?: string }[] = [];
  for (const b of (t ?? []).flat()) {
    const d = b.datos ?? "";
    if (b.url) res.push({ texto: b.texto, url: b.url });
    else if (/^se[cv]:/.test(d) && d !== "sec:todo") res.push({ texto: b.texto, ref: d.replace(/^se[cv]:/, "") });
    else if (/^p:/.test(d)) res.push({ texto: b.texto, ir: "perfil" });
    else if (/^[ne]:/.test(d)) res.push({ texto: b.texto, ir: "eventos" });
  }
  return res;
}

const VIGENCIA_LISTA_MS = 120 * 24 * 3600_000;
const claveLista = (token: string) => `lista:${token}`;
const tokenNuevo = () => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(18)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
const enlaceLista = (deps: Deps, token: string) => `${(deps.urlBase ?? "").replace(/\/+$/, "")}/lista/?t=${token}`;

/** Cambios de la lista de la compra. `propietario`: puede además terminar la compra, vaciarla y gestionar el historial. Devuelve un error, o null si fue bien. */
function editarCompra(l: Usuario["compra"], c: Record<string, any>, ahora: Date, propietario: boolean): RespuestaApi | null {
  const id = () => globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  switch (c.accion) {
    case "anadir": {
      const nuevos = String(c.texto ?? "").split(/[\n,;]+/).map((t) => t.trim().slice(0, 60)).filter(Boolean);
      if (!nuevos.length) return error(400, "Escribe lo que quieres comprar");
      if (l.items.length + nuevos.length > 150) return error(409, "La lista es demasiado larga: termina la compra primero");
      for (const t of nuevos) l.items.push({ id: id(), texto: t, hecho: false });
      return null;
    }
    case "marcar": { const a = l.items.find((x) => x.id === c.id); if (!a) return error(404, "Ya no está en la lista"); a.hecho = !a.hecho; return null; }
    case "quitar": l.items = l.items.filter((x) => x.id !== c.id); return null;
  }
  if (!propietario) return error(403, "No permitido");
  switch (c.accion) {
    case "terminar": {
      // Lo marcado como comprado sale de la lista: se guarda en el historial con la fecha de hoy («guardar») o se borra («eliminar»).
      const comprados = l.items.filter((x) => x.hecho);
      if (!comprados.length) return error(409, "Marca primero lo que has comprado");
      if (c.guardar) l.historial.unshift({ id: id(), fecha: ahora.toISOString(), items: comprados.map((x) => x.texto) });
      l.items = l.items.filter((x) => !x.hecho);
      l.historial = l.historial.slice(0, 30);
      return null;
    }
    case "vaciar": l.items = []; return null;
    case "olvidar": l.historial = l.historial.filter((x) => x.id !== c.id); return null;
    case "repetir": {
      const h = l.historial.find((x) => x.id === c.id); if (!h) return error(404, "Esa compra ya no está");
      for (const t of h.items) if (!l.items.some((x) => !x.hecho && x.texto.toLowerCase() === t.toLowerCase())) l.items.push({ id: id(), texto: t, hecho: false });
      return null;
    }
    default: return error(400, "Acción desconocida");
  }
}

/**
 * Lista compartida por enlace: la abre quien recibe el enlace (sin cuenta de Telegram) y puede ver, añadir, marcar y quitar artículos.
 * El enlace lleva un código imposible de adivinar que apunta a la lista de su dueño; al terminar la compra el código deja de valer.
 */
export async function manejarListaPublica(deps: Deps, c: Record<string, any>): Promise<RespuestaApi> {
  const token = String(c.token ?? "");
  if (!/^[a-z2-9]{18}$/.test(token)) return error(404, "Esta lista ya no está disponible");
  const ahora = deps.ahora();
  const uid = await deps.almacen.cacheGet(claveLista(token), ahora);
  const u = uid ? await deps.almacen.getUsuario(uid) : null;
  if (!u || u.compra.token !== token) return error(404, "Esta lista ya no está disponible");
  if (c.accion && c.accion !== "estado") {
    const fallo = editarCompra(u.compra, c, ahora, false);
    if (fallo) return fallo;
    await deps.almacen.guardarUsuario(u);
  }
  return ok({ propietario: u.nombre, items: u.compra.items, estilo: u.estilo });
}

/** Lee «aaaa-mm-ddThh:mm» (hora local del usuario) y la pasa a UTC. */
function fechaLocal(texto: unknown, zona: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(String(texto ?? ""));
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return localAUtc(y, mo, d, h, mi, zona);
}

/**
 * API de la mini app. `uid` es quien ha firmado la petición (ya validado). Cada acción reutiliza la misma lógica que el bot, así que lo que
 * se cambia aquí se ve en el chat y al revés.
 */
export async function manejarApi(deps: Deps, u: Usuario, ruta: string, c: Record<string, any>): Promise<RespuestaApi> {
  const ahora = deps.ahora();
  switch (ruta) {
    case "/api/estado": return estado(deps, u);

    case "/api/apariencia": {
      if (c.estilo === "formal" || c.estilo === "informal") u.estilo = c.estilo;
      if (c.modo === "claro" || c.modo === "oscuro" || c.modo === "auto") u.modo = c.modo;
      await deps.almacen.guardarUsuario(u);
      return ok();
    }

    case "/api/seccion": {
      const ref = String(c.ref ?? "");
      const cfg = ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref as SeccionId];
      if (!cfg) return error(404, "Esa sección no existe");
      if (typeof c.activa === "boolean") {
        if (c.activa && ref === "tiempo" && !u.ciudad) return error(409, "Para el tiempo necesito tu ciudad: elige tu ciudad en Mi perfil.");
        if (c.activa && ref === "horoscopo" && !u.nacimiento) return error(409, "Para el horóscopo necesito tu fecha de nacimiento: ponla en Mi perfil.");
        cfg.activa = c.activa;
      }
      if (typeof c.hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.hora)) cfg.hora = c.hora;
      if (typeof c.oculta === "boolean" && !ref.startsWith("tema:")) { (cfg as ConfigSeccion).oculta = c.oculta; if (c.oculta) cfg.activa = false; } // «eliminar» una sección integrada: se quita de la lista y deja de enviarse
      await deps.almacen.guardarUsuario(u);
      await programarSeccion(deps.almacen, u, ref, ahora);
      return ok();
    }

    case "/api/evento": {
      const tipo = TIPOS.includes(c.tipo) ? (c.tipo as TipoEvento) : null;
      let titulo = String(c.titulo ?? "").trim().slice(0, 80);
      let mensaje: MensajeWa | undefined;
      if (tipo === "mensaje") {
        const texto = String(c.texto ?? "").trim().slice(0, 1000), para = String(c.para ?? "").trim().slice(0, 40);
        const tel = String(c.telefono ?? "").trim() ? normalizarTelefono(String(c.telefono)) : "";
        if (!texto) return error(400, "Escribe el mensaje");
        if (tel === null) return error(400, "El teléfono no es válido: ponlo con el prefijo del país, por ejemplo +34 600 000 000");
        mensaje = { para, telefono: tel, texto };
        if (!titulo) titulo = `Mensaje a ${para || "un contacto"}`;
      }
      let nota: string | undefined;
      if (tipo === "nota") { nota = String(c.texto ?? "").trim().slice(0, 4000); if (!titulo) titulo = nota.split("\n")[0].slice(0, 80); }
      if (!tipo || !titulo) return error(400, "Falta el título");
      const fecha = c.cuando ? fechaLocal(c.cuando, u.zona) : null;
      if (c.cuando && !fecha) return error(400, "La fecha no es válida");
      if (tipo !== "tarea" && tipo !== "nota" && !fecha) return error(400, "Indica la fecha y la hora");
      if (fecha && fecha.getTime() <= ahora.getTime() - 60_000) return error(400, "Esa fecha ya ha pasado");
      let ant = tipo === "cita" && Number.isFinite(+c.antelacionMin) ? Math.max(0, Math.min(10080, Math.round(+c.antelacionMin))) : 0;
      if (fecha && ant > 0 && fecha.getTime() - ant * 60_000 <= ahora.getTime()) ant = 0;
      const base = { uid: u.id, tipo, titulo, lugar: String(c.lugar ?? "").trim().slice(0, 80), fechaHora: fecha, antelacionMin: ant, repeticion: REPS.includes(c.repeticion) ? (c.repeticion as Repeticion) : "ninguna", avisado: false, hecho: false, creadoEn: ahora, ...(mensaje ? { mensaje } : {}), ...(nota ? { nota } : {}), ...(tipo === "tarea" ? { subtareas: [] } : {}) } satisfies Omit<Evento, "id">;
      let ev = await deps.almacen.guardarEvento(base);
      ev = await programarEvento(deps.almacen, ev, u.zona, ahora);
      await deps.almacen.guardarEvento(ev);
      return ok({ evento: eventoJson(ev, u, ahora) });
    }

    case "/api/evento/accion": {
      const ev = await deps.almacen.getEvento(u.id, String(c.id ?? ""));
      if (!ev) return error(404, "Ese evento ya no existe");
      if (ev.tipo === "tarea" && ["subtarea_anadir", "subtarea_hecha", "subtarea_borrar"].includes(String(c.accion))) {
        const subs = [...(ev.subtareas ?? [])];
        if (c.accion === "subtarea_anadir") {
          const titulo = String(c.titulo ?? "").trim().slice(0, 120);
          if (!titulo) return error(400, "Escribe la subtarea");
          if (subs.length >= 50) return error(409, "Esta tarea ya tiene demasiadas subtareas");
          const subtarea: Subtarea = { id: crypto.randomUUID().replace(/-/g, "").slice(0, 12), titulo, hecho: false };
          subs.push(subtarea);
          const nuevo = { ...ev, subtareas: subs };
          await deps.almacen.guardarEvento(nuevo);
          return ok({ subtarea, evento: eventoJson(nuevo, u, ahora) });
        }
        const sid = String(c.subtareaId ?? "");
        const pos = subs.findIndex((x) => x.id === sid);
        if (pos < 0) return error(404, "Esa subtarea ya no existe");
        if (c.accion === "subtarea_hecha") subs[pos] = { ...subs[pos], hecho: !subs[pos].hecho };
        else subs.splice(pos, 1);
        const nuevo = { ...ev, subtareas: subs };
        await deps.almacen.guardarEvento(nuevo);
        return ok({ evento: eventoJson(nuevo, u, ahora) });
      }

      if (c.accion === "borrar") { await cancelarEvento(deps.almacen, u.id, ev.id); return ok(); }
      if (c.accion === "hecho") {
        const nuevo = { ...ev, hecho: !ev.hecho };
        await deps.almacen.guardarEvento(nuevo); await programarEvento(deps.almacen, nuevo, u.zona, ahora);
        return ok({ evento: eventoJson(nuevo, u, ahora) });
      }
      return error(400, "Acción desconocida");
    }

    case "/api/ciudad": {
      const lugares = await buscarLugares(deps.http, String(c.nombre ?? "").slice(0, 60)).catch(() => []);
      if (!c.elegir) return ok({ lugares: lugares.map((l, i) => ({ i, etiqueta: l.etiqueta })) });
      const l = lugares[Number(c.elegir.i)];
      if (!l) return error(404, "No encuentro ese lugar");
      u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon }; u.zona = l.zona;
      await deps.almacen.guardarUsuario(u); await sincronizarSecciones(deps.almacen, u, ahora);
      return ok({ ciudad: l.nombre });
    }

    case "/api/ver": {
      // Prepara una o varias secciones para mostrarlas dentro de la mini app (no se manda nada al chat).
      // Con `guardado`, si hoy ya se pidió esa sección se devuelve lo guardado sin volver a prepararla.
      if (c.guardado === true && c.ref !== "todo") {
        const g = await leerResumen(deps.almacen, u, String(c.ref ?? ""), ahora);
        if (g) return ok({ secciones: [{ ref: String(c.ref), html: g.html, botones: botonesApp(g.teclado), grupos: g.grupos, tiempo: g.tiempo, hora: horaLocal(g.hora, u.zona), guardado: true }] });
      }
      const conocidas = new Set([...ORDEN_SECCIONES.map(String), ...u.temas.map((t) => `tema:${t.id}`)]);
      // «refs»: varias secciones a la vez (actualizar el resumen de hoy); «todo»: las activadas; si no, una sola
      const refs = Array.isArray(c.refs) ? [...new Set(c.refs.map(String).filter((r: string) => conocidas.has(r)))].slice(0, 20) : c.ref === "todo" ? refsActivas(u) : [String(c.ref ?? "")];
      if (!refs.length) return error(409, "No tienes ninguna sección activada");
      const hechas = await Promise.all(refs.map(async (ref) => {
        try {
          const cont = deps.construirRemoto ? await deps.construirRemoto({ uid: u.id, ref }) : await contenidoDeSeccion(deps, u, ref);
          return { ref, html: cont.html, botones: botonesApp(cont.teclado), grupos: cont.grupos, tiempo: cont.tiempo, hora: horaLocal(ahora.toISOString(), u.zona) };
        } catch (e) { return { ref, error: String((e as Error).message ?? e).slice(0, 100) }; }
      }));
      return ok({ secciones: hechas });
    }

    case "/api/foto": {
      // Foto real de la ciudad del usuario para la cabecera del tiempo (se pide aparte para no retrasar el tiempo).
      if (!u.ciudad) return ok({ foto: "" });
      return ok({ foto: await fotoCiudad(deps.http, deps.almacen, ahora, u.ciudad.nombre, u.ciudad.provincia) });
    }

    case "/api/acceso/enlace": {
      if (!deps.urlBase) return error(409, "La app aún no tiene dirección pública");
      const codigo = await crearAcceso(deps.almacen, u.id, ahora);
      return ok({ enlace: `${deps.urlBase.replace(/\/+$/, "")}/app/?acceso=${codigo}`, minutos: 10 });
    }

    case "/api/push/clave": return ok({ clave: (await claveVapid(deps.almacen, ahora)).publica });

    case "/api/push/suscribir": {
      const sub = c.suscripcion;
      if (!suscripcionValida(sub)) return error(400, "La suscripción no es válida");
      const nombre = String(c.dispositivo ?? "Dispositivo").trim().slice(0, 40) || "Dispositivo";
      const resto = u.notificaciones.suscripciones.filter((x) => x.endpoint !== sub.endpoint);
      const primero = u.notificaciones.suscripciones.length === 0;
      u.notificaciones.suscripciones = [...resto, { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, dispositivo: nombre, desde: ahora.toISOString() }].slice(-6);
      // Al activar el primer dispositivo, los avisos pasan a llegar también por la app (si no, se activaría y no llegaría nada). Se puede cambiar.
      const cambiado = primero && u.notificaciones.canal === "telegram";
      if (cambiado) u.notificaciones.canal = "ambos";
      await deps.almacen.guardarUsuario(u);
      return ok({ canal: u.notificaciones.canal, cambiado });
    }

    case "/api/push/quitar": {
      u.notificaciones.suscripciones = u.notificaciones.suscripciones.filter((x) => x.endpoint.slice(-24) !== c.id && x.endpoint !== c.endpoint);
      if (!u.notificaciones.suscripciones.length) u.notificaciones.canal = "telegram"; // sin dispositivos, solo Telegram
      await deps.almacen.guardarUsuario(u);
      return ok();
    }

    case "/api/push/probar": {
      if (!deps.push) return error(409, "Las notificaciones no están disponibles");
      if (!u.notificaciones.suscripciones.length) return error(409, "Ningún dispositivo tiene las notificaciones activadas");
      let enviadas = 0; const vivas = [];
      for (const sub of u.notificaciones.suscripciones) {
        const r = await deps.push(sub, { sonido: u.notificaciones.sonido, modo: modoEfectivo(u, ahora), titulo: "🔔 Notificaciones activadas", cuerpo: "Así te avisaré de tus resúmenes y recordatorios.", url: "/app/", etiqueta: "prueba" });
        if (r === "ok") enviadas++; if (r !== "caducada") vivas.push(sub);
      }
      if (vivas.length !== u.notificaciones.suscripciones.length) { u.notificaciones.suscripciones = vivas; await deps.almacen.guardarUsuario(u); }
      return enviadas ? ok({ enviadas }) : error(502, "No he podido enviarla: vuelve a activar las notificaciones en ese dispositivo");
    }

    case "/api/notificaciones": {
      if (c.sonido !== undefined) {
        if (!["signature", "crystal", "pulse", "halo", "orbit", "velvet"].includes(c.sonido)) return error(400, "Sonido desconocido");
        u.notificaciones.sonido = c.sonido;
      }
      if (c.canal !== undefined && c.canal !== "telegram" && c.canal !== "app" && c.canal !== "ambos") return error(400, "Opción desconocida");
      if (c.canal !== undefined) {
        if (c.canal !== "telegram" && !u.notificaciones.suscripciones.length) return error(409, "Primero activa las notificaciones en un dispositivo");
        u.notificaciones.canal = c.canal;
      }
      await deps.almacen.guardarUsuario(u);
      return ok({ sonido: u.notificaciones.sonido });
    }

    case "/api/avatar": {
      if (c.tipo === "emoji") { const a = avatarEmoji(c.emoji, c.color); if (!a) return error(400, "Ese avatar no existe"); u.avatar = a; }
      else if (c.tipo === "telegram") u.avatar = { tipo: "telegram" };
      else if (c.tipo === "foto") {
        if (!fotoValida(c.foto)) return error(400, "La foto no es válida o pesa demasiado");
        await deps.almacen.cacheSet(claveFoto(u.id), c.foto, VIGENCIA_FOTO_MS, ahora);
        u.avatar = { tipo: "foto" };
      } else if (c.tipo === "ninguno") u.avatar = null; // vuelve a la burbuja con su inicial
      else return error(400, "Tipo de avatar desconocido");
      await deps.almacen.guardarUsuario(u);
      return ok();
    }

    case "/api/compra": {
      const l = u.compra;
      if (c.accion === "compartir") {
        // Un enlace por lista: se reutiliza mientras la lista siga abierta y se cambia al terminar la compra.
        if (!l.token) { l.token = tokenNuevo(); }
        await deps.almacen.guardarUsuario(u);
        await deps.almacen.cacheSet(claveLista(l.token), u.id, VIGENCIA_LISTA_MS, ahora);
        return ok({ compra: l, enlace: enlaceLista(deps, l.token) });
      }
      if (c.accion === "descompartir") { l.token = null; await deps.almacen.guardarUsuario(u); return ok({ compra: l }); }
      const fallo = editarCompra(l, c, ahora, true);
      if (fallo) return fallo;
      if (c.accion === "terminar") l.token = null; // la lista termina: el enlace deja de valer y la siguiente tendrá uno nuevo
      await deps.almacen.guardarUsuario(u);
      return ok({ compra: l, enlace: l.token ? enlaceLista(deps, l.token) : null });
    }

    case "/api/perfil": {
      if (typeof c.nombre === "string") u.nombre = c.nombre.trim().slice(0, 40);
      if (typeof c.nacimiento === "string" && c.nacimiento) {
        const n = parseNacimiento(c.nacimiento.split("-").reverse().join("/"), ahora);
        if (!n) return error(400, "La fecha de nacimiento no es válida");
        u.nacimiento = n;
      }
      await deps.almacen.guardarUsuario(u);
      return ok();
    }

    case "/api/tema": {
      if (c.borrar) {
        u.temas = u.temas.filter((t) => t.id !== c.borrar);
        await deps.almacen.guardarUsuario(u); await programarSeccion(deps.almacen, u, `tema:${c.borrar}`, ahora);
        return ok();
      }
      const titulo = String(c.titulo ?? "").trim().slice(0, 60);
      if (!titulo) return error(400, "Escribe el tema");
      if (u.temas.length >= 15) return error(409, "Ya tienes muchos temas: elimina alguno");
      let id = slug(titulo), n = 2;
      while (u.temas.some((t) => t.id === id)) id = `${slug(titulo)}-${n++}`;
      const m = 8 * 60 + 30 + u.temas.length * 5;
      const tema: Tema = { id, titulo, emoji: "⭐", consulta: String(c.consulta ?? "").trim().slice(0, 120) || titulo, hora: `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, activa: true };
      u.temas.push(tema); await deps.almacen.guardarUsuario(u); await programarSeccion(deps.almacen, u, `tema:${id}`, ahora);
      return ok({ ref: `tema:${id}` });
    }

    case "/api/enviar": {
      // Manda al chat una sección (o todas las activadas) ya hecha; lo hace igual que el botón «Ver ahora» del bot.
      const refs = c.ref === "todo" ? ORDEN_SECCIONES.filter((s) => u.secciones[s].activa).map(String).concat(u.temas.filter((t) => t.activa).map((t) => `tema:${t.id}`)) : [String(c.ref ?? "")];
      if (!refs.length) return error(409, "No tienes ninguna sección activada");
      for (const ref of refs) {
        try {
          const cont = deps.construirRemoto ? await deps.construirRemoto({ uid: u.id, ref }) : await contenidoDeSeccion(deps, u, ref);
          await deps.canal.enviar(u.id, cont.html, cont.teclado);
        } catch (e) { return error(502, `No he podido preparar «${ref}»: ${String((e as Error).message).slice(0, 80)}`); }
      }
      return ok({ enviadas: refs.length });
    }
    default: return error(404, "No existe");
  }
}

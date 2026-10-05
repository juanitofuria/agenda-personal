import { createHmac } from "node:crypto";
import { modoEfectivo, textoSol } from "./apariencia";
import { Deps } from "./bot/ctx";
import { contenidoDeSeccion } from "./bot/bot";
import { buscarLugares } from "./geocoding";
import { formatearFechaHora, localAUtc, Repeticion } from "./fechas";
import { Evento, ORDEN_SECCIONES, SECCIONES, SeccionId, Tema, TipoEvento, Usuario } from "./modelo";
import { slug } from "./bot/catalogo";
import { Teclado } from "./canal";
import { cancelarEvento, programarEvento, programarSeccion, sincronizarSecciones } from "./programar";
import { iguales } from "./webhook";
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

const TIPOS: TipoEvento[] = ["alarma", "cita", "tarea"];
const REPS: Repeticion[] = ["ninguna", "diaria", "semanal", "laborables"];

const eventoJson = (e: Evento, u: Usuario, ahora: Date) => ({
  id: e.id, tipo: e.tipo, titulo: e.titulo, lugar: e.lugar, hecho: e.hecho, repeticion: e.repeticion, antelacionMin: e.antelacionMin,
  cuando: e.fechaHora ? e.fechaHora.toISOString() : null, texto: e.fechaHora ? formatearFechaHora(e.fechaHora, u.zona, ahora) : "sin fecha",
});

async function estado(deps: Deps, u: Usuario): Promise<RespuestaApi> {
  const ahora = deps.ahora();
  const eventos = (await deps.almacen.listarEventos(u.id))
    .sort((a, b) => (a.fechaHora?.getTime() ?? Infinity) - (b.fechaHora?.getTime() ?? Infinity)).slice(0, 100);
  const secciones = [
    ...ORDEN_SECCIONES.map((s) => ({ ref: s as string, emoji: SECCIONES[s].emoji, titulo: SECCIONES[s].titulo, descripcion: SECCIONES[s].descripcion, activa: u.secciones[s].activa, hora: u.secciones[s].hora })),
    ...u.temas.map((t) => ({ ref: `tema:${t.id}`, emoji: t.emoji, titulo: t.titulo, descripcion: `Noticias sobre «${t.consulta}»`, activa: t.activa, hora: t.hora })),
  ];
  return ok({
    usuario: { nombre: u.nombre, nacimiento: u.nacimiento, estilo: u.estilo, modo: u.modo, modoBot: modoEfectivo(u, ahora), ciudad: u.ciudad?.nombre ?? null, zona: u.zona, sol: textoSol(u, ahora), admin: !!deps.adminId && u.id === deps.adminId },
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
      await deps.almacen.guardarUsuario(u);
      await programarSeccion(deps.almacen, u, ref, ahora);
      return ok();
    }

    case "/api/evento": {
      const tipo = TIPOS.includes(c.tipo) ? (c.tipo as TipoEvento) : null;
      const titulo = String(c.titulo ?? "").trim().slice(0, 80);
      if (!tipo || !titulo) return error(400, "Falta el título");
      const fecha = c.cuando ? fechaLocal(c.cuando, u.zona) : null;
      if (c.cuando && !fecha) return error(400, "La fecha no es válida");
      if (tipo !== "tarea" && !fecha) return error(400, "Indica la fecha y la hora");
      if (fecha && fecha.getTime() <= ahora.getTime() - 60_000) return error(400, "Esa fecha ya ha pasado");
      let ant = tipo === "cita" && Number.isFinite(+c.antelacionMin) ? Math.max(0, Math.min(10080, Math.round(+c.antelacionMin))) : 0;
      if (fecha && ant > 0 && fecha.getTime() - ant * 60_000 <= ahora.getTime()) ant = 0;
      const base = { uid: u.id, tipo, titulo, lugar: String(c.lugar ?? "").trim().slice(0, 80), fechaHora: fecha, antelacionMin: ant, repeticion: REPS.includes(c.repeticion) ? (c.repeticion as Repeticion) : "ninguna", avisado: false, hecho: false, creadoEn: ahora } satisfies Omit<Evento, "id">;
      let ev = await deps.almacen.guardarEvento(base);
      ev = await programarEvento(deps.almacen, ev, u.zona, ahora);
      await deps.almacen.guardarEvento(ev);
      return ok({ evento: eventoJson(ev, u, ahora) });
    }

    case "/api/evento/accion": {
      const ev = await deps.almacen.getEvento(u.id, String(c.id ?? ""));
      if (!ev) return error(404, "Ese evento ya no existe");
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
      const refs = c.ref === "todo" ? refsActivas(u) : [String(c.ref ?? "")];
      if (!refs.length) return error(409, "No tienes ninguna sección activada");
      const hechas = await Promise.all(refs.map(async (ref) => {
        try {
          const cont = deps.construirRemoto ? await deps.construirRemoto({ uid: u.id, ref }) : await contenidoDeSeccion(deps, u, ref);
          return { ref, html: cont.html, botones: botonesApp(cont.teclado) };
        } catch (e) { return { ref, error: String((e as Error).message ?? e).slice(0, 100) }; }
      }));
      return ok({ secciones: hechas });
    }

    case "/api/compra": {
      const l = u.compra;
      const id = () => globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10);
      switch (c.accion) {
        case "anadir": {
          const nuevos = String(c.texto ?? "").split(/[\n,;]+/).map((t) => t.trim().slice(0, 60)).filter(Boolean);
          if (!nuevos.length) return error(400, "Escribe lo que quieres comprar");
          if (l.items.length + nuevos.length > 150) return error(409, "La lista es demasiado larga: termina la compra primero");
          for (const t of nuevos) l.items.push({ id: id(), texto: t, hecho: false });
          break;
        }
        case "marcar": { const a = l.items.find((x) => x.id === c.id); if (!a) return error(404, "Ya no está en la lista"); a.hecho = !a.hecho; break; }
        case "quitar": l.items = l.items.filter((x) => x.id !== c.id); break;
        case "terminar": {
          // Lo marcado como comprado sale de la lista: se guarda en el historial con la fecha de hoy («guardar») o se borra («eliminar»).
          const comprados = l.items.filter((x) => x.hecho);
          if (!comprados.length) return error(409, "Marca primero lo que has comprado");
          if (c.guardar) l.historial.unshift({ id: id(), fecha: ahora.toISOString(), items: comprados.map((x) => x.texto) });
          l.items = l.items.filter((x) => !x.hecho);
          l.historial = l.historial.slice(0, 30);
          break;
        }
        case "vaciar": l.items = []; break;
        case "olvidar": l.historial = l.historial.filter((x) => x.id !== c.id); break;
        case "repetir": {
          const h = l.historial.find((x) => x.id === c.id); if (!h) return error(404, "Esa compra ya no está");
          for (const t of h.items) if (!l.items.some((x) => !x.hecho && x.texto.toLowerCase() === t.toLowerCase())) l.items.push({ id: id(), texto: t, hecho: false });
          break;
        }
        default: return error(400, "Acción desconocida");
      }
      await deps.almacen.guardarUsuario(u);
      return ok({ compra: l });
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

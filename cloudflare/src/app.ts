import { AlmacenD1, D1Like } from "./almacenD1";
import { HttpFetch } from "./http";
import { contenidoDeSeccion } from "../../firebase/functions/src/bot/bot";
import { Deps } from "../../firebase/functions/src/bot/ctx";
import { Canal, Teclado } from "../../firebase/functions/src/canal";
import { actualizarTodos } from "../../firebase/functions/src/horoscopo";
import { Programacion } from "../../firebase/functions/src/modelo";
import { FEED_PODCAST } from "../../firebase/functions/src/podcast";
import { INSTRUCCION_SENCILLO } from "../../firebase/functions/src/simplificar";
import { procesarProgramacion, ResultadoTick, sumar } from "../../firebase/functions/src/scheduler";
import { CanalTelegram } from "../../firebase/functions/src/telegram";
import { conPlazo, HttpGet } from "../../firebase/functions/src/util";
import { iguales, procesarWebhook } from "../../firebase/functions/src/webhook";

export interface Env {
  DB: D1Like;
  /** Este mismo Worker (service binding): cada sección y cada aviso se atiende en una ejecución propia, con su propio límite de CPU y de peticiones. */
  SELF?: { fetch(req: Request): Promise<Response> };
  TELEGRAM_BOT_TOKEN: string;      // secreto (`wrangler secret put`)
  TELEGRAM_WEBHOOK_SECRET: string; // secreto
  HOROSCOPO_BASE_URL?: string;
  HOROSCOPO_IDIOMA?: string;
  /** IA de Cloudflare (Workers AI), opcional: reescribe el horóscopo con palabras sencillas. Sin ella se muestra el texto original. */
  AI?: { run(modelo: string, entrada: unknown): Promise<any> };
  MODELO_IA?: string;
  /** Feed RSS del podcast con un episodio por signo y día (botón «Escuchar»). */
  PODCAST_FEED?: string;
}

/** Contexto de ejecución de Cloudflare (solo lo que usamos). */
export interface Ctx { waitUntil(p: Promise<unknown>): void }

/** Servicios externos de una ejecución. En producción son Telegram y `fetch`; los tests los sustituyen. */
export interface Servicios { canal: Canal; http: HttpGet; restantes?: () => number }
export type Fabrica = (env: Env) => Servicios;

const fabricaReal: Fabrica = (env) => {
  const http = new HttpFetch();
  return { canal: new CanalTelegram(env.TELEGRAM_BOT_TOKEN, http), http, restantes: () => http.restantes };
};

const ZONA = "Europe/Madrid";
/** Cron del planificador (cada minuto) y cron del horóscopo (cada 10 min entre las 04:00 y las 10:59 UTC). */
export const CRON_HOROSCOPO = "*/10 4-10 * * *";
/** Una sección que tarda más de esto se da por fallida (la ejecución principal tiene unos 30 s de margen tras responder a Telegram). */
const PLAZO_SECCION_MS = 15_000;
/** Programaciones que se atienden como máximo en cada ejecución del cron, y cuántas a la vez. */
const MAX_PROGRAMACIONES = 20;
const SIMULTANEAS = 5;
/** Sin SELF (desarrollo local): peticiones salientes que debe quedar de margen para empezar otra programación. */
const MARGEN_PETICIONES = 22;

const RUTA_SECCION = "/interno/seccion";
const RUTA_PROGRAMACION = "/interno/programacion";

/** Llama a otra ejecución de este mismo Worker. Devuelve su respuesta JSON, o null si no se pudo. */
async function llamarInterno<T>(env: Env, ruta: string, cuerpo: unknown): Promise<T | null> {
  if (!env.SELF) return null;
  try {
    const r = await env.SELF.fetch(new Request(`https://interno${ruta}`, {
      method: "POST", headers: { "x-interno": env.TELEGRAM_WEBHOOK_SECRET, "content-type": "application/json" }, body: JSON.stringify(cuerpo),
    }));
    return r.ok ? ((await r.json().catch(() => ({}))) as T) : null;
  } catch { return null; }
}

/** `directo`: el horóscopo se pide primero a 20minutos.es y horoscopefree queda de respaldo (su servicio público falla a veces). */
const horoscopoCfg = (env: Env) => ({ baseUrl: env.HOROSCOPO_BASE_URL ?? "https://horoscopefree.fly.dev", idioma: env.HOROSCOPO_IDIOMA ?? "es", directo: true });

/** Reescribe un texto con palabras sencillas con la IA de Cloudflare; undefined si no está activada. */
function simplificador(env: Env): Deps["simplificar"] {
  if (!env.AI) return undefined;
  const ia = env.AI, modelo = env.MODELO_IA ?? "@cf/meta/llama-3.1-8b-instruct";
  return async (texto) => {
    const r = await ia.run(modelo, { messages: [{ role: "system", content: INSTRUCCION_SENCILLO }, { role: "user", content: texto }], max_tokens: 700 });
    return typeof r?.response === "string" ? r.response : null;
  };
}

/** `remoto`: las secciones se construyen en otra ejecución (la principal solo las envía). */
function dependencias(env: Env, s: Servicios, remoto: boolean): Deps & { almacen: AlmacenD1 } {
  return {
    almacen: new AlmacenD1(env.DB), canal: s.canal, http: s.http, ahora: () => new Date(), horoscopoCfg: horoscopoCfg(env),
    podcastFeed: env.PODCAST_FEED ?? FEED_PODCAST, simplificar: simplificador(env),
    construirRemoto: remoto && env.SELF ? async (p) => {
      const r = await llamarInterno<{ html?: string; teclado?: Teclado; error?: string }>(env, RUTA_SECCION, p);
      if (!r) throw new Error("no se pudo contactar con la ejecución interna");
      if (r.error || !r.html) throw new Error(r.error ?? "respuesta vacía");
      return { html: r.html, teclado: r.teclado };
    } : undefined,
  };
}

/** La programación va con la hora del cron que la reparte: todas las de un mismo minuto se evalúan en el mismo instante. */
const aJson = (p: Programacion, ahora: Date) => ({ ...p, proximo: p.proximo.getTime(), ahora: ahora.getTime() });
const deJson = (j: Omit<Programacion, "proximo"> & { proximo: number }): Programacion => ({ ...j, proximo: new Date(j.proximo) });

/** Rutas que solo se llaman a sí mismos los Workers (con el secreto en la cabecera): construyen y envían UNA sección o procesan UNA programación. */
async function manejarInterno(req: Request, env: Env, ruta: string, fabrica: Fabrica): Promise<Response> {
  if (req.method !== "POST" || !iguales(req.headers.get("x-interno") ?? "", env.TELEGRAM_WEBHOOK_SECRET)) return new Response("forbidden", { status: 403 });
  const cuerpo = (await req.json().catch(() => null)) as any;
  if (!cuerpo) return new Response("bad request", { status: 400 });
  const s = fabrica(env);
  const dep = dependencias(env, s, false);
  if (ruta === RUTA_SECCION) {
    // Construye UNA sección y devuelve su contenido (no la envía: lo hace la ejecución principal, así salen en orden).
    const u = await dep.almacen.getUsuario(String(cuerpo.uid));
    if (!u) return Response.json({ error: "usuario no encontrado" });
    try {
      const c = await conPlazo(contenidoDeSeccion(dep, u, String(cuerpo.ref)), PLAZO_SECCION_MS, "la sección tardó demasiado");
      return Response.json({ html: c.html, teclado: c.teclado });
    } catch (e) {
      console.warn(`sección ${cuerpo.ref}: ${(e as Error).message}`);
      return Response.json({ error: String((e as Error).message ?? e).slice(0, 120) });
    }
  }
  if (ruta === RUTA_PROGRAMACION) {
    const instante = typeof cuerpo.ahora === "number" ? cuerpo.ahora : Date.now();
    const r = await procesarProgramacion({ ...dep, ahora: () => new Date(instante), log: (m) => console.warn(m) }, deJson(cuerpo));
    return Response.json(r);
  }
  return new Response("not found", { status: 404 });
}

export async function manejarFetch(req: Request, env: Env, ctx?: Ctx, fabrica: Fabrica = fabricaReal): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/interno/")) return manejarInterno(req, env, url.pathname, fabrica);
  if (url.pathname !== "/telegram") return new Response(url.pathname === "/" ? "agenda-personal" : "not found", { status: url.pathname === "/" ? 200 : 404 });
  const cuerpo = await req.json().catch(() => null);
  const cabeceraSecreta = req.headers.get("x-telegram-bot-api-secret-token") ?? undefined;
  const valido = req.method === "POST" && iguales(cabeceraSecreta ?? "", env.TELEGRAM_WEBHOOK_SECRET);
  const trabajo = procesarWebhook(dependencias(env, fabrica(env), true), env.TELEGRAM_WEBHOOK_SECRET, { metodo: req.method, cabeceraSecreta, cuerpo }, (m) => console.error(m));
  if (valido && ctx) {
    // Se responde 200 a Telegram al instante y el trabajo sigue en segundo plano (hasta 30 s): así no depende de que Telegram espere.
    ctx.waitUntil(trabajo.catch((e) => console.error(`webhook: ${(e as Error).message}`)));
    return new Response("ok", { status: 200 });
  }
  const r = await trabajo;
  return new Response(r.texto, { status: r.estado });
}

/** Ejecuta `tareas` con como mucho `n` a la vez. */
async function enParalelo<T>(tareas: (() => Promise<T>)[], n: number): Promise<T[]> {
  const res: T[] = new Array(tareas.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tareas.length) }, async () => {
    while (i < tareas.length) { const k = i++; res[k] = await tareas[k](); }
  }));
  return res;
}

/**
 * Cron de cada minuto: busca lo vencido y reparte cada programación en una ejecución propia (con SELF).
 * Sin SELF (local) las procesa una a una mientras quede presupuesto de peticiones.
 */
export async function manejarTick(env: Env, ahora: () => Date = () => new Date(), fabrica: Fabrica = fabricaReal): Promise<ResultadoTick> {
  const s = fabrica(env);
  const dep = { ...dependencias(env, s, false), ahora, log: (m: string) => console.warn(m) };
  let total: ResultadoTick = { enviados: 0, omitidos: 0, fallidos: 0 };
  const vencidas = await dep.almacen.programacionesVencidas(ahora(), MAX_PROGRAMACIONES);
  if (env.SELF) {
    const respuestas = await enParalelo(vencidas.map((p) => () => llamarInterno<ResultadoTick>(env, RUTA_PROGRAMACION, aJson(p, ahora()))), SIMULTANEAS);
    for (const r of respuestas) total = sumar(total, r ?? { enviados: 0, omitidos: 0, fallidos: 1 }); // una llamada fallida se reintentará: sigue vencida
  } else {
    for (const p of vencidas) {
      if ((s.restantes?.() ?? Infinity) < MARGEN_PETICIONES) break; // lo que falte irá en el minuto siguiente
      total = sumar(total, await procesarProgramacion(dep, p));
    }
  }
  const t = ahora();
  if (t.getUTCHours() === 3 && t.getUTCMinutes() === 0) await dep.almacen.limpiarCache(t);
  if (total.enviados || total.fallidos) console.info("tick", total);
  return total;
}

export async function manejarHoroscopo(env: Env, ahora = new Date()) {
  const http = new HttpFetch();
  const almacen = new AlmacenD1(env.DB);
  const r = await actualizarTodos({
    http,
    config: horoscopoCfg(env),
    zona: ZONA, ahora,
    guardar: (id, doc) => almacen.guardarHoroscopo(id, doc),
    fechaGuardada: async (id) => (await almacen.getHoroscopo(id))?.fecha,
    log: (m) => console.info(m),
    intentos: 2, esperaMs: 500,
    maxPedidos: 4, // 4 signos por ejecución: así no se pasa del límite de peticiones; el cron se repite cada 10 min
  });
  if (r.actualizados.length || r.fallidos.length) console.info("horóscopo", r);
  return r;
}

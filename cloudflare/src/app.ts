import { AlmacenD1, D1Like } from "./almacenD1";
import { HttpFetch } from "./http";
import { actualizarTodos } from "../../firebase/functions/src/horoscopo";
import { usuarioNuevo, Programacion } from "../../firebase/functions/src/modelo";
import { FEED_PODCAST } from "../../firebase/functions/src/podcast";
import { procesarProgramacion, ResultadoTick, sumar } from "../../firebase/functions/src/scheduler";
import { HttpGet } from "../../firebase/functions/src/util";
import { manejarApi, manejarListaPublica } from "../../firebase/functions/src/api";
import { crearEmisorPush } from "../../firebase/functions/src/webpush";
import { IdentidadFirebase, verificarTokenFirebase } from "./firebaseAuth";

export interface Env {
  DB: D1Like;
  APP_ORIGINS?: string;
  HOROSCOPO_BASE_URL?: string;
  HOROSCOPO_IDIOMA?: string;
  FIREBASE_WEB_CONFIG?: {
    apiKey: string;
    authDomain: string;
    appId: string;
    messagingSenderId: string;
    projectId: string;
    storageBucket: string;
  };
  PODCAST_FEED?: string;
}

export interface Ctx { waitUntil(p: Promise<unknown>): void }
export interface Servicios { http: HttpGet; restantes?: () => number }
export type Fabrica = () => Servicios;

const fabricaReal: Fabrica = () => {
  const http = new HttpFetch();
  return { http, restantes: () => http.restantes };
};

const ZONA = "Europe/Madrid";
export const CRON_HOROSCOPO = "*/10 4-10 * * *";
const MAX_PROGRAMACIONES = 20;
const SIMULTANEAS = 5;
const MARGEN_PETICIONES = 22;

const horoscopoCfg = (env: Env) => ({ baseUrl: env.HOROSCOPO_BASE_URL ?? "https://horoscopefree.fly.dev", idioma: env.HOROSCOPO_IDIOMA ?? "es", directo: true });

function dependencias(env: Env, s: Servicios, urlBase?: string) {
  const almacen = new AlmacenD1(env.DB);
  return {
    almacen,
    http: s.http,
    ahora: () => new Date(),
    horoscopoCfg: horoscopoCfg(env),
    podcastFeed: env.PODCAST_FEED ?? FEED_PODCAST,
    urlBase,
    push: crearEmisorPush(almacen, () => new Date(), async (url, cabeceras, cuerpo) => (await fetch(url, { method: "POST", headers: cabeceras, body: cuerpo })).status, (m) => console.warn(m)),
  };
}

async function enParalelo<T>(tareas: (() => Promise<T>)[], n: number): Promise<T[]> {
  const res: T[] = new Array(tareas.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tareas.length) }, async () => {
    while (i < tareas.length) { const k = i++; res[k] = await tareas[k](); }
  }));
  return res;
}

export async function manejarTick(env: Env, ahora: () => Date = () => new Date(), fabrica: Fabrica = fabricaReal): Promise<ResultadoTick> {
  const s = fabrica();
  const dep = { ...dependencias(env, s), ahora, log: (m: string) => console.warn(m) };
  const instante = ahora();
  const vencidas = await dep.almacen.programacionesVencidas(instante, MAX_PROGRAMACIONES);
  let total: ResultadoTick = { enviados: 0, omitidos: 0, fallidos: 0 };
  const tareas = vencidas.map((p) => () => procesarProgramacion({ ...dep, ahora: () => instante }, p));
  const resultados = await enParalelo(tareas, SIMULTANEAS);
  for (const r of resultados) total = sumar(total, r);
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
    maxPedidos: 4,
  });
  if (r.actualizados.length || r.fallidos.length) console.info("horóscopo", r);
  return r;
}

async function manejarApiWeb(
  req: Request,
  env: Env,
  url: URL,
  fabrica: Fabrica,
  verificarFirebase: (token: string, proyecto: string) => Promise<IdentidadFirebase | null>,
): Promise<Response> {
  const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
  if (req.method !== "POST") return json(405, { error: "método no permitido" });
  const authorization = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(authorization);
  const projectId = env.FIREBASE_WEB_CONFIG?.projectId;
  if (!bearer || !projectId) return json(401, { error: "Inicia sesión en Nexora para continuar." });

  let identidad: IdentidadFirebase | null;
  try {
    identidad = await verificarFirebase(bearer[1], projectId);
  } catch (error) {
    console.error(`Firebase token verification unavailable: ${(error as Error).message}`);
    return json(503, { error: "No se pudo validar la sesión. Inténtalo de nuevo." });
  }
  if (!identidad) return json(401, { error: "La sesión no es válida. Inicia sesión de nuevo." });

  const deps = dependencias(env, fabrica(), url.origin);
  let usuario = await deps.almacen.getUsuario(identidad.uid);
  if (!usuario) {
    const nombre = identidad.nombre?.trim() || identidad.email?.split("@")[0] || "Usuario";
    usuario = usuarioNuevo(identidad.uid, nombre, new Date());
    await deps.almacen.guardarUsuario(usuario);
  }
  try {
    const respuesta = await manejarApi(deps, usuario, url.pathname, ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>);
    return json(respuesta.estado, respuesta.cuerpo);
  } catch (error) {
    console.error(`api ${url.pathname}: ${(error as Error).message}`);
    return json(500, { error: "Algo ha fallado. Inténtalo de nuevo." });
  }
}

export async function manejarFetch(
  req: Request,
  env: Env,
  _ctx?: Ctx,
  fabrica: Fabrica = fabricaReal,
  verificarFirebase: (token: string, proyecto: string) => Promise<IdentidadFirebase | null> = verificarTokenFirebase,
): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin") ?? "";
    const permitido = origin && (env.APP_ORIGINS ?? "").split(",").map((x) => x.trim()).includes(origin);
    if (req.method === "OPTIONS") {
      if (!permitido) return new Response(null, { status: 403 });
      const methods = url.pathname === "/api/config" ? "GET, OPTIONS" : "POST, OPTIONS";
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": methods,
        "access-control-allow-headers": "Authorization, Content-Type",
        "access-control-max-age": "600",
        "vary": "Origin",
      } });
    }
    let response: Response;
    if (url.pathname === "/api/config") {
      response = req.method === "GET"
        ? Response.json({ firebase: env.FIREBASE_WEB_CONFIG ?? null }, { headers: { "cache-control": "no-store" } })
        : Response.json({ error: "método no permitido" }, { status: 405, headers: { allow: "GET, OPTIONS" } });
    } else if (url.pathname === "/api/lista") {
      if (req.method !== "POST") response = Response.json({ error: "método no permitido" }, { status: 405, headers: { "cache-control": "no-store" } });
      else {
        const body = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
        const result = await manejarListaPublica(dependencias(env, fabrica()), body);
        response = Response.json(result.cuerpo, { status: result.estado, headers: { "cache-control": "no-store" } });
      }
    } else {
      response = await manejarApiWeb(req, env, url, fabrica, verificarFirebase);
    }
    if (!permitido) return response;
    const headers = new Headers(response.headers);
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", url.pathname === "/api/config" ? "GET, OPTIONS" : "POST, OPTIONS");
    headers.set("access-control-allow-headers", "Authorization, Content-Type");
    headers.set("vary", "Origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  if (url.pathname === "/" || url.pathname === "/agenda" || url.pathname === "/agenda/") return Response.redirect(new URL("/app/" + url.search + url.hash, url), 302);
  return new Response("not found", { status: 404 });
}

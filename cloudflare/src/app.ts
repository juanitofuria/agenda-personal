import { AlmacenD1, D1Like } from "./almacenD1";
import { HttpFetch } from "./http";
import { Deps } from "../../firebase/functions/src/bot/ctx";
import { actualizarTodos } from "../../firebase/functions/src/horoscopo";
import { tick } from "../../firebase/functions/src/scheduler";
import { CanalTelegram } from "../../firebase/functions/src/telegram";
import { procesarWebhook } from "../../firebase/functions/src/webhook";

export interface Env {
  DB: D1Like;
  TELEGRAM_BOT_TOKEN: string;      // secreto (`wrangler secret put`)
  TELEGRAM_WEBHOOK_SECRET: string; // secreto
  HOROSCOPO_BASE_URL?: string;
  HOROSCOPO_IDIOMA?: string;
}

const ZONA = "Europe/Madrid";
/** Cron del planificador (cada minuto) y cron del horóscopo (cada 10 min entre las 04:00 y las 10:59 UTC). */
export const CRON_HOROSCOPO = "*/10 4-10 * * *";
/** Peticiones salientes que debe quedar de margen para empezar otra programación (plan gratuito: 50 por ejecución). */
const MARGEN_PETICIONES = 22;
const MAX_PROGRAMACIONES = 6;

function dependencias(env: Env, http: HttpFetch): Deps & { almacen: AlmacenD1 } {
  return { almacen: new AlmacenD1(env.DB), canal: new CanalTelegram(env.TELEGRAM_BOT_TOKEN, http), http, ahora: () => new Date() };
}

export async function manejarFetch(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname !== "/telegram") return new Response(url.pathname === "/" ? "agenda-personal" : "not found", { status: url.pathname === "/" ? 200 : 404 });
  const cuerpo = await req.json().catch(() => null);
  const r = await procesarWebhook(
    dependencias(env, new HttpFetch()), env.TELEGRAM_WEBHOOK_SECRET,
    { metodo: req.method, cabeceraSecreta: req.headers.get("x-telegram-bot-api-secret-token") ?? undefined, cuerpo },
    (m) => console.error(m),
  );
  return new Response(r.texto, { status: r.estado });
}

/** Envía lo vencido de una en una mientras quede presupuesto de peticiones; lo que falte irá en el minuto siguiente. */
export async function manejarTick(env: Env, ahora: () => Date = () => new Date()) {
  const http = new HttpFetch();
  const dep = { ...dependencias(env, http), ahora, log: (m: string) => console.warn(m) };
  const total = { enviados: 0, omitidos: 0, fallidos: 0 };
  for (let i = 0; i < MAX_PROGRAMACIONES && http.restantes >= MARGEN_PETICIONES; i++) {
    const r = await tick(dep, 1);
    total.enviados += r.enviados; total.omitidos += r.omitidos; total.fallidos += r.fallidos;
    if (r.enviados + r.omitidos + r.fallidos === 0) break; // no queda nada vencido
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
    config: { baseUrl: env.HOROSCOPO_BASE_URL ?? "https://horoscopefree.fly.dev", idioma: env.HOROSCOPO_IDIOMA ?? "es" },
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

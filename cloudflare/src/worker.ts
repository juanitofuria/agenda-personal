import { CRON_HOROSCOPO, Env, manejarFetch, manejarHoroscopo, manejarTick } from "./app";

// Cloudflare solo admite aquí los handlers: la lógica (y lo que se prueba en los tests) está en app.ts.
export default {
  fetch: (req: Request, env: Env) => manejarFetch(req, env),
  async scheduled(evento: { cron: string }, env: Env) {
    if (evento.cron === CRON_HOROSCOPO) await manejarHoroscopo(env); else await manejarTick(env);
  },
};

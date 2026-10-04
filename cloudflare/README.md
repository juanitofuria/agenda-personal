# Agenda Personal en Cloudflare Workers (gratis, sin tarjeta)

Resumen técnico de esta versión; la guía completa y el contexto están en [`../README.md`](../README.md). Usa la lógica común de
`../firebase/functions/src` (bot, secciones, fechas, luna, planificador) con otro «envoltorio»: un **Worker** recibe el webhook de Telegram y un **Cron Trigger** ejecuta el planificador cada minuto.
Los datos se guardan en **D1** (SQLite de Cloudflare).

| Pieza | Archivo |
|---|---|
| Handlers del Worker (solo `fetch` y `scheduled`) | `src/worker.ts` |
| Lógica de webhook, planificador y horóscopo | `src/app.ts` |
| Almacenamiento en D1 (implementa `Almacen`) | `src/almacenD1.ts` · esquema en `schema.sql` |
| Cliente HTTP sobre `fetch` con presupuesto de peticiones | `src/http.ts` |

## Puesta en marcha (una sola vez)

Necesitas Node 20+ y la cuenta de Cloudflare. Desde esta carpeta (`cloudflare/`):

```bash
npm install
npx wrangler login                                  # abre el navegador y autoriza tu cuenta
npx wrangler d1 create agenda-personal              # imprime un database_id
```

1. Copia ese `database_id` en `wrangler.toml` (línea `database_id = "PON-AQUI-EL-ID"`).
2. Crea las tablas y publica:

```bash
npm run db:crear
npx wrangler secret put TELEGRAM_BOT_TOKEN          # pega el token de @BotFather (no se muestra en pantalla)
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET     # inventa una cadena de 16-256 letras/números/-/_
npm run deploy                                      # imprime la URL: https://agenda-personal.TU-USUARIO.workers.dev
```

3. Registra el webhook en Telegram (usa la URL anterior **terminada en `/telegram`**):

```bash
TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_WEBHOOK_SECRET=la-misma-cadena \
  npm run webhook -- https://agenda-personal.TU-USUARIO.workers.dev/telegram
```

Abre tu bot en Telegram y escribe `/start`. Para ver qué pasa: `npm run logs`.

## Límites del plan gratuito y cómo se respetan

Fuente: [límites de Workers](https://developers.cloudflare.com/workers/platform/limits/) (revisa que no hayan cambiado).

| Límite | Valor | Qué hace el código |
|---|---|---|
| Solicitudes | 100.000/día | El cron gasta 1.440/día; sobra mucho margen |
| CPU por ejecución | 10 ms | Esperar a la red no cuenta; ver «Pendiente de medir» |
| Subpeticiones | 50 por ejecución | `HttpFetch` cuenta (tope 45) y el planificador procesa una programación cada vez mientras queden 22 de margen; lo demás va en el minuto siguiente. El horóscopo pide 4 signos por ejecución (cron cada 10 min) |
| Conexiones salientes simultáneas | 6 | `HttpFetch` limita a 5 a la vez |
| Cron Triggers | 5 por cuenta | Se usan 2 |

**Pendiente de medir en producción:** el CPU real (10 ms) de las secciones más pesadas (noticias con muchos temas, mercados) y si las
consultas a D1 cuentan como subpeticiones. Local no se puede medir. Con `npm run logs` verás errores del tipo
«Worker exceeded CPU time limit» si ocurre; en ese caso hay que reducir fuentes por sección o pasar al plan de pago.

## Tests

```bash
npm test      # compila y ejecuta: almacén D1 (sobre SQLite), bot + planificador con D1 de principio a fin, webhook y cliente HTTP
```

Los tests de la lógica común están en `../firebase/functions` (`npm test`). `npx wrangler dev --test-scheduled` arranca el Worker en
local (workerd) con una D1 local (`npm run db:local` antes); crea un `.dev.vars` con `TELEGRAM_BOT_TOKEN=…` y `TELEGRAM_WEBHOOK_SECRET=…`.

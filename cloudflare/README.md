# Agenda Personal en Cloudflare Workers (gratis, sin tarjeta)

Resumen técnico de esta versión; la guía completa y el contexto están en [`../README.md`](../README.md). Usa la lógica común de
`../firebase/functions/src` (bot, secciones, fechas, luna, planificador) con otro «envoltorio»: un **Worker** recibe el webhook de Telegram y un **Cron Trigger** ejecuta el planificador cada minuto.
Los datos se guardan en **D1** (SQLite de Cloudflare).

| Pieza | Archivo |
|---|---|
| Handlers del Worker (solo `fetch` y `scheduled`) | `src/worker.ts` |
| Worker empaquetado que se despliega | `dist/worker.js` (se genera con `npm run empaquetar`) |
| Lógica de webhook, planificador y horóscopo | `src/app.ts` |
| Almacenamiento en D1 (implementa `Almacen`) | `src/almacenD1.ts` · esquema en `schema.sql` |
| Cliente HTTP sobre `fetch` con presupuesto de peticiones | `src/http.ts` |
| Reparto del trabajo: `/interno/seccion` y `/interno/programacion` (solo con el secreto), vía el binding `SELF` | `src/app.ts` |

## Puesta en marcha y despliegue

Está en [`../README.md`](../README.md#puesta-en-marcha). Resumen: no hace falta `npm install`; el Worker se despliega ya
empaquetado con `npx wrangler@4.147.0 deploy` (el `wrangler.toml` apunta a `dist/worker.js`).

Si cambias código: `npm install` → `npm test` → `npm run empaquetar` (regenera `dist/worker.js`) y sube también `dist/`.

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
consultas a D1 cuentan como subpeticiones. Local no se puede medir. Con `npx wrangler@4.147.0 tail` verás errores del tipo
«Worker exceeded CPU time limit» si ocurre; en ese caso hay que reducir fuentes por sección o pasar al plan de pago.

## Tests

```bash
npm test      # compila y ejecuta: almacén D1 (sobre SQLite), bot + planificador con D1 de principio a fin, webhook y cliente HTTP
```

Los tests de la lógica común están en `../firebase/functions` (`npm test`). `npx wrangler dev --test-scheduled` arranca el Worker en
local (workerd) con una D1 local (`npm run db:local` antes); crea un `.dev.vars` con `TELEGRAM_BOT_TOKEN=…` y `TELEGRAM_WEBHOOK_SECRET=…`.

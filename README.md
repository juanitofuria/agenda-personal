# Agenda Personal · bot de Telegram en Cloudflare

Tu información de cada día y tus avisos, en **un bot de Telegram** que funciona en cualquier móvil (Android, iPhone…).
Corre en **Cloudflare Workers** con **D1**, en el **plan gratuito y sin tarjeta**. No hay que instalar nada en el móvil salvo Telegram.

```
 Usuario ◀─▶ Telegram ◀─▶ Worker  /telegram ──▶ bot (menús, asistente, eventos, ajustes) ──▶ D1 (SQLite)
                              │                                                              ▲
                              ├─ Cron cada minuto ──── resúmenes y avisos vencidos ──────────┤
                              └─ Cron cada 10 min (04–10 UTC) ─ horóscopo ◀── horoscopefree ─┘
        Datos externos: Open-Meteo (tiempo y ciudades) · Google News RSS · Yahoo Finance · horoscopefree
```

## Qué hace el bot

* **Al escribir `/start`**: asistente con botones (todo opcional, siempre con «Omitir»): qué secciones quieres, aficiones y temas
  (23 predefinidos y los que escribas), nombre, fecha de nacimiento (para el horóscopo), municipio y zona horaria.
  Si se omite, entra directo al menú con noticias, agenda y mercados.
* **Resúmenes programados**, cada uno a la hora que elijas y en tu zona horaria:
  ⛅ **tiempo** (gráfica por horas, lluvia prevista, amanecer y anochecer, viento, humedad, UV, luna y calendario lunar),
  📰 **noticias** (economía, política, tu provincia y tus ayuntamientos), 🗓 **agenda**, 🔮 **horóscopo**,
  📈 **mercados** (premercado de Wall Street y cierre de ayer) y una sección de noticias por cada tema que sigas.
* **Alarmas, citas y tareas**: se crean con botones y escribiendo la fecha como quieras («mañana 9:30», «15/10 18:00»,
  «lunes 10h», «en 2 horas»). Las alarmas pueden repetirse (cada día, de lunes a viernes, cada semana) y las citas avisan con
  antelación. Se pueden **ver, modificar y eliminar**.
* **Cada aviso trae botones**: 🗑 Eliminar · ✅ Conservar · ✏️ Modificar · 💤 Posponer 10 min.
* **Ajustes**: activar o desactivar secciones, cambiar la hora de cada una, añadir y quitar temas, y cambiar nombre, fecha de
  nacimiento y ciudad (al cambiar de ciudad se recalculan las horas según su zona horaria).
* **Privacidad**: `/borrar` elimina todos tus datos y deja de enviarte mensajes.

Comandos: `/menu` `/hoy` `/nueva` `/eventos` `/secciones` `/perfil` `/ayuda` `/cancelar` `/borrar`.

## Puesta en marcha

Necesitas **Node 20 o superior** y una cuenta gratuita en [Cloudflare](https://dash.cloudflare.com/sign-up).

1. **Crea el bot** en Telegram: habla con [@BotFather](https://t.me/BotFather), envía `/newbot` y guarda el **token**.
2. **Instala y entra en Cloudflare** (desde la carpeta `cloudflare/`):
   ```bash
   cd cloudflare
   npm install
   npx wrangler login          # abre el navegador y autoriza tu cuenta
   ```
3. **Crea la base de datos** y copia el `database_id` que imprime en `wrangler.toml` (línea `database_id = "PON-AQUI-EL-ID"`):
   ```bash
   npx wrangler d1 create agenda-personal
   npm run db:crear            # crea las tablas
   ```
4. **Guarda los secretos** (Cloudflare los cifra; no van en el código):
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN        # pega el token de BotFather
   npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # una cadena aleatoria de 16–256 letras, números, - o _
   ```
5. **Despliega**:
   ```bash
   npm run deploy
   ```
   Imprime la URL del Worker: `https://agenda-personal.TU-USUARIO.workers.dev`.
6. **Registra el webhook** en Telegram con esa URL **terminada en `/telegram`** y el mismo secreto del paso 4
   (también registra el menú de comandos del bot):
   ```bash
   TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_WEBHOOK_SECRET=la-misma-cadena \
     npm run webhook -- https://agenda-personal.TU-USUARIO.workers.dev/telegram
   ```
7. Abre tu bot en Telegram y escribe **/start**. Para ver los registros en directo: `npm run logs`.

**Prueba de humo recomendada:** `/start` → «Resumen de hoy» → una alarma «en 2 minutos» → `/borrar`.

## Datos en D1 (solo accesibles desde el Worker)

| Tabla | Contenido |
|---|---|
| `usuarios` | nombre, nacimiento, zona horaria, ciudad, secciones (activa + hora), temas, estado de la conversación |
| `eventos` | alarma, cita o tarea de cada usuario: título, lugar, fecha y hora (UTC), antelación, repetición, estado |
| `programaciones` | qué hay que enviar y cuándo (`proximo`); el planificador lee las vencidas cada minuto |
| `horoscopos` | texto del día de cada signo, fecha, fuente y enlace |
| `cache` | respuestas de APIs externas compartidas entre usuarios (30–45 min) |

El esquema está en `cloudflare/schema.sql`. No hay API pública de la base de datos: solo el Worker lee y escribe.

## Cómo está hecho

| Archivo | Para qué |
|---|---|
| `cloudflare/src/worker.ts` | Los dos *handlers* del Worker (`fetch` y `scheduled`); Cloudflare no admite otros exports aquí |
| `cloudflare/src/app.ts` | Webhook, planificador cada minuto y descarga del horóscopo, con control de peticiones |
| `cloudflare/src/almacenD1.ts` | Persistencia en D1 (implementa la interfaz `Almacen`) |
| `cloudflare/src/http.ts` | Cliente HTTP sobre `fetch` con presupuesto de peticiones y concurrencia limitada |
| `cloudflare/wrangler.toml` | Configuración: cron, base de datos, variables |
| `firebase/functions/src/bot/` | El bot: rutas, asistente inicial, eventos, ajustes, vistas y catálogo de temas |
| `firebase/functions/src/scheduler.ts` | Envía lo vencido: reclamo atómico, reintentos, repeticiones, posponer, retrasos, bloqueos |
| `firebase/functions/src/secciones/` | Contenido de cada resumen: tiempo, noticias, mercados, horóscopo, agenda, temas |
| `firebase/functions/src/{fechas,luna}.ts` | Zonas horarias, horario de verano, fechas en español y fases lunares (Meeus, sin red) |
| `firebase/functions/src/{canal,telegram}.ts` | La interfaz de mensajería (`Canal`) y su implementación para Telegram |

> La lógica común (bot, secciones, planificador) vive en `firebase/functions/src` porque nació allí. La importa el Worker de
> Cloudflare tal cual; no depende de Firebase. Solo el almacenamiento y el disparo programado cambian entre plataformas.

### Cómo añadir WhatsApp (u otro canal)

Todo el bot habla con un `Canal` (enviar, editar, responder a un botón). Para otro servicio basta una nueva implementación y un
webhook que convierta sus mensajes en `Entrada`. **WhatsApp es posible pero con condiciones**: la API oficial (WhatsApp Business
Cloud API) exige una cuenta de Meta Business verificada, y los mensajes que el bot envía por su cuenta (resúmenes y avisos)
tienen que usar **plantillas aprobadas por Meta y se cobran por conversación**. Además solo permite 3 botones de respuesta por
mensaje o listas de hasta 10 opciones, así que habría que rediseñar los menús. Telegram no tiene esas restricciones ni coste.

## Límites del plan gratuito y cómo se respetan

Fuente: [límites de Workers](https://developers.cloudflare.com/workers/platform/limits/) y [precios de D1](https://developers.cloudflare.com/d1/platform/pricing/). Compruébalos de vez en cuando: cambian.

| Límite (gratuito) | Valor | Qué hace el código |
|---|---|---|
| Solicitudes | 100.000/día | El cron gasta 1.440 al día; sobra margen |
| CPU por ejecución | 10 ms | Esperar a la red no cuenta; ver «Pendiente de medir» |
| Subpeticiones | 50 por ejecución | `HttpFetch` cuenta (tope 45); el planificador procesa una programación cada vez mientras queden 22 de margen y el resto va en el minuto siguiente; el horóscopo pide 4 signos por ejecución |
| Conexiones salientes simultáneas | 6 | `HttpFetch` limita a 5 a la vez |
| Cron Triggers | 5 por cuenta | Se usan 2 |
| D1 | 5 millones de lecturas y 100.000 escrituras al día, 5 GB | Uso personal: muy por debajo |

## Tests

```bash
cd cloudflare && npm install && npm test              # 10 tests: almacén D1 (sobre SQLite), bot + planificador con D1, webhook, cliente HTTP
cd firebase/functions && npm install && npm test      # 128 tests de la lógica común
```

Cubren: fechas en español y horario de verano; luna contra eclipses y lunas llenas conocidas; el asistente inicial completo
(y omitirlo); crear, ver, modificar y eliminar alarmas, citas y tareas; secciones y temas; cambio de ciudad; borrado de datos;
el planificador (envío a su hora, repeticiones, posponer, retrasos, reintentos, bloqueos, dos ejecuciones simultáneas); la
seguridad del webhook; el troceado de mensajes largos; que ningún botón supere los límites de Telegram; y el presupuesto de
peticiones. Los servicios externos se simulan con respuestas de la forma real de cada API.
Para probar el Worker en local (workerd): `npx wrangler dev --test-scheduled`, con un `.dev.vars` que defina los dos secretos.

## Límites y cosas a tener en cuenta

* **Pendiente de medir en producción:** el CPU real (10 ms) de las secciones más pesadas (noticias con muchos temas, mercados) y
  si las consultas a D1 cuentan como subpeticiones. En local no se puede medir. Si ocurre, `npm run logs` mostrará
  «Worker exceeded CPU time limit»; la salida es reducir fuentes por sección o pasar al plan de pago.
* **No comprobado en el entorno de desarrollo** (sin red hacia estos servicios): la API real de Telegram, las respuestas reales
  de Open-Meteo, Google News, Yahoo Finance y horoscopefree, y el despliegue en tu cuenta. Las pruebas usan dobles.
* **Yahoo Finance** no es una API oficial y puede bloquear o limitar IPs de Cloudflare; si falla, la sección de mercados avisa y
  el resto funciona. **Google News RSS** tampoco es una API garantizada.
* **Horóscopo**: [horoscopefree](https://github.com/vitorebatista/horoscopefree) (MIT) extrae el texto en español de
  **20minutos.es**; no hay afiliación con el editor. El bot muestra siempre la fuente con enlace (condición de uso de esa API).
  Para uso personal es razonable; **antes de abrir el bot a otras personas** conviene pedir permiso al editor o usar una fuente
  con licencia. La instancia pública no tiene garantía de disponibilidad: puedes alojar la tuya y cambiar `HOROSCOPO_BASE_URL`
  en `wrangler.toml`.
* **Datos personales**: se guarda el id del chat, el nombre que escribe el usuario, la fecha de nacimiento y la ciudad. Si el bot
  lo van a usar otras personas, habrá que informarles (política de privacidad) y atender sus peticiones; `/borrar` ya elimina todo.
  Open-Meteo es gratuito para uso no comercial con límites diarios: la caché evita repetir consultas iguales.
* **Escala**: pensado para una persona o unas decenas de usuarios. Con el plan gratuito el planificador envía unas pocas
  programaciones por minuto; si coinciden muchas a la vez, las demás salen en los minutos siguientes.
* Telegram no permite que un bot escriba a quien no lo haya iniciado; si alguien bloquea el bot se le deja de programar.
* El cron mínimo es de un minuto, así que un aviso puede llegar con hasta un minuto de retraso.

## Otras versiones

* [`firebase/`](firebase/README.md): misma lógica desplegada en Firebase (Cloud Functions + Firestore). Exige el plan Blaze, con tarjeta.
* [`app/`](app/README.md): la primera versión del proyecto, una app Android (Kotlin + Jetpack Compose). Se conserva como cliente alternativo.

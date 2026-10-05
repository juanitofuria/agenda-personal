# Agenda Personal · bot de Telegram en Cloudflare

Tu información de cada día y tus avisos, en **un bot de Telegram** que funciona en cualquier móvil (Android, iPhone…).
Corre en **Cloudflare Workers** con **D1**, en el **plan gratuito y sin tarjeta**. No hay que instalar nada en el móvil salvo Telegram.

```
 Usuario ◀─▶ Telegram ◀─▶ Worker  /telegram ──▶ bot (menús, asistente, eventos, ajustes) ──▶ D1 (SQLite)
                              │                                                              ▲
                              ├─ Cron cada minuto ──── resúmenes y avisos vencidos ──────────┤
                              └─ Cron cada 10 min (04–10 UTC) ─ horóscopo ◀── 20minutos.es ─┘
        Datos externos: Open-Meteo (tiempo y ciudades) · Google News y Bing News (RSS) · Yahoo Finance · 20minutos.es (horóscopo; horoscopefree de respaldo)
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
* **Bot privado** (opcional, ver abajo): solo lo usan el administrador y quien este invite o apruebe.

Comandos: `/menu` `/hoy` `/nueva` `/eventos` `/secciones` `/perfil` `/ayuda` `/cancelar` `/borrar`.
Hay además `/diagnostico` (no sale en el menú): comprueba desde el servidor si llegan Open-Meteo, Google News, Bing News, Yahoo Finance, 20minutos, el podcast y
horoscopefree, y cuántos horóscopos hay guardados hoy. Sirve para saber por qué falla una sección.

## Puesta en marcha

Necesitas **Node 20 o superior** y una cuenta gratuita en [Cloudflare](https://dash.cloudflare.com/sign-up).
**No hace falta `npm install`**: el Worker ya viene empaquetado en `cloudflare/dist/worker.js` y se despliega con `npx`, que
guarda sus herramientas fuera del proyecto. Por eso la carpeta puede estar en una unidad sincronizada (Google Drive, OneDrive…).

Todos los comandos, desde la carpeta `cloudflare/`:

1. **Crea el bot** en Telegram: habla con [@BotFather](https://t.me/BotFather), envía `/newbot` y guarda el **token**.
2. **Entra en Cloudflare** (abre el navegador y autoriza tu cuenta):
   ```bash
   npx wrangler@4.147.0 login
   ```
3. **Crea la base de datos**, copia el `database_id` que imprime en `wrangler.toml` (línea `database_id = …`) y crea las tablas:
   ```bash
   npx wrangler@4.147.0 d1 create agenda-personal
   npx wrangler@4.147.0 d1 execute agenda-personal --remote --file=schema.sql
   ```
4. **Guarda los secretos** (Cloudflare los cifra; no van en el código):
   ```bash
   npx wrangler@4.147.0 secret put TELEGRAM_BOT_TOKEN        # pega el token de BotFather
   npx wrangler@4.147.0 secret put TELEGRAM_WEBHOOK_SECRET   # una cadena aleatoria de 16–256 letras, números, - o _
   ```
5. **Despliega**:
   ```bash
   npx wrangler@4.147.0 deploy
   ```
   Imprime la URL del Worker: `https://agenda-personal.TU-USUARIO.workers.dev`.
6. **Registra el webhook** en Telegram con esa URL **terminada en `/telegram`** y el mismo secreto del paso 4
   (también registra el menú de comandos del bot). En Windows (`cmd`):
   ```bat
   set TELEGRAM_BOT_TOKEN=123:ABC
   set TELEGRAM_WEBHOOK_SECRET=la-misma-cadena
   node ..\firebase\functions\scripts\configurar-telegram.mjs https://agenda-personal.TU-USUARIO.workers.dev/telegram
   ```
   En Linux/macOS: `TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_WEBHOOK_SECRET=la-misma-cadena node ../firebase/functions/scripts/configurar-telegram.mjs <URL>`.
7. Abre tu bot en Telegram y escribe **/start**. Para ver los registros en directo: `npx wrangler@4.147.0 tail`.

**Para actualizar** a una versión nueva del código: descarga los archivos y repite solo el paso 5 (`npx wrangler@4.147.0 deploy`).
Los pasos 1–4 y 6 se hacen una sola vez.

### Despliegue automático desde GitHub (opcional)

Con esto no tienes que descargar nada para actualizar: cada cambio que se sube a GitHub se prueba y se despliega solo
(`.github/workflows/deploy-cloudflare.yml`). Se configura una vez:

1. **Crea un token de Cloudflare**: [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → *Create Token* →
   plantilla **Edit Cloudflare Workers** (Account Resources: tu cuenta). Si el paso de la base de datos se queja de permisos, añade al
   token el permiso *D1 · Edit*. Copia el token (solo se muestra una vez).
2. **Apunta el ID de tu cuenta**: está en la URL del panel (`dash.cloudflare.com/<ID de cuenta>/…`) o en *Workers & Pages* → *Account ID*.
3. **Guárdalos en GitHub**: tu repositorio → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*, y crea
   `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`.

A partir de ahí, cada subida a las ramas `main` y `claude/android-notifications-app-pxj3sn` que toque el bot lanza: tests → empaquetado → tablas de D1 → despliegue.
Si faltan los secretos, solo corre los tests y avisa. También se puede lanzar a mano desde la pestaña *Actions* → *Desplegar en Cloudflare* → *Run workflow*.
Los secretos del bot (token de Telegram y secreto del webhook) siguen guardados en Cloudflare y no pasan por GitHub.

**Prueba de humo recomendada:** `/start` → «Resumen de hoy» → una alarma «en 2 minutos» → `/borrar`.

> **Para desarrolladores:** `cd cloudflare && npm install` solo hace falta para ejecutar los tests o cambiar el código. Tras cambiar algo en
> `src/` (o en `../firebase/functions/src`), ejecuta `npm run empaquetar` y sube también `dist/worker.js`; CI lo comprueba.

## Aspecto: estilo, modo y cabeceras del menú

En el asistente inicial se pregunta el **estilo** (😊 informal o 👔 formal) y el **modo** (☀️ claro o 🌙 oscuro), con una imagen de ejemplo de cada opción. Se cambia
cuando quieras en *Mi perfil → 🎨 Apariencia*; si se omite, queda informal y claro. El menú principal sale con una **cabecera (imagen)** de ese estilo y modo, y los
botones repartidos en cuadrícula como en los diseños (el reparto del modo claro y el del oscuro son distintos). Informal usa pictogramas (📋 ⏰ 📅 🧩 👤 ❓); formal usa
un cuadrado de color como acento (🟦 🟪 🟧 🟩 🟥), como el filo de color de las tarjetas formales.

**Lo que Telegram no permite** y por tanto no se puede copiar exactamente de los diseños: la tipografía, los iconos dibujados y los colores de los botones los decide la app
de cada persona; un bot solo puede mandar texto, emojis e imágenes. Por eso la parte «de diseño» (icono, tipografía, ilustración, letra manuscrita) va **dentro de la imagen
de cabecera**, y los botones usan emojis. Los botones llevan además un color (azul, verde o rojo) que solo se ve si la versión de Telegram lo admite; si la API lo rechaza, el
bot lo detecta y sigue sin colores. Un bot tampoco puede saber si la persona usa tema claro u oscuro: de ahí la pregunta.
También hay modo **🔄 automático**: el bot calcula el amanecer y el anochecer de tu ciudad (sin red, a partir de sus coordenadas) y usa el modo oscuro desde el anochecer hasta el amanecer.

### Mini app de Telegram

El menú principal lleva un botón **📱 Abrir la app**: una aplicación web dentro de Telegram (`cloudflare/publico/app/index.html`, la sirve el propio Worker en `/app/`)
con el diseño de las imágenes: tarjetas con iconos de color (informal) o sobrias con serifa y filo de color (formal), en claro u oscuro. A diferencia de los mensajes,
la mini app **sí puede leer el tema real de tu dispositivo** (`Telegram.WebApp.colorScheme`), así que con *Automático* sigue al sistema. Desde ella puedes ver y mandarte
al chat el resumen, crear/completar/borrar alarmas, citas y tareas, activar secciones y cambiar su hora, cambiar de ciudad y elegir estilo y tema.
El contenido (tiempo, noticias, horóscopo…) se ve dentro de la propia app, no en el chat. El menú del chat es solo el botón de entrada (y el botón fijo «📱 Agenda» junto al cuadro de texto abre también la app). Todo usa los mismos datos que el bot, y cada petición va firmada por Telegram (cabecera `Authorization: tma <initData>`, comprobada con el token del bot); en un bot privado
solo entra quien tenga acceso. No hay que configurar nada más: el botón aparece solo. Para ver el diseño fuera de Telegram: `…/app/?demo=1&estilo=formal&modo=oscuro`.

Las cuatro cabeceras son PNG en `cloudflare/publico/` (se sirven desde la propia dirección del Worker; Telegram las descarga de ahí). Se regeneran con
`cd tools/banners && npm install && npm run generar` (necesita Chromium; la ilustración y las tipografías están en `tools/banners/generar.mjs`).
Sin dirección pública (versión de Firebase) el menú es solo texto.

## Bot privado: invitaciones y solicitudes de acceso

Telegram no tiene «bots privados»: cualquiera que encuentre el nombre del bot puede escribirle. Por eso el control se hace dentro del bot, y se activa
al definir quién es el administrador:

1. **Averigua tu número de Telegram**: escribe `/miid` a tu bot (lo contesta a cualquiera, también con el bot abierto). Es un número, no un secreto.
2. **Actívalo** guardando ese número. Lo más simple es la variable `ADMIN_CHAT_ID` de `cloudflare/wrangler.toml` (no es un secreto; es lo que está configurado
   en este repositorio, que es privado). Si prefieres que no figure en el repositorio, bórrala de ahí y guárdalo como secreto (en `cloudflare/`; pega el número cuando lo pida),
   pero nunca las dos cosas a la vez:
   ```bash
   npx wrangler@4.147.0 secret put ADMIN_CHAT_ID
   ```
   Como secreto es inmediato y no hace falta desplegar; como variable se activa con el siguiente despliegue. **Si te equivocas de número** y te quedas fuera, repite el comando con el correcto
   (o `npx wrangler@4.147.0 secret delete ADMIN_CHAT_ID` para volver a dejar el bot abierto).
3. A partir de ahí, quien no esté autorizado solo ve «Bot privado» con un botón **🙋 Pedir acceso**. Tú recibes el aviso con **✅ Aprobar / 🚫 Rechazar**:
   si apruebas, el bot le envía una **invitación personal** (un botón/enlace `t.me/<bot>?start=inv_…` que solo vale para esa persona, una vez, y caduca a los 7 días).

Comandos del administrador (los demás no existen para el resto): `/acceso` (panel; también el botón **🔐 Acceso** del menú), `/invitar` (enlace de un uso para
repartir), `/solicitudes` (pendientes, con sus botones) y `/usuarios` (quién tiene acceso; **🗑 Quitar** pide confirmación y borra sus datos).
Quien tenía el bot antes de activar esto y no sea el administrador pierde el acceso y deja de recibir sus resúmenes programados.
`/diagnostico` también pasa a ser solo del administrador. Esta función está en la lógica común; en la versión de Firebase está disponible pero no
se ha cableado el secreto del administrador.

## Datos en D1 (solo accesibles desde el Worker)

| Tabla | Contenido |
|---|---|
| `acceso`, `invitaciones`, `solicitudes` | quién puede usar el bot, invitaciones de un uso (con caducidad) y peticiones de acceso (solo si hay administrador) |
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
| `cloudflare/publico/` | Las 4 cabeceras PNG del menú (informal/formal × claro/oscuro), que sirve el propio Worker |
| `tools/banners/` | Generador de esas cabeceras (HTML + Chromium); solo para desarrollo |
| `cloudflare/dist/worker.js` | El Worker ya empaquetado (con sus librerías dentro): es lo que se despliega |
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
| CPU por ejecución | 10 ms | Esperar a la red no cuenta. Cada sección y cada aviso se atiende en **su propia ejecución** (el Worker se llama a sí mismo con un *service binding*); el lector de RSS es ligero (~1 ms frente a ~50 ms de una librería XML) y los formateadores de fechas se reutilizan |
| Subpeticiones | 50 por ejecución | `HttpFetch` cuenta (tope 45). Como cada sección se hace en su propia ejecución, cada una tiene sus 50; el horóscopo pide 4 signos por ejecución |
| Conexiones salientes simultáneas | 6 | `HttpFetch` limita a 5 a la vez |
| Cron Triggers | 5 por cuenta | Se usan 2 |
| D1 | 5 millones de lecturas y 100.000 escrituras al día, 5 GB | Uso personal: muy por debajo |

## Tests

```bash
cd cloudflare && npm install && npm test              # 11 tests: almacén D1 (sobre SQLite), bot + planificador con D1, webhook, cliente HTTP
cd firebase/functions && npm install && npm test      # 128 tests de la lógica común
```

Cubren: fechas en español y horario de verano; luna contra eclipses y lunas llenas conocidas; el asistente inicial completo
(y omitirlo); crear, ver, modificar y eliminar alarmas, citas y tareas; secciones y temas; cambio de ciudad; borrado de datos;
el planificador (envío a su hora, repeticiones, posponer, retrasos, reintentos, bloqueos, dos ejecuciones simultáneas); la
seguridad del webhook; el troceado de mensajes largos; que ningún botón supere los límites de Telegram; y el presupuesto de
peticiones. Los servicios externos se simulan con respuestas de la forma real de cada API.
Para probar el Worker en local (workerd): `npx wrangler dev --test-scheduled`, con un `.dev.vars` que defina los dos secretos.

## Límites y cosas a tener en cuenta

* **CPU en producción:** una sección en frío cuesta del orden de 2–7 ms de CPU en pruebas locales (mercados, la más pesada, ~10), así que
  caben de una en una pero no todas juntas: por eso se reparten en ejecuciones propias. Lo real solo se ve en Cloudflare:
  `npx wrangler@4.147.0 tail` mostrará «Worker exceeded CPU time limit» si alguna se pasa; la salida sería simplificar esa sección o pasar al plan de pago.
* **Avisos que no se pierden:** si una ejecución muere a medias, el resumen o la alarma quedan «alquilados» 10 minutos y se reintentan solos.
* **No comprobado en el entorno de desarrollo** (sin red hacia estos servicios): la API real de Telegram, las respuestas reales
  de Open-Meteo, Google News, Yahoo Finance y horoscopefree, y el despliegue en tu cuenta. Las pruebas usan dobles.
* **Yahoo Finance** no es una API oficial y puede bloquear o limitar IPs de Cloudflare; si falla, la sección de mercados avisa y
  el resto funciona. **Noticias**: se piden a la vez a Google News y a Bing News (RSS) y vale la primera que responda, porque desde algunos
  servidores una de las dos se cuelga. Ninguna es una API garantizada.
* **Horóscopo**: el texto es el que publica **20minutos.es** en la página de cada signo, tal cual, y el bot cierra siempre con la línea
  «Fuente: 20minutos.es» (con enlace). Lo lee **directamente** (una petición por signo y día; no hay afiliación con el editor) y, si eso falla,
  pide a [horoscopefree](https://github.com/vitorebatista/horoscopefree) (MIT), un servicio público que hace lo mismo y que a veces está
  caído. Si falta el de hoy se pide en el momento y se guarda. Un botón enlaza al episodio del **podcast «El Horóscopo Diario»** del signo
  (feed RSS; se cambia con `PODCAST_FEED`); el audio no se descarga ni se copia, solo se enlaza.
  Para uso personal es razonable; **antes de abrir el bot a otras personas** conviene pedir permiso al editor o usar una fuente con
  licencia. Si 20minutos cambia el diseño de su página, el lector (`firebase/functions/src/horoscopo20min.ts`) dejará de encontrar el
  texto y el bot usará el respaldo.
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

# Agenda Personal · bot de Telegram en Firebase

> **¿Sin tarjeta?** Esta versión exige el plan Blaze de Firebase. La versión gratuita está en [`../cloudflare/README.md`](../cloudflare/README.md); comparte la lógica de `functions/src`.

Un único sistema en la nube que funciona en **cualquier móvil** (Android, iPhone…) a través de Telegram: te pregunta lo que
te interesa al empezar, te manda cada día los resúmenes a la hora que elijas y tiene menús con botones para crear y
modificar alarmas, citas y tareas.

```
                    ┌──────────────────────── Firebase (Google Cloud) ────────────────────────┐
 Usuario ◀─▶ Telegram ◀─▶ telegramWebhook ──▶ bot (menús, asistente, eventos, ajustes) ──▶ Firestore
                    │                                                                      ▲
                    │   enviarProgramados (cada minuto) ── resúmenes y avisos vencidos ────┤
                    │   actualizarHoroscopoDiario (05:30 · 07:00 · 11:00) ◀── horoscopefree ┘
                    └─────────────────────────────────────────────────────────────────────────┘
        Datos externos: Open-Meteo (tiempo y ciudades) · Google News RSS · Yahoo Finance · horoscopefree
```

## Qué hace el bot

* **Al escribir `/start`**: asistente con botones (todo opcional, siempre con «Omitir»): qué secciones quieres, aficiones y temas
  (23 predefinidos y los que escribas), nombre, fecha de nacimiento (para el horóscopo), municipio y zona horaria.
  Si se omite, entra directo al menú con noticias, agenda y mercados.
* **Resúmenes programados** (cada uno a la hora que elijas, en tu zona horaria): ⛅ tiempo (gráfica por horas, lluvia prevista,
  amanecer/anochecer, viento, humedad, UV, luna y calendario lunar), 📰 noticias (economía, política, tu ayuntamiento y tu
  municipio), 🗓 agenda, 🔮 horóscopo, 📈 mercados y una sección de noticias por cada tema que sigas.
* **Alarmas, citas y tareas**: se crean con botones y escribiendo la fecha como quieras («mañana 9:30», «15/10 18:00»,
  «lunes 10h», «en 2 horas»). Las alarmas pueden repetirse (cada día, de lunes a viernes, cada semana) y las citas avisan con
  antelación. Se pueden **ver, modificar (título, fecha, lugar, antelación, repetición) y eliminar**.
* **Cada aviso trae botones**: 🗑 Eliminar · ✅ Conservar · ✏️ Modificar · 💤 Posponer 10 min.
* **Ajustes**: activar/desactivar secciones, cambiar la hora de cada una, añadir y quitar temas, cambiar nombre, fecha de
  nacimiento y ciudad (al cambiar de ciudad se recalculan las horas según la nueva zona horaria).
* **Privacidad**: `/borrar` elimina todos tus datos y deja de enviarte mensajes.

Comandos: `/menu` `/hoy` `/nueva` `/eventos` `/secciones` `/perfil` `/ayuda` `/cancelar` `/borrar`.

## Puesta en marcha

1. **Crea el bot** en Telegram: habla con [@BotFather](https://t.me/BotFather), envía `/newbot` y guarda el **token**.
2. **Proyecto de Firebase** (<https://console.firebase.google.com>): crea uno, activa **Cloud Firestore** (modo producción,
   región `eur3` o `europe-west1`) y pasa al **plan Blaze**. El plan de pago por uso es obligatorio para las funciones
   programadas y para llamar a APIs externas; el consumo de un uso personal entra en la cuota gratuita, pero pon una alerta
   de presupuesto igualmente.
3. **Herramientas**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. Edita `firebase/.firebaserc` y cambia `TU-PROYECTO-FIREBASE` por el id de tu proyecto.
5. **Secretos** (se guardan en Secret Manager, nunca en el código):
   ```bash
   cd firebase
   firebase functions:secrets:set TELEGRAM_BOT_TOKEN        # pega el token de BotFather
   firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET   # una cadena aleatoria: openssl rand -hex 24
   ```
6. **Despliega**:
   ```bash
   cd functions && npm install && cd ..
   firebase deploy
   ```
   Al terminar muestra la URL de `telegramWebhook` (algo como `https://europe-west1-TU-PROYECTO.cloudfunctions.net/telegramWebhook`).
7. **Registra el webhook** en Telegram con la URL anterior y los mismos valores de los secretos:
   ```bash
   cd functions
   TELEGRAM_BOT_TOKEN=123:ABC TELEGRAM_WEBHOOK_SECRET=la-misma-cadena npm run webhook -- https://europe-west1-TU-PROYECTO.cloudfunctions.net/telegramWebhook
   ```
   (también registra el menú de comandos del bot.)
8. Abre tu bot en Telegram y escribe **/start**.

El horóscopo lo rellena `actualizarHoroscopoDiario` (05:30, 07:00 y 11:00, hora de Madrid). Para probarlo sin esperar, en
Google Cloud › Cloud Scheduler abre `firebase-schedule-actualizarHoroscopoDiario-europe-west1` y pulsa *Forzar ejecución*.

## Datos en Firestore (solo accesibles desde el servidor)

| Colección | Contenido |
|---|---|
| `usuarios/{chatId}` | nombre, nacimiento, zona horaria, ciudad, secciones (activa + hora), temas, estado de la conversación |
| `usuarios/{chatId}/eventos/{id}` | alarma/cita/tarea: título, lugar, fecha y hora (UTC), antelación, repetición, estado |
| `programaciones/{id}` | qué hay que enviar y cuándo (`proximo`); el programador lee las vencidas cada minuto |
| `horoscopos/{signo}` | texto del día, fecha, fuente y enlace |
| `cache/{clave}` | respuestas de APIs externas compartidas entre usuarios (30–45 min) |

Las reglas de Firestore **deniegan todo acceso a clientes**: solo las Cloud Functions (SDK Admin) leen y escriben.

## Cómo está hecho

| Archivo | Para qué |
|---|---|
| `src/index.ts` | Las tres funciones: `telegramWebhook`, `enviarProgramados`, `actualizarHoroscopoDiario` |
| `src/webhook.ts` | Seguridad del webhook (método, secreto en tiempo constante) y entrega al bot |
| `src/bot/` | El bot: `bot.ts` (rutas), `onboarding.ts`, `eventos.ts`, `ajustes.ts`, `vistas.ts`, `catalogo.ts` |
| `src/scheduler.ts` | Envía lo vencido: reclamo atómico, reintentos, repeticiones, posponer, retrasos, bloqueos |
| `src/secciones/` | Contenido de cada resumen: tiempo, noticias, mercados, horóscopo, agenda, temas |
| `src/fechas.ts` | Zonas horarias, horario de verano y lectura de fechas en español |
| `src/luna.ts` | Fases lunares con el algoritmo de Meeus (sin red) |
| `src/canal.ts`, `src/telegram.ts` | El **canal** de mensajería (interfaz) y su implementación para Telegram |
| `src/almacen*.ts` | Persistencia: interfaz, versión en memoria (tests) y versión Firestore |

### Cómo añadir WhatsApp (u otro canal)
Todo el bot habla con un `Canal` (enviar, editar, responder a un botón). Para otro servicio basta una nueva implementación y
su webhook que convierta los mensajes en `Entrada`. **WhatsApp es posible pero con condiciones**: la API oficial (WhatsApp
Business Cloud API) exige una cuenta de Meta Business verificada, y los mensajes que envía el bot por su cuenta (los
resúmenes diarios y los avisos) tienen que usar **plantillas aprobadas por Meta y se cobran por conversación**. Además solo
permite 3 botones de respuesta por mensaje o listas de hasta 10 opciones, así que los menús habría que rediseñarlos.
Telegram no tiene ninguna de esas restricciones ni coste, por eso se empieza por él.

## Tests

```bash
cd firebase/functions && npm install && npm test     # 127 tests
```

Cubren: lectura de fechas en español y horario de verano; luna contra eclipses y lunas llenas conocidas; el asistente
inicial completo (y omitirlo); crear, ver, modificar y eliminar alarmas, citas y tareas; secciones y temas; cambio de
ciudad y de zona horaria; borrado de datos; el programador (envío a su hora, repeticiones, posponer, retrasos, reintentos,
bloqueos, dos ejecuciones simultáneas); la seguridad del webhook; el troceado de mensajes largos; y que ningún botón
supere los límites de Telegram. Los servicios externos se simulan con respuestas de la forma real de cada API.

## Límites y cosas a tener en cuenta

* **Lo que no se ha podido comprobar** en el entorno de desarrollo (sin red hacia estos servicios ni credenciales): el
  despliegue en Firebase, la API real de Telegram, las respuestas reales de Open-Meteo, Google News, Yahoo Finance y
  horoscopefree, y el comportamiento de Firestore (las consultas están escritas según su documentación, sin emulador).
  Las pruebas usan dobles; conviene hacer una **prueba de humo** tras desplegar: `/start`, un resumen desde «Resumen de hoy»,
  una alarma «en 2 minutos» y `/borrar`.
* **Yahoo Finance** no es una API oficial y puede bloquear o limitar las IP de Google Cloud; si falla, la sección de
  mercados avisa y el resto funciona. **Google News RSS** tampoco es una API garantizada.
* **Horóscopo**: [horoscopefree](https://github.com/vitorebatista/horoscopefree) (MIT) extrae el texto en español de
  **20minutos.es**; no hay afiliación con el editor. El bot muestra siempre la fuente con enlace (condición de uso de esa API).
  Para uso personal es razonable; **antes de abrir el bot a otras personas** conviene pedir permiso al editor o usar una fuente
  con licencia. La instancia pública no tiene garantía de disponibilidad (puedes alojar la tuya y cambiar
  `HOROSCOPO_BASE_URL` en `functions/.env`).
* **Datos personales**: se guarda el id del chat, el nombre que escribe el usuario, la fecha de nacimiento y la ciudad. Si el
  bot lo van a usar otras personas, necesitarás informarles (política de privacidad) y atender sus peticiones; `/borrar` ya
  elimina todo. Open-Meteo es gratuito para uso no comercial con límites diarios: la caché evita repetir consultas iguales.
* **Escala**: está pensado para decenas o unos pocos cientos de usuarios. El programador envía en serie (hasta 150 envíos por
  minuto); con muchos más habría que repartir el trabajo. Dos mensajes del mismo usuario procesados a la vez podrían pisarse
  datos (Firestore sin transacción por usuario); en un uso normal no ocurre.
* Telegram no permite que un bot escriba a quien no lo haya iniciado; si alguien bloquea el bot se le deja de programar.
* El programador se ejecuta cada minuto (Cloud Scheduler admite como mínimo ese intervalo), así que un aviso puede llegar con
  hasta un minuto de retraso.

# Backend del horóscopo (Firebase)

Arquitectura (la de la guía, con **Aztro** como fuente):

```
[ Aztro API ] ── 12 peticiones POST al día ──▶ [ Cloud Function (06:00 Madrid) ] ──▶ [ Cloud Firestore ] ──▶ [ App Android ]
                                                  traduce al español (opcional)         horoscopos/{signo}      lectura + caché offline
```

La app **nunca** habla con Aztro: lee `horoscopos/{signo}` de Firestore (el SDK guarda una copia en disco, así que
funciona sin conexión). Aztro recibe solo 12 peticiones al día, vengan los usuarios que vengan.

## Qué hay aquí

| Archivo | Para qué |
|---|---|
| `functions/src/horoscopo.ts` | Lógica (pide a Aztro, traduce, normaliza, guarda). Sin dependencias de Firebase, con tests |
| `functions/src/index.ts` | La función programada `actualizarHoroscopoDiario` |
| `functions/src/horoscopo.test.ts` | 18 tests (`npm test`) |
| `firestore.rules` | Lectura pública de `horoscopos/*`, escritura prohibida (solo la función, con el SDK Admin) |
| `firebase.json`, `.firebaserc` | Configuración del proyecto (**edita `.firebaserc` con el id de tu proyecto**) |

## Puesta en marcha

1. **Crea un proyecto** en <https://console.firebase.google.com> y activa **Cloud Firestore** (modo producción, región `eur3` o `europe-west1`).
2. **Plan Blaze**: las funciones programadas usan Cloud Scheduler, que exige tener el plan de pago por uso activado
   (tiene cuota gratuita y el consumo de esta función es mínimo, pero conviene poner una alerta de presupuesto).
3. Instala y entra:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
4. Edita `firebase/.firebaserc` y cambia `TU-PROYECTO-FIREBASE` por el id de tu proyecto.
5. Despliega (reglas, índices y función):
   ```bash
   cd firebase/functions && npm install && cd ..
   firebase deploy
   ```
6. **Traducción** (la fuente está en inglés): habilita la API *Cloud Translation* en Google Cloud para ese proyecto. Si no
   quieres traducir, crea `firebase/functions/.env` con `TRADUCIR=false` y se publicará en inglés. Si la traducción falla
   en algún momento, la función publica el texto original y la app avisa de que está en inglés.
7. **App Android**: en la consola de Firebase añade una app Android con el paquete `com.agendapersonal`, descarga
   `google-services.json` y colócalo en `app/google-services.json` (está en `.gitignore`). Sin ese archivo la app compila
   igual y la sección Horóscopo indica que aún no está disponible.
8. **Probar sin esperar a las 06:00**: en Google Cloud › Cloud Scheduler, abre el trabajo
   `firebase-schedule-actualizarHoroscopoDiario-europe-west1` y pulsa *Forzar ejecución*. Después mira en Firestore
   que existen los 12 documentos `horoscopos/aries`, `tauro`, `geminis`… y los registros con `firebase functions:log`.

## Documento que escribe la función

```jsonc
// horoscopos/aries
{
  "signo": "aries", "fecha": "2026-10-04",
  "prediccion": "Hoy es un buen día para…", "idioma": "es",       // "en" si no se pudo traducir
  "animo": "Relajado", "color": "Magenta", "numeroSuerte": "17", "horaSuerte": "14:00", "compatibilidad": "Libra",
  "rangoFechas": "Mar 21 - Apr 20", "prediccionOriginal": "Today you feel…",
  "fuente": "Aztro (astrology.kudosmedia.net)", "actualizadoEn": "2026-10-04T04:00:03.123Z"
}
```

## Detalles que conviene saber

* **Aztro** (<https://github.com/sameerkumar18/aztro>, Apache-2.0) es una API gratuita sin clave, alojada por una sola
  persona: **sin garantías de disponibilidad y sin términos de uso publicados**. Los textos proceden de
  `astrology.kudosmedia.net`, así que sus derechos de reutilización no están claros. Para uso personal es razonable;
  antes de publicar la app en una tienda, revisa ese punto. Para depender menos de la instancia pública puedes
  desplegar tu propia copia de Aztro y cambiar `AZTRO_BASE_URL` (en `functions/.env`).
* Aztro devuelve su "hoy" en **su propia zona horaria**. Por eso la función compara la fecha que recibe con la de Madrid:
  si va un día por detrás pide `tomorrow`; si ninguna coincide, guarda la que trae con su fecha real y la app lo marca
  como «último disponible».
* Nunca se guarda un documento vacío ni uno más antiguo que el existente, así que un fallo de Aztro no borra el
  horóscopo del día anterior.
* La función corre a las **06:00 de Madrid**, antes de la notificación de las 08:00. Si falla algún signo termina con
  error y Cloud Scheduler reintenta (hasta 2 veces).
* Todo se puede cambiar sin tocar código con variables: `AZTRO_BASE_URL`, `AZTRO_PATH` (plantilla con `{signo}` y `{dia}`)
  y `TRADUCIR`.
* Lo que **no** se ha podido comprobar en el entorno de desarrollo: la respuesta real de Aztro, la traducción con Cloud
  Translation y el despliegue en Firebase (no hay red hacia esos servicios ni credenciales). La lógica está probada con
  dobles (`npm test`) y el cliente Android con un origen de pruebas.

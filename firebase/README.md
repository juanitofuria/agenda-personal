# Backend del horóscopo (Firebase)

Arquitectura (la de la guía, con **horoscopefree** como fuente):

```
[ horoscopefree ] ── GET por signo ──▶ [ Cloud Function (05:30 / 07:00 / 11:00 Madrid) ] ──▶ [ Cloud Firestore ] ──▶ [ App Android ]
  (texto en español                       guarda solo lo que aún no está al día              horoscopos/{signo}      lectura + caché offline
   de 20minutos.es)
```

La app **nunca** habla con horoscopefree: lee `horoscopos/{signo}` de Firestore (el SDK guarda una copia en disco, así que
funciona sin conexión). La API de origen recibe como mucho 12 peticiones al día, vengan los usuarios que vengan.

## Qué hay aquí

| Archivo | Para qué |
|---|---|
| `functions/src/horoscopo.ts` | Lógica (pide a horoscopefree, valida, normaliza, guarda). Sin dependencias de Firebase, con tests |
| `functions/src/index.ts` | La función programada `actualizarHoroscopoDiario` |
| `functions/src/horoscopo.test.ts` | 17 tests (`npm test`) |
| `firestore.rules` | Lectura pública de `horoscopos/*`, escritura prohibida (solo la función, con el SDK Admin) |
| `firebase.json`, `.firebaserc` | Configuración del proyecto (**edita `.firebaserc` con el id de tu proyecto**) |

## Puesta en marcha

1. **Crea un proyecto** en <https://console.firebase.google.com> y activa **Cloud Firestore** (modo producción, región `eur3` o `europe-west1`).
2. **Plan Blaze**: las funciones programadas usan Cloud Scheduler, que exige tener el plan de pago por uso activado
   (tiene cuota gratuita y esta función hace muy pocas peticiones, pero conviene poner una alerta de presupuesto).
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
6. **App Android**: en la consola de Firebase añade una app Android con el paquete `com.agendapersonal`, descarga
   `google-services.json` y colócalo en `app/google-services.json` (está en `.gitignore`). Sin ese archivo la app compila
   igual y la sección Horóscopo indica que aún no está disponible.
7. **Probar sin esperar**: en Google Cloud › Cloud Scheduler, abre el trabajo
   `firebase-schedule-actualizarHoroscopoDiario-europe-west1` y pulsa *Forzar ejecución*. Después mira en Firestore
   que existen los documentos `horoscopos/aries`, `tauro`, `geminis`… y los registros con `firebase functions:log`.

## Contrato de horoscopefree que se usa

```
GET {base}/horoscope/{idioma}/{signo}/{fecha}
      idioma = es        signo = aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces (inglés, minúsculas)
      fecha  = yyyy-MM-dd (UTC; en español solo los últimos ~9 días; las fechas futuras dan 400)

200 → { "sign": "aries", "date": "2026-10-04", "language": "es", "text": "…", "source": "https://www.20minutos.es/…", "cached": false }
4xx/5xx → { "error": "VALIDATION" | "NOT_FOUND" | "NETWORK" | "PARSE", "message": "…" }
```

`VALIDATION` (400) y `NOT_FOUND` (404) son errores de configuración y **no se reintentan**; `NETWORK`/`PARSE` (502), los
500 y los fallos de red sí. Esto está tomado de su README; no he podido llamar al servicio real desde el entorno de desarrollo.

## Documento que escribe la función

```jsonc
// horoscopos/aries
{
  "signo": "aries", "fecha": "2026-10-04",
  "prediccion": "Hoy es un buen día para…", "idioma": "es",
  "fuente": "20minutos.es", "fuenteUrl": "https://www.20minutos.es/…",
  "actualizadoEn": "2026-10-04T03:30:02.123Z"
}
```

## Detalles que conviene saber

* **No es una fuente propia**: horoscopefree (<https://github.com/vitorebatista/horoscopefree>, MIT) extrae el texto
  en español de **20minutos.es**. Su autor pide **mostrar la URL de la fuente junto al texto** (la app lo hace, con enlace) y
  respetar los términos del editor; no hay afiliación con él. Para uso personal es razonable; **antes de publicar la app en
  una tienda**, conviene pedir permiso al editor o cambiar a una fuente con licencia.
* La instancia pública (`https://horoscopefree.fly.dev`) **no tiene garantía de disponibilidad**. Para depender menos de ella
  puedes alojar la tuya (Node ≥ 22.18, o su `Dockerfile`/`fly.toml`) y cambiar `HOROSCOPO_BASE_URL`.
* **No sirve texto de días anteriores si falla el scraping**: devuelve error. Por eso la función se ejecuta tres veces al día
  (05:30, 07:00 y 11:00, hora de Madrid): la primera vez que el editor ya haya publicado el de hoy se guarda, y las siguientes
  no piden nada de lo que ya está al día. Mientras tanto la app muestra el último guardado, marcado como «último disponible».
* Nunca se guarda un documento vacío ni uno más antiguo que el existente, así que un fallo no borra el horóscopo anterior.
  Solo se aceptan URLs `http(s)` como fuente.
* La fecha es la de **Madrid**. No se programa entre las 00:00 y las 02:00 porque en ese tramo el «hoy» de Madrid todavía es
  «mañana» en UTC y la API lo rechaza como fecha futura.
* Solo hay un texto general por signo (no hay desglose en salud, dinero, trabajo y amor ni datos de la suerte).
* Se puede cambiar sin tocar código con variables (`functions/.env`): `HOROSCOPO_BASE_URL` y `HOROSCOPO_IDIOMA`.
* Lo que **no** se ha podido comprobar: la respuesta real del servicio y el despliegue en Firebase (no hay red hacia esos
  servicios ni credenciales en el entorno de desarrollo). La lógica está probada con dobles (`npm test`) y el cliente
  Android con un origen de pruebas.

import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";
import { actualizarTodos } from "./horoscopo";

initializeApp();

// Ajustes (se pueden cambiar sin tocar código: functions/.env o variables al desplegar).
// Por defecto se usa la instancia pública de horoscopefree; para depender menos de ella puedes alojar la tuya (MIT).
const HOROSCOPO_BASE_URL = defineString("HOROSCOPO_BASE_URL", { default: "https://horoscopefree.fly.dev" });
const HOROSCOPO_IDIOMA = defineString("HOROSCOPO_IDIOMA", { default: "es" });

const ZONA = "Europe/Madrid"; // zona horaria de los usuarios

/**
 * Descarga el horóscopo de los 12 signos y lo guarda en Firestore. La app lee de ahí, así que la API de origen recibe
 * como mucho 12 peticiones al día, vengan los usuarios que vengan.
 *
 * Se ejecuta a las 05:30, 07:00 y 11:00 (hora de Madrid): la primera vez que el editor ya haya publicado el de hoy se guarda,
 * y las siguientes ejecuciones no piden nada de lo que ya está al día. Todo queda listo antes de la notificación de las 08:00.
 */
export const actualizarHoroscopoDiario = onSchedule(
  { schedule: "30 5,7,11 * * *", timeZone: ZONA, region: "europe-west1", memory: "256MiB", timeoutSeconds: 540, retryCount: 1 },
  async () => {
    const db = getFirestore();
    const resultado = await actualizarTodos({
      http: axios,
      config: { baseUrl: HOROSCOPO_BASE_URL.value(), idioma: HOROSCOPO_IDIOMA.value() },
      zona: ZONA,
      ahora: new Date(),
      guardar: async (id, doc) => { await db.collection("horoscopos").doc(id).set(doc); },
      fechaGuardada: async (id) => (await db.collection("horoscopos").doc(id).get()).data()?.fecha as string | undefined,
      log: (m) => logger.info(m),
    });
    logger.info("Resultado", resultado);
    // Si falló algún signo se lanza error para que Cloud Scheduler reintente.
    if (resultado.fallidos.length > 0) throw new Error(`Signos sin actualizar: ${resultado.fallidos.join(", ")}`);
  },
);

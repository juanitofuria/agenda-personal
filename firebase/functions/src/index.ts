import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v2 } from "@google-cloud/translate";
import axios from "axios";
import { actualizarTodos, Traductor } from "./horoscopo";

initializeApp();

// Ajustes (se pueden cambiar sin tocar código: functions/.env o variables al desplegar).
// Por defecto se usa la instancia pública de Aztro; para mayor fiabilidad puedes alojar la tuya (es de código abierto).
const AZTRO_BASE_URL = defineString("AZTRO_BASE_URL", { default: "https://aztro.sameerkumar.website" });
const AZTRO_PATH = defineString("AZTRO_PATH", { default: "/?sign={signo}&day={dia}" });
const TRADUCIR = defineString("TRADUCIR", { default: "true" }); // "false" para publicar en inglés

const ZONA = "Europe/Madrid"; // zona horaria de los usuarios

/** Traduce inglés -> español con Cloud Translation (usa las credenciales de la propia función). */
function traductorCloud(): Traductor {
  const cliente = new v2.Translate();
  return async (textos) => {
    const [traducidos] = await cliente.translate(textos, { from: "en", to: "es" });
    return Array.isArray(traducidos) ? traducidos : [traducidos];
  };
}

/**
 * Cada día a las 06:00 (hora de Madrid) descarga el horóscopo de los 12 signos y lo guarda en Firestore.
 * La app lee de ahí, así que la API de origen recibe solo 12 peticiones al día, vengan los usuarios que vengan.
 */
export const actualizarHoroscopoDiario = onSchedule(
  { schedule: "0 6 * * *", timeZone: ZONA, region: "europe-west1", memory: "256MiB", timeoutSeconds: 300, retryCount: 2 },
  async () => {
    const db = getFirestore();
    const resultado = await actualizarTodos({
      http: axios,
      config: { baseUrl: AZTRO_BASE_URL.value(), pathPlantilla: AZTRO_PATH.value() },
      zona: ZONA,
      ahora: new Date(),
      guardar: async (id, doc) => { await db.collection("horoscopos").doc(id).set(doc); },
      fechaGuardada: async (id) => (await db.collection("horoscopos").doc(id).get()).data()?.fecha as string | undefined,
      traductor: TRADUCIR.value() === "false" ? undefined : traductorCloud(),
      log: (m) => logger.info(m),
    });
    logger.info("Resultado", resultado);
    // Si falló algún signo se lanza error para que Cloud Scheduler reintente (retryCount).
    if (resultado.fallidos.length > 0) throw new Error(`Signos sin actualizar: ${resultado.fallidos.join(", ")}`);
  },
);

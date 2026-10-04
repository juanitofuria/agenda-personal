import axios from "axios";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { AlmacenFirestore } from "./almacenFirestore";
import { Deps } from "./bot/ctx";
import { actualizarTodos } from "./horoscopo";
import { tick } from "./scheduler";
import { CanalTelegram } from "./telegram";
import { procesarWebhook } from "./webhook";

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const REGION = "europe-west1";
const ZONA = "Europe/Madrid";

// Secretos (se guardan en Secret Manager con `firebase functions:secrets:set`).
const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");       // el que da @BotFather
const TELEGRAM_WEBHOOK_SECRET = defineSecret("TELEGRAM_WEBHOOK_SECRET"); // una cadena aleatoria que eliges tú

// Ajustes sin secreto (functions/.env).
const HOROSCOPO_BASE_URL = defineString("HOROSCOPO_BASE_URL", { default: "https://horoscopefree.fly.dev" });
const HOROSCOPO_IDIOMA = defineString("HOROSCOPO_IDIOMA", { default: "es" });

function dependencias(): Deps {
  return { almacen: new AlmacenFirestore(db), canal: new CanalTelegram(TELEGRAM_BOT_TOKEN.value(), axios), http: axios, ahora: () => new Date() };
}

/** Recibe los mensajes y los botones del bot de Telegram (la lógica y la seguridad están en `webhook.ts`). */
export const telegramWebhook = onRequest(
  { region: REGION, secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET], timeoutSeconds: 60, memory: "256MiB", maxInstances: 20 },
  async (req, res) => {
    const r = await procesarWebhook(
      dependencias(), TELEGRAM_WEBHOOK_SECRET.value(),
      { metodo: req.method, cabeceraSecreta: req.get("x-telegram-bot-api-secret-token"), cuerpo: req.body },
      (m) => logger.error(m),
    );
    res.status(r.estado).send(r.texto);
  },
);

/** Cada minuto envía los resúmenes y avisos que han vencido. */
export const enviarProgramados = onSchedule(
  { schedule: "every 1 minutes", region: REGION, secrets: [TELEGRAM_BOT_TOKEN], timeoutSeconds: 120, memory: "256MiB", maxInstances: 1 },
  async () => {
    const r = await tick({ ...dependencias(), log: (m) => logger.warn(m) });
    if (r.enviados || r.fallidos) logger.info("tick", r);
  },
);

/**
 * Descarga el horóscopo de los 12 signos de horoscopefree y lo guarda en Firestore (el bot lo lee de ahí).
 * Se ejecuta a las 05:30, 07:00 y 11:00 (Madrid): lo que ya está al día no se vuelve a pedir.
 */
export const actualizarHoroscopoDiario = onSchedule(
  { schedule: "30 5,7,11 * * *", timeZone: ZONA, region: REGION, memory: "256MiB", timeoutSeconds: 540, retryCount: 1 },
  async () => {
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
    if (resultado.fallidos.length > 0) throw new Error(`Signos sin actualizar: ${resultado.fallidos.join(", ")}`);
  },
);

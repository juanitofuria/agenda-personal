import { timingSafeEqual } from "node:crypto";
import { manejarEntrada } from "./bot/bot";
import { Deps } from "./bot/ctx";
import { leerActualizacion } from "./telegram";

/** Comparación en tiempo constante (y segura con cadenas de distinta longitud). */
export function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export interface PeticionWebhook { metodo: string; cabeceraSecreta: string | undefined; cuerpo: unknown }
export interface RespuestaWebhook { estado: number; texto: string }

/**
 * Lógica del webhook de Telegram. Telegram envía el secreto fijado al registrar el webhook en la cabecera
 * X-Telegram-Bot-Api-Secret-Token: cualquier otra petición se rechaza. Se responde 200 aunque falle el procesado,
 * para que Telegram no reintente sin fin una actualización que provoca un error.
 */
export async function procesarWebhook(deps: Deps, secreto: string, p: PeticionWebhook, log: (m: string) => void = () => undefined): Promise<RespuestaWebhook> {
  if (p.metodo !== "POST") return { estado: 405, texto: "method not allowed" };
  if (!iguales(p.cabeceraSecreta ?? "", secreto)) return { estado: 403, texto: "forbidden" };
  try {
    const entrada = leerActualizacion(p.cuerpo);
    if (entrada) await manejarEntrada(deps, entrada);
  } catch (e) {
    log(`webhook: ${(e as Error).message}`);
  }
  return { estado: 200, texto: "ok" };
}

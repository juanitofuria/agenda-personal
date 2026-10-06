import { Almacen } from "./almacen";
import type { webcrypto } from "node:crypto";
import { SuscripcionPush } from "./modelo";

type CryptoKeyPair = webcrypto.CryptoKeyPair;
type JsonWebKey = webcrypto.JsonWebKey;

/**
 * Notificaciones push del navegador (Web Push, RFC 8030/8291/8292) con WebCrypto: sirven en Android, Windows, Mac y iPhone (con la app instalada).
 * Sin servicios de pago ni cuentas: el aviso viaja cifrado hasta el servicio de push del navegador del usuario (Google, Apple o Mozilla).
 */

const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

export const b64u = (b: ArrayBuffer | Uint8Array): string => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = ""; for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const deB64u = (s: string): Uint8Array => {
  const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(t, (c) => c.charCodeAt(0));
};
const concat = (...p: Uint8Array[]): Uint8Array => { const r = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let o = 0; for (const x of p) { r.set(x, o); o += x.length; } return r; };

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const k = await subtle().importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await subtle().deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bytes * 8));
}

/** Cifra el mensaje para una suscripción (aes128gcm, un solo bloque). Devuelve el cuerpo que se envía al servicio de push. */
export async function cifrarPush(mensaje: string, p256dh: string, auth: string, alAzar?: { salt?: Uint8Array; claves?: CryptoKeyPair }): Promise<Uint8Array> {
  const uaPublica = deB64u(p256dh), secretoAuth = deB64u(auth);
  const efimera = alAzar?.claves ?? ((await subtle().generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair);
  const asPublica = new Uint8Array(await subtle().exportKey("raw", efimera.publicKey));
  const uaClave = await subtle().importKey("raw", uaPublica, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const compartido = new Uint8Array(await subtle().deriveBits({ name: "ECDH", public: uaClave }, efimera.privateKey, 256));
  const ikm = await hkdf(compartido, secretoAuth, concat(enc.encode("WebPush: info\0"), uaPublica, asPublica), 32);
  const salt = alAzar?.salt ?? globalThis.crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(ikm, salt, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, enc.encode("Content-Encoding: nonce\0"), 12);
  const relleno = concat(enc.encode(mensaje), Uint8Array.of(2)); // 0x02 marca el último (y único) bloque
  const clave = await subtle().importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv: nonce }, clave, relleno));
  return concat(salt, Uint8Array.of(0, 0, 0x10, 0), Uint8Array.of(asPublica.length), asPublica, cifrado); // salt | tamaño de bloque (4096) | longitud de clave | clave | datos
}

/** Claves VAPID del servidor: se crean la primera vez y se guardan (no hay que configurar nada). */
export interface ClavesVapid { publica: string; privada: JsonWebKey }
const CLAVE_VAPID = "vapid:claves";
const DIEZ_ANYOS_MS = 3650 * 24 * 3600_000;

export async function claveVapid(almacen: Almacen, ahora: Date): Promise<ClavesVapid> {
  const guardada = await almacen.cacheGet(CLAVE_VAPID, ahora);
  if (guardada) { try { return JSON.parse(guardada) as ClavesVapid; } catch { /* se regenera */ } }
  const par = (await subtle().generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const c: ClavesVapid = { publica: b64u(await subtle().exportKey("raw", par.publicKey)), privada: await subtle().exportKey("jwk", par.privateKey) };
  await almacen.cacheSet(CLAVE_VAPID, JSON.stringify(c), DIEZ_ANYOS_MS, ahora);
  return c;
}

/** Cabecera `Authorization` VAPID (JWT ES256) para el servicio de push de ese endpoint. */
export async function cabeceraVapid(endpoint: string, c: ClavesVapid, ahora: Date, contacto = "mailto:admin@agenda.invalid"): Promise<string> {
  const cuerpo = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(ahora.getTime() / 1000) + 12 * 3600, sub: contacto })));
  const dato = `${b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })))}.${cuerpo}`;
  const clave = await subtle().importKey("jwk", c.privada, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const firma = new Uint8Array(await subtle().sign({ name: "ECDSA", hash: "SHA-256" }, clave, enc.encode(dato))); // WebCrypto ya da r||s (64 bytes), el formato que pide JWT
  return `vapid t=${dato}.${b64u(firma)}, k=${c.publica}`;
}

/** Contenido de una notificación. `url` es a donde lleva al tocarla (dentro de la app). */
export interface Aviso { titulo: string; cuerpo: string; url: string; etiqueta?: string; /** Botón de la notificación que abre un enlace con un solo toque (p. ej. enviar un WhatsApp). */ enlace?: { texto: string; url: string } }
export type ResultadoPush = "ok" | "caducada" | "error";
/** Envía un aviso a una suscripción. Lo implementa cada plataforma (en producción, `fetch`). */
export type EmisorPush = (s: SuscripcionPush, aviso: Aviso) => Promise<ResultadoPush>;

/** Crea el emisor real. `post` hace la petición HTTP y devuelve el código de estado. */
export function crearEmisorPush(almacen: Almacen, ahora: () => Date, post: (url: string, cabeceras: Record<string, string>, cuerpo: Uint8Array) => Promise<number>, log: (m: string) => void = () => undefined): EmisorPush {
  return async (s, aviso) => {
    try {
      const vapid = await claveVapid(almacen, ahora());
      const cuerpo = await cifrarPush(JSON.stringify(aviso), s.p256dh, s.auth);
      const estado = await post(s.endpoint, {
        authorization: await cabeceraVapid(s.endpoint, vapid, ahora()),
        "content-encoding": "aes128gcm", "content-type": "application/octet-stream", ttl: "86400", urgency: "normal",
      }, cuerpo);
      if (estado >= 200 && estado < 300) return "ok";
      log(`push ${new URL(s.endpoint).host}: respuesta ${estado}`);
      return estado === 404 || estado === 410 ? "caducada" : "error";
    } catch (e) { log(`push ${s.dispositivo}: ${(e as Error).message}`); return "error"; }
  };
}

/** Texto plano de un mensaje HTML de Telegram (para el cuerpo de una notificación). */
export function textoPlano(html: string, max = 110): string {
  const t = html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[▬─━]+/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

/** Valida una suscripción enviada por el navegador. */
export function suscripcionValida(v: any): v is { endpoint: string; p256dh: string; auth: string } {
  if (!v || typeof v.endpoint !== "string" || v.endpoint.length > 600 || !/^https:\/\//.test(v.endpoint)) return false;
  try { return deB64u(String(v.p256dh)).length === 65 && deB64u(String(v.auth)).length === 16; } catch { return false; }
}

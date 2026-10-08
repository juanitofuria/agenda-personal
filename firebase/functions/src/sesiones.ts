import { Almacen } from "./almacen";
import { usuarioNuevo } from "./modelo";

/**
 * Entrar en la app desde fuera de Telegram (navegador, app instalada): el bot da un enlace de un solo uso (válido 10 minutos) que, al abrirlo,
 * crea una sesión en ese dispositivo. No hay contraseñas. Todo se guarda en la caché del almacén, con caducidad.
 */
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789";
const aleatorio = (n: number) => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(n)), (b) => ALFABETO[b % ALFABETO.length]).join("");
const sha256 = async (t: string) => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))), (b) => b.toString(16).padStart(2, "0")).join("");

export const VIGENCIA_ENLACE_MS = 10 * 60_000;
export const VIGENCIA_SESION_MS = 180 * 24 * 3600_000;
const claveAcceso = (codigo: string) => `acceso:${codigo}`;
const claveSesion = async (token: string) => `sesion:${await sha256(token)}`;

/** Código de un solo uso para vincular un dispositivo a este usuario. */
export async function crearAcceso(almacen: Almacen, uid: string, ahora: Date): Promise<string> {
  const codigo = aleatorio(20);
  await almacen.cacheSet(claveAcceso(codigo), uid, VIGENCIA_ENLACE_MS, ahora);
  return codigo;
}

/** Cambia un código por una sesión (y lo gasta). Devuelve el token de la sesión, o null si el código no vale o ya se usó. */
export async function canjearAcceso(almacen: Almacen, codigo: string, ahora: Date): Promise<{ token: string; uid: string } | null> {
  if (!/^[a-z2-9]{20}$/.test(codigo)) return null;
  const uid = await almacen.cacheGet(claveAcceso(codigo), ahora);
  if (!uid) return null;
  await almacen.cacheSet(claveAcceso(codigo), "", 1, ahora); // un solo uso
  const token = aleatorio(40);
  await almacen.cacheSet(await claveSesion(token), uid, VIGENCIA_SESION_MS, ahora);
  return { token, uid };
}

/** Usuario al que pertenece una sesión (null si no existe o caducó). Con `renovar`, se alarga su vigencia. */
export async function usuarioDeSesion(almacen: Almacen, token: string, ahora: Date, renovar = false): Promise<string | null> {
  if (!/^[a-z2-9]{40}$/.test(token)) return null;
  const clave = await claveSesion(token);
  const uid = await almacen.cacheGet(clave, ahora);
  if (uid && renovar) await almacen.cacheSet(clave, uid, VIGENCIA_SESION_MS, ahora);
  return uid || null;
}

/** Crea una sesión independiente para una instalación web que no viene de Telegram. Cada dispositivo obtiene su propio usuario. */
export async function crearSesionAnonima(almacen: Almacen, ahora: Date): Promise<{ token: string; uid: string }> {
  const uid = `web-${aleatorio(24)}`;
  await almacen.guardarUsuario(usuarioNuevo(uid, "", ahora));
  const token = aleatorio(40);
  await almacen.cacheSet(await claveSesion(token), uid, VIGENCIA_SESION_MS, ahora);
  return { token, uid };
}

export async function cerrarSesion(almacen: Almacen, token: string, ahora: Date): Promise<void> {
  if (/^[a-z2-9]{40}$/.test(token)) await almacen.cacheSet(await claveSesion(token), "", 1, ahora);
}

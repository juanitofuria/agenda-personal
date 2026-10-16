const CERTIFICADOS_FIREBASE = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

import type { webcrypto } from "node:crypto";

export interface IdentidadFirebase {
  uid: string;
  email?: string;
  nombre?: string;
}

type ClaveJwkFirebase = webcrypto.JsonWebKey & { kid?: string; alg?: string };

interface ClavesFirebase {
  claves: Map<string, ClaveJwkFirebase>;
  caduca: number;
}

interface TokenFirebase {
  aud?: unknown;
  exp?: unknown;
  iat?: unknown;
  auth_time?: unknown;
  iss?: unknown;
  sub?: unknown;
  email?: unknown;
  name?: unknown;
}

const decodificar = (segmento: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]+$/.test(segmento)) throw new Error("Segmento JWT no válido");
  const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
};

const leerJson = <T>(segmento: string): T => JSON.parse(new TextDecoder().decode(decodificar(segmento))) as T;

export function crearVerificadorFirebase(
  obtener: typeof fetch = fetch,
  ahora: () => number = Date.now,
): (token: string, proyecto: string) => Promise<IdentidadFirebase | null> {
  let cache: ClavesFirebase | null = null;

  const cargarClaves = async (forzar = false): Promise<Map<string, ClaveJwkFirebase>> => {
    if (!forzar && cache && cache.caduca > ahora()) return cache.claves;
    const respuesta = await obtener(CERTIFICADOS_FIREBASE, { headers: { accept: "application/json" } });
    if (!respuesta.ok) throw new Error(`No se pudieron obtener las claves de Firebase (${respuesta.status})`);
    const cuerpo = await respuesta.json() as { keys?: ClaveJwkFirebase[] };
    if (!Array.isArray(cuerpo.keys)) throw new Error("La respuesta de claves de Firebase no es válida");
    const claves = new Map(cuerpo.keys.filter((clave) => typeof clave.kid === "string").map((clave) => [clave.kid!, clave]));
    if (claves.size === 0) throw new Error("Firebase no publicó claves de firma");
    const maxAge = Number(/max-age=(\d+)/i.exec(respuesta.headers.get("cache-control") ?? "")?.[1] ?? 3600);
    cache = { claves, caduca: ahora() + Math.max(60, Math.min(maxAge, 86_400)) * 1000 };
    return claves;
  };

  return async (token, proyecto) => {
    if (!proyecto || token.length > 16_384) return null;
    const partes = token.split(".");
    if (partes.length !== 3 || partes.some((parte) => !parte)) return null;

    let cabecera: { alg?: unknown; kid?: unknown };
    let claims: TokenFirebase;
    let firma: Uint8Array;
    try {
      cabecera = leerJson(partes[0]);
      claims = leerJson(partes[1]);
      firma = decodificar(partes[2]);
    } catch {
      return null;
    }
    if (cabecera.alg !== "RS256" || typeof cabecera.kid !== "string") return null;

    const segundos = Math.floor(ahora() / 1000);
    if (
      claims.aud !== proyecto ||
      claims.iss !== `https://securetoken.google.com/${proyecto}` ||
      typeof claims.sub !== "string" ||
      claims.sub.length < 1 ||
      claims.sub.length > 128 ||
      typeof claims.exp !== "number" ||
      claims.exp <= segundos ||
      typeof claims.iat !== "number" ||
      claims.iat > segundos + 60 ||
      claims.exp <= claims.iat ||
      typeof claims.auth_time !== "number" ||
      claims.auth_time > segundos + 60
    ) return null;

    let clave = (await cargarClaves()).get(cabecera.kid);
    if (!clave) clave = (await cargarClaves(true)).get(cabecera.kid);
    if (!clave || clave.kty !== "RSA" || clave.alg !== "RS256") return null;

    let valida = false;
    try {
      const publica = await crypto.subtle.importKey("jwk", clave, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      valida = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publica, firma, new TextEncoder().encode(`${partes[0]}.${partes[1]}`));
    } catch {
      return null;
    }
    if (!valida) return null;

    return {
      uid: claims.sub,
      ...(typeof claims.email === "string" ? { email: claims.email } : {}),
      ...(typeof claims.name === "string" ? { nombre: claims.name } : {}),
    };
  };
}

export const verificarTokenFirebase = crearVerificadorFirebase();

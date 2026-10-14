import { test } from "node:test";
import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import type { webcrypto } from "node:crypto";
import { crearVerificadorFirebase } from "./firebaseAuth";

const PROYECTO = "nexora-test";
const AHORA = 1_800_000_000_000;
const pares = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...pares.publicKey.export({ format: "jwk" }), kid: "clave-1", alg: "RS256", use: "sig" } as webcrypto.JsonWebKey & { kid: string; alg: string; use: string };
const segmento = (valor: unknown) => Buffer.from(JSON.stringify(valor)).toString("base64url");

function token(claims: Record<string, unknown> = {}) {
  const cabecera = segmento({ alg: "RS256", kid: "clave-1", typ: "JWT" });
  const carga = segmento({
    aud: PROYECTO,
    iss: `https://securetoken.google.com/${PROYECTO}`,
    sub: "firebase-user-123",
    iat: AHORA / 1000 - 30,
    auth_time: AHORA / 1000 - 60,
    exp: AHORA / 1000 + 3600,
    email: "ana@example.com",
    name: "Ana",
    ...claims,
  });
  const firmado = `${cabecera}.${carga}`;
  const firma = createSign("RSA-SHA256").update(firmado).sign(pares.privateKey).toString("base64url");
  return `${firmado}.${firma}`;
}

const obtenerClaves: typeof fetch = async () => Response.json({ keys: [jwk] }, { headers: { "cache-control": "public, max-age=3600" } });

test("verifica firma y claims Firebase y devuelve solo identidad necesaria", async () => {
  const verificar = crearVerificadorFirebase(obtenerClaves, () => AHORA);
  assert.deepEqual(await verificar(token(), PROYECTO), { uid: "firebase-user-123", email: "ana@example.com", nombre: "Ana" });
});

test("rechaza token manipulado, caducado o de otro proyecto", async () => {
  const verificar = crearVerificadorFirebase(obtenerClaves, () => AHORA);
  const original = token();
  const [cabecera, carga, firma] = original.split(".");
  const claims = JSON.parse(Buffer.from(carga, "base64url").toString()) as Record<string, unknown>;
  const alterado = `${cabecera}.${segmento({ ...claims, name: "Eva" })}.${firma}`;
  assert.equal(await verificar(alterado, PROYECTO), null);
  assert.equal(await verificar(token({ exp: AHORA / 1000 - 1 }), PROYECTO), null);
  assert.equal(await verificar(token(), "otro-proyecto"), null);
});

test("falla explícitamente si Firebase no está disponible para validar la sesión", async () => {
  const verificar = crearVerificadorFirebase(async () => new Response(null, { status: 503 }), () => AHORA);
  await assert.rejects(verificar(token(), PROYECTO), /claves de Firebase \(503\)/);
});

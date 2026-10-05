import assert from "node:assert/strict";
import { createDecipheriv, createECDH, createPublicKey, hkdfSync, randomBytes, verify } from "node:crypto";
import test from "node:test";
import { AlmacenMemoria } from "./almacen";
import { b64u, cabeceraVapid, cifrarPush, claveVapid, crearEmisorPush, deB64u, suscripcionValida, textoPlano } from "./webpush";

/** Receptor de referencia (lo que hace el navegador), escrito aparte con node:crypto para comprobar el cifrado. */
function descifrar(cuerpo: Uint8Array, receptor: ReturnType<typeof createECDH>, auth: Buffer): string {
  const salt = Buffer.from(cuerpo.subarray(0, 16)), rs = Buffer.from(cuerpo.subarray(16, 20)).readUInt32BE(0), idlen = cuerpo[20];
  const asPub = Buffer.from(cuerpo.subarray(21, 21 + idlen)), datos = Buffer.from(cuerpo.subarray(21 + idlen));
  assert.equal(rs, 4096); assert.equal(idlen, 65); assert.ok(datos.length <= rs);
  const uaPub = receptor.getPublicKey();
  const secreto = receptor.computeSecret(asPub);
  const ikm = Buffer.from(hkdfSync("sha256", secreto, auth, Buffer.concat([Buffer.from("WebPush: info\0"), uaPub, asPub]), 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const d = createDecipheriv("aes-128-gcm", cek, nonce); d.setAuthTag(datos.subarray(datos.length - 16));
  const claro = Buffer.concat([d.update(datos.subarray(0, datos.length - 16)), d.final()]);
  assert.equal(claro[claro.length - 1], 2); // delimitador del último bloque
  return claro.subarray(0, claro.length - 1).toString("utf8");
}
const receptor = () => { const e = createECDH("prime256v1"); e.generateKeys(); const auth = randomBytes(16); return { e, auth, p256dh: b64u(e.getPublicKey()), authB64: b64u(auth) }; };

test("cifrarPush: el navegador (receptor de referencia) puede descifrar el aviso, incluso con acentos y emojis", async () => {
  const r = receptor();
  for (const m of ['{"titulo":"⏰ Tomar la pastilla","cuerpo":"Hoy · 21:00"}', "x", "ñ".repeat(1200)]) {
    const cuerpo = await cifrarPush(m, r.p256dh, r.authB64);
    assert.equal(descifrar(cuerpo, r.e, r.auth), m);
  }
  assert.notDeepEqual(await cifrarPush("a", r.p256dh, r.authB64), await cifrarPush("a", r.p256dh, r.authB64)); // sal y clave efímera distintas cada vez
});

test("VAPID: las claves se crean una vez y la firma del JWT es válida para la clave pública publicada", async () => {
  const al = new AlmacenMemoria(), ahora = new Date("2026-10-05T10:00:00Z");
  const c1 = await claveVapid(al, ahora), c2 = await claveVapid(al, ahora);
  assert.deepEqual(c1, c2); assert.equal(deB64u(c1.publica).length, 65);
  const cab = await cabeceraVapid("https://fcm.googleapis.com/fcm/send/abc", c1, ahora);
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(cab)!; assert.ok(m); assert.equal(m[4], c1.publica);
  const claims = JSON.parse(Buffer.from(deB64u(m[2])).toString()); assert.equal(claims.aud, "https://fcm.googleapis.com"); assert.ok(claims.exp > ahora.getTime() / 1000 && claims.exp <= ahora.getTime() / 1000 + 86400);
  const pub = createPublicKey({ key: { kty: "EC", crv: "P-256", x: b64u(deB64u(c1.publica).subarray(1, 33)), y: b64u(deB64u(c1.publica).subarray(33)) }, format: "jwk" });
  assert.ok(verify("sha256", Buffer.from(`${m[1]}.${m[2]}`), { key: pub, dsaEncoding: "ieee-p1363" }, Buffer.from(deB64u(m[3]))));
});

test("emisor de push: manda el cuerpo cifrado con las cabeceras correctas y distingue suscripción caducada de error", async () => {
  const al = new AlmacenMemoria(), r = receptor();
  const sub = { endpoint: "https://push.example/abc", p256dh: r.p256dh, auth: r.authB64, dispositivo: "Móvil", desde: "2026-10-05" };
  let estado = 201; const vistos: { url: string; cab: Record<string, string>; cuerpo: Uint8Array }[] = [];
  const emisor = crearEmisorPush(al, () => new Date("2026-10-05T10:00:00Z"), async (url, cab, cuerpo) => { vistos.push({ url, cab, cuerpo }); return estado; });
  const aviso = { titulo: "📰 Noticias", cuerpo: "Tu resumen está listo", url: "/app/?ver=noticias" };
  assert.equal(await emisor(sub, aviso), "ok");
  assert.equal(vistos[0].url, sub.endpoint); assert.equal(vistos[0].cab["content-encoding"], "aes128gcm"); assert.match(vistos[0].cab.authorization, /^vapid t=.+, k=.+$/);
  assert.deepEqual(JSON.parse(descifrar(vistos[0].cuerpo, r.e, r.auth)), aviso);
  estado = 410; assert.equal(await emisor(sub, aviso), "caducada"); estado = 404; assert.equal(await emisor(sub, aviso), "caducada");
  estado = 500; assert.equal(await emisor(sub, aviso), "error");
  assert.equal(await crearEmisorPush(al, () => new Date(), async () => { throw new Error("red"); })(sub, aviso), "error");
  assert.equal(await emisor({ ...sub, p256dh: "mala" }, aviso), "error");
});

test("suscripcionValida y textoPlano", () => {
  const r = receptor();
  assert.ok(suscripcionValida({ endpoint: "https://x.example/p", p256dh: r.p256dh, auth: r.authB64 }));
  for (const mala of [null, {}, { endpoint: "http://x", p256dh: r.p256dh, auth: r.authB64 }, { endpoint: "https://x", p256dh: "abc", auth: r.authB64 }, { endpoint: "https://x", p256dh: r.p256dh, auth: "abc" }]) assert.equal(suscripcionValida(mala), false);
  assert.equal(textoPlano("🌤 <b>Tiempo</b> &amp; viento\n▬▬▬▬\n<i>Hoy</i> 24°"), "🌤 Tiempo & viento Hoy 24°");
  assert.equal(textoPlano("a".repeat(300), 20).length, 20);
});

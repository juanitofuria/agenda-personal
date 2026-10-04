import { test } from "node:test";
import assert from "node:assert/strict";
import { crearBanco } from "./arnes";
import { iguales, procesarWebhook } from "./webhook";

const SECRETO = "secreto-de-prueba-0123456789";
const msg = (id: number, texto: string) => ({ update_id: id, message: { chat: { id: 7, type: "private" }, from: { first_name: "Ana" }, text: texto } });
const llamar = (b: ReturnType<typeof crearBanco>, p: Partial<Parameters<typeof procesarWebhook>[2]> = {}, logs: string[] = []) =>
  procesarWebhook(b.deps, SECRETO, { metodo: "POST", cabeceraSecreta: SECRETO, cuerpo: msg(1, "/start"), ...p }, (m) => logs.push(m));

test("webhook: solo acepta POST con el secreto correcto", async () => {
  const b = crearBanco();
  assert.deepEqual(await llamar(b, { metodo: "GET" }), { estado: 405, texto: "method not allowed" });
  assert.equal((await llamar(b, { cabeceraSecreta: undefined })).estado, 403);
  assert.equal((await llamar(b, { cabeceraSecreta: "otro" })).estado, 403);
  assert.equal((await llamar(b, { cabeceraSecreta: SECRETO + "x" })).estado, 403);
  assert.equal((await llamar(b, { cabeceraSecreta: "" })).estado, 403);
  assert.equal(b.canal.mensajes.length, 0, "ninguna petición rechazada llega al bot");
  assert.equal(b.almacen.usuarios.size, 0);
});

test("webhook: una actualización válida llega al bot y se responde 200", async () => {
  const b = crearBanco();
  assert.deepEqual(await llamar(b), { estado: 200, texto: "ok" });
  assert.match(b.canal.ultimo("7").html, /Soy tu agenda personal/);
  assert.ok(await b.almacen.getUsuario("7"));
});

test("webhook: lo que no interesa (grupos, fotos, basura) se responde 200 sin hacer nada", async () => {
  const b = crearBanco();
  for (const cuerpo of [{ update_id: 1, message: { chat: { id: 1, type: "group" }, text: "x" } }, { update_id: 2, message: { chat: { id: 7, type: "private" }, photo: [] } }, null, "basura", {}, []]) {
    assert.equal((await llamar(b, { cuerpo })).estado, 200);
  }
  assert.equal(b.canal.mensajes.length, 0);
});

test("webhook: si el procesado falla responde 200 igualmente (Telegram no reintenta) y lo registra", async () => {
  const b = crearBanco(); const logs: string[] = [];
  b.almacen.getUsuario = async () => { throw new Error("Firestore caído"); };
  const r = await llamar(b, {}, logs);
  assert.equal(r.estado, 200); assert.match(logs[0], /Firestore caído/);
});

test("webhook: los botones y los bloqueos también pasan por el webhook", async () => {
  const b = crearBanco();
  await llamar(b, { cuerpo: msg(1, "/start") });
  await llamar(b, { cuerpo: { update_id: 2, callback_query: { id: "c", data: "o:omitir", from: { first_name: "Ana" }, message: { chat: { id: 7, type: "private" }, message_id: 5 } } } });
  assert.equal((await b.almacen.getUsuario("7"))!.onboardingHecho, true);
  await llamar(b, { cuerpo: { update_id: 3, my_chat_member: { chat: { id: 7, type: "private" }, new_chat_member: { status: "kicked" } } } });
  assert.equal((await b.almacen.getUsuario("7"))!.activo, false);
});

test("iguales: comparación segura", () => {
  assert.equal(iguales("abc", "abc"), true); assert.equal(iguales("abc", "abd"), false); assert.equal(iguales("abc", "ab"), false);
  assert.equal(iguales("", ""), false, "un secreto vacío nunca vale");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { ErrorHttp, HttpFetch } from "./http";

const respuesta = (cuerpo: string, estado = 200, tipo = "application/json") => new Response(cuerpo, { status: estado, headers: { "content-type": tipo } });

test("interpreta JSON y texto como axios y los errores traen response.status/data", async () => {
  const h = new HttpFetch(45, 5, async (u) => String(u).includes("rss") ? respuesta("<rss/>", 200, "text/xml") : String(u).includes("mal") ? respuesta('{"description":"Forbidden: bot was blocked"}', 403) : respuesta('{"a":1}'));
  assert.deepEqual((await h.get("https://x/json")).data, { a: 1 });
  assert.equal((await h.get("https://x/rss")).data, "<rss/>");
  await assert.rejects(h.post("https://x/mal", {}), (e: ErrorHttp) => e.response?.status === 403 && (e.response.data as any).description.includes("blocked"));
});

test("cuenta el presupuesto de peticiones y falla al agotarlo", async () => {
  const h = new HttpFetch(3, 5, async () => respuesta("{}"));
  for (let i = 0; i < 3; i++) await h.get("https://x");
  assert.equal(h.restantes, 0);
  await assert.rejects(h.get("https://x"), /presupuesto/);
});

test("nunca hay más de 5 peticiones a la vez", async () => {
  let activas = 0, maximo = 0;
  const h = new HttpFetch(45, 5, async () => { activas++; maximo = Math.max(maximo, activas); await new Promise((r) => setTimeout(r, 5)); activas--; return respuesta("{}"); });
  await Promise.all(Array.from({ length: 20 }, () => h.get("https://x")));
  assert.equal(maximo, 5);
});

test("un fallo de red se convierte en ErrorHttp sin response", async () => {
  const h = new HttpFetch(5, 5, async () => { throw new Error("boom"); });
  await assert.rejects(h.get("https://x"), (e: ErrorHttp) => e.message === "boom" && e.response === undefined);
});

test("maxBytes lee solo el principio de una respuesta enorme y cancela el resto", async () => {
  let cancelado = false, enviados = 0;
  const cuerpo = new ReadableStream<Uint8Array>({
    pull(c) { enviados++; c.enqueue(new TextEncoder().encode("<item>x</item>".repeat(500))); },
    cancel() { cancelado = true; },
  });
  const h = new HttpFetch(45, 5, async () => new Response(cuerpo, { status: 200, headers: { "content-type": "application/rss+xml" } }));
  const r = await h.get("https://x/feed", { maxBytes: 20_000 });
  const t = String(r.data);
  assert.ok(t.length >= 20_000 && t.length < 40_000, `leído ${t.length}`); // solo el principio
  assert.ok(cancelado && enviados < 20, "se dejó de descargar"); // y no se bajó todo
});

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

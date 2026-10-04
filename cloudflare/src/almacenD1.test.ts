import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AlmacenD1 } from "./almacenD1";
import { d1Sqlite } from "./d1sqlite";
import { usuarioNuevo } from "../../firebase/functions/src/modelo";
import { CanalFalso, HttpFalso, rssFalso } from "../../firebase/functions/src/arnes";
import { manejarEntrada } from "../../firebase/functions/src/bot/bot";
import { Deps } from "../../firebase/functions/src/bot/ctx";
import { idProgramacion } from "../../firebase/functions/src/almacen";
import { tick } from "../../firebase/functions/src/scheduler";
import { Env, manejarFetch, manejarHoroscopo, manejarTick } from "./app";

// El esquema se lee del fichero real (desde lib/cloudflare/src hasta cloudflare/).
const ESQUEMA = readFileSync(join(__dirname, "..", "..", "..", "schema.sql"), "utf8");
const nuevo = () => { const d1 = d1Sqlite(ESQUEMA); return { d1, almacen: new AlmacenD1(d1) }; };
const T0 = new Date("2026-10-04T08:00:00Z");

test("usuario: guardar, leer (con fechas) y borrar con todo lo suyo", async () => {
  const { almacen } = nuevo();
  const u = usuarioNuevo("42", "Ana", T0); u.nacimiento = "1990-05-17"; u.temas = [{ id: "t", titulo: "T", emoji: "⭐", consulta: "x", hora: "09:00", activa: true }];
  await almacen.guardarUsuario(u);
  const l = await almacen.getUsuario("42");
  assert.deepEqual(l, u);
  assert.ok(l!.creadoEn instanceof Date);
  await almacen.guardarUsuario({ ...u, nombre: "Bea" }); // upsert
  assert.equal((await almacen.getUsuario("42"))!.nombre, "Bea");
  const e = await almacen.guardarEvento({ uid: "42", tipo: "tarea", titulo: "x", lugar: "", fechaHora: null, antelacionMin: 0, repeticion: "ninguna", avisado: false, hecho: false, creadoEn: T0 });
  await almacen.guardarProgramacion({ id: idProgramacion("42", "evento", e.id), uid: "42", tipo: "evento", ref: e.id, proximo: T0 });
  await almacen.borrarUsuario("42");
  assert.equal(await almacen.getUsuario("42"), null);
  assert.deepEqual(await almacen.listarEventos("42"), []);
  assert.deepEqual(await almacen.programacionesVencidas(new Date("2030-01-01"), 10), []);
  assert.equal(await almacen.getUsuario("nadie"), null);
});

test("eventos: id corto asignado, fechas conservadas, actualizar y borrar", async () => {
  const { almacen } = nuevo();
  const f = new Date("2026-10-05T09:30:00Z");
  const e = await almacen.guardarEvento({ uid: "1", tipo: "cita", titulo: "Médico", lugar: "Centro", fechaHora: f, antelacionMin: 60, repeticion: "semanal", avisado: false, hecho: false, creadoEn: T0 });
  assert.match(e.id, /^[0-9a-f]{12}$/);
  const l = await almacen.getEvento("1", e.id);
  assert.equal(l!.fechaHora!.getTime(), f.getTime()); assert.equal(l!.repeticion, "semanal"); assert.equal(l!.uid, "1");
  await almacen.guardarEvento({ ...l!, hecho: true });
  assert.equal((await almacen.listarEventos("1")).length, 1);
  assert.equal((await almacen.getEvento("1", e.id))!.hecho, true);
  assert.equal(await almacen.getEvento("2", e.id), null); // otro usuario no lo ve
  await almacen.borrarEvento("1", e.id);
  assert.deepEqual(await almacen.listarEventos("1"), []);
});

test("programaciones: vencidas ordenadas y con límite, reclamar es atómico, borrar por usuario y tipo", async () => {
  const { almacen } = nuevo();
  const p = (ref: string, min: number, tipo: "seccion" | "evento" = "seccion", uid = "1") =>
    ({ id: idProgramacion(uid, tipo, ref), uid, tipo, ref, proximo: new Date(T0.getTime() + min * 60_000) });
  await almacen.guardarProgramacion({ ...p("c", 3), intentos: 2, posponer: true });
  await almacen.guardarProgramacion(p("a", 1)); await almacen.guardarProgramacion(p("b", 2)); await almacen.guardarProgramacion(p("ev", 1, "evento")); await almacen.guardarProgramacion(p("z", 99));
  const v = await almacen.programacionesVencidas(new Date(T0.getTime() + 5 * 60_000), 10);
  assert.deepEqual(v.map((x) => x.ref).sort(), ["a", "b", "c", "ev"]);
  assert.equal(v.find((x) => x.ref === "c")!.intentos, 2); assert.equal(v.find((x) => x.ref === "c")!.posponer, true);
  assert.equal((await almacen.programacionesVencidas(new Date(T0.getTime() + 5 * 60_000), 2)).length, 2);

  const a = v.find((x) => x.ref === "a")!;
  const nueva = new Date(T0.getTime() + 86_400_000);
  const [r1, r2] = await Promise.all([almacen.reclamarProgramacion(a.id, a.proximo, nueva), almacen.reclamarProgramacion(a.id, a.proximo, nueva)]);
  assert.deepEqual([r1, r2].sort(), [false, true]); // solo uno gana
  assert.equal(await almacen.reclamarProgramacion("no-existe", T0, nueva), false);

  await almacen.borrarProgramacionesDe("1", "evento");
  assert.ok(!(await almacen.programacionesVencidas(new Date(T0.getTime() + 5 * 60_000), 10)).some((x) => x.ref === "ev"));
  await almacen.borrarProgramacionesDe("1");
  assert.deepEqual(await almacen.programacionesVencidas(new Date("2030-01-01"), 10), []);
});

test("caché con caducidad, limpieza y horóscopo", async () => {
  const { almacen } = nuevo();
  await almacen.cacheSet("k/1?x=á", "v", 60_000, T0);
  assert.equal(await almacen.cacheGet("k/1?x=á", new Date(T0.getTime() + 30_000)), "v");
  assert.equal(await almacen.cacheGet("k/1?x=á", new Date(T0.getTime() + 61_000)), null);
  await almacen.cacheSet("k/1?x=á", "v2", 60_000, T0); // reemplaza
  assert.equal(await almacen.cacheGet("k/1?x=á", T0), "v2");
  await almacen.limpiarCache(new Date(T0.getTime() + 120_000));
  assert.equal(await almacen.cacheGet("k/1?x=á", T0), null);
  const doc = { signo: "aries", fecha: "2026-10-04", prediccion: "Hoy…", idioma: "es", fuente: "20minutos.es", fuenteUrl: "https://www.20minutos.es/horoscopo/aries/" };
  await almacen.guardarHoroscopo("aries", doc);
  assert.deepEqual(await almacen.getHoroscopo("aries"), doc);
  assert.equal(await almacen.getHoroscopo("leo"), null);
});

test("el bot y el planificador funcionan de principio a fin con D1 (como en Firebase)", async () => {
  const { almacen } = nuevo();
  const canal = new CanalFalso(), http = new HttpFalso();
  let ahora = new Date("2026-10-04T04:00:00Z");
  const deps: Deps = { almacen, canal, http, ahora: () => ahora };
  http.añadir("news.google.com", rssFalso("Noticia", 5));
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 1, texto: "/start" });
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 2, callback: { id: "c", datos: "o:omitir", mensajeId: 5 } });
  assert.deepEqual(canal.violaciones, []);
  const u = await almacen.getUsuario("42");
  assert.ok(u && u.onboardingHecho);
  const vencidas = await almacen.programacionesVencidas(new Date("2026-10-05T00:00:00Z"), 50);
  assert.ok(vencidas.length >= 2, "se programaron las secciones por defecto");
  canal.limpiar();
  ahora = new Date("2026-10-04T05:11:00Z"); // 07:11 Madrid: vence noticias (07:10)
  const r = await tick({ almacen, canal, http, ahora: () => ahora });
  assert.ok(r.enviados >= 1 && r.fallidos === 0, JSON.stringify(r));
  assert.ok(canal.textos("42").some((t) => t.includes("Noticia")));
  assert.deepEqual(await tick({ almacen, canal, http, ahora: () => ahora }), { enviados: 0, omitidos: 0, fallidos: 0 }); // no se repite
  // alarma: crear por el menú y que avise
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 3, callback: { id: "c", datos: "n:tipo:alarma", mensajeId: 5 } });
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 4, texto: "Tomar pastilla" });
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 5, texto: "hoy 09:00" });
  await manejarEntrada(deps, { chatId: "42", nombre: "Ana", updateId: 6, callback: { id: "c", datos: "n:rep:ninguna", mensajeId: 5 } });
  assert.deepEqual(canal.violaciones, []);
  canal.limpiar();
  ahora = new Date("2026-10-04T07:01:00Z"); // 09:01 Madrid
  await tick({ almacen, canal, http, ahora: () => ahora });
  assert.ok(canal.textos("42").some((t) => t.includes("Tomar pastilla")));
});

test("worker: rutas y secreto del webhook", async () => {
  const { d1 } = nuevo();
  const env: Env = { DB: d1, TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_WEBHOOK_SECRET: "secreto-largo-1234567890" };
  const post = (cab?: Record<string, string>, cuerpo: unknown = { update_id: 1 }) =>
    manejarFetch(new Request("https://x.workers.dev/telegram", { method: "POST", headers: cab, body: JSON.stringify(cuerpo) }), env);
  assert.equal((await post()).status, 403);
  assert.equal((await post({ "x-telegram-bot-api-secret-token": "otro" })).status, 403);
  assert.equal((await post({ "x-telegram-bot-api-secret-token": env.TELEGRAM_WEBHOOK_SECRET })).status, 200);
  assert.equal((await manejarFetch(new Request("https://x.workers.dev/telegram"), env)).status, 405);
  assert.equal((await manejarFetch(new Request("https://x.workers.dev/otra"), env)).status, 404);
  assert.equal((await manejarFetch(new Request("https://x.workers.dev/"), env)).status, 200);
  // sin nada vencido, el tick no hace nada y no llama a Internet
  assert.deepEqual(await manejarTick(env), { enviados: 0, omitidos: 0, fallidos: 0 });
});

test("dist/worker.js existe, está empaquetado (sin imports sueltos de librerías) y exporta los handlers", () => {
  const f = join(__dirname, "..", "..", "..", "dist", "worker.js");
  const js = readFileSync(f, "utf8");
  assert.match(js, /export\s*\{[^}]*as default/); // handlers fetch y scheduled
  assert.doesNotMatch(js, /from\s+["']fast-xml-parser["']/); // la librería va dentro
  assert.match(js, /\/telegram/); assert.match(js, /\*\/10 4-10 \* \* \*/); // ruta del webhook y cron del horóscopo
});

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
import { Env, Fabrica, manejarFetch, manejarHoroscopo, manejarTick } from "./app";

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
  assert.doesNotMatch(js, /from\s+["'](?!node:)[^"']+["']/); // no importa nada de fuera (solo módulos node:): todo va dentro
  assert.match(js, /\/telegram/); assert.match(js, /\*\/10 4-10 \* \* \*/); // ruta del webhook y cron del horóscopo
});

// ---------- Reparto del trabajo en ejecuciones propias (SELF) ----------
const SECRETO = "secreto-largo-1234567890";
function entorno() {
  const { d1 } = nuevo();
  const canal = new CanalFalso(), http = new HttpFalso();
  http.añadir("news.google.com", rssFalso("Noticia", 5));
  const fabrica: Fabrica = () => ({ canal, http });
  const llamadas: { ruta: string; cuerpo: any }[] = [];
  const env: Env = {
    DB: d1, TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_WEBHOOK_SECRET: SECRETO,
    SELF: { fetch: async (req: Request) => { llamadas.push({ ruta: new URL(req.url).pathname, cuerpo: await req.clone().json() }); return manejarFetch(req, env, undefined, fabrica); } },
  };
  const pendientes: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => { pendientes.push(p); } };
  let upd = 0;
  const enviar = (u: any) => manejarFetch(new Request("https://x.workers.dev/telegram", { method: "POST", headers: { "x-telegram-bot-api-secret-token": SECRETO }, body: JSON.stringify({ update_id: ++upd, ...u }) }), env, ctx, fabrica);
  const escribir = (texto: string) => enviar({ message: { chat: { id: 42, type: "private" }, from: { first_name: "Ana" }, text: texto } });
  const pulsar = (data: string) => enviar({ callback_query: { id: "cb", data, from: { first_name: "Ana" }, message: { message_id: 9, chat: { id: 42, type: "private" } } } });
  const esperar = async () => { while (pendientes.length) await pendientes.shift(); };
  return { env, canal, http, fabrica, llamadas, escribir, pulsar, esperar, ctx };
}

test("el webhook responde 200 al instante y «Todo lo activado» construye cada sección en una ejecución propia y las envía en orden", async () => {
  const e = entorno();
  const r0 = await e.escribir("/start"); assert.equal(r0.status, 200); await e.esperar();
  await e.pulsar("o:omitir"); await e.esperar(); // por defecto: noticias, agenda y mercados
  e.canal.limpiar(); e.llamadas.length = 0;
  const r = await e.pulsar("sec:todo");
  assert.equal(r.status, 200); assert.equal(await r.text(), "ok"); // respuesta inmediata; el resto sigue en segundo plano
  await e.esperar();
  assert.deepEqual(e.llamadas.map((l) => `${l.ruta}:${l.cuerpo.ref}`).sort(), ["/interno/seccion:agenda", "/interno/seccion:mercados", "/interno/seccion:noticias"]);
  const t = e.canal.textos("42");
  assert.match(t[0], /Tu resumen de hoy/); assert.match(t[1], /Noticias del día/); assert.match(t[2], /Tu agenda/); assert.match(t[3], /No he podido obtener/); // mercados: Yahoo no definido en el test
  assert.equal(e.canal.violaciones.length, 0);
});

test("una sección suelta y la navegación dentro de ella (editar el mensaje) también se construyen en su propia ejecución", async () => {
  const e = entorno();
  await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
  e.canal.limpiar(); e.llamadas.length = 0;
  await e.pulsar("sec:agenda"); await e.esperar();
  await e.pulsar("sev:agenda"); await e.esperar();
  assert.equal(e.llamadas.length, 2);
  assert.equal(e.canal.mensajes[0].editado, undefined); assert.equal(e.canal.mensajes[1].editado, 9);
});

test("si la ejecución interna falla o se cuelga, la sección avisa con el motivo y el resto sigue", async () => {
  const e = entorno();
  await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
  const buena = e.env.SELF!;
  e.env.SELF = { fetch: async (req: Request) => { const c = await req.clone().json() as any; if (c.ref === "agenda") throw new Error("sin conexión interna"); return buena.fetch(req); } };
  e.canal.limpiar();
  await e.pulsar("sec:todo"); await e.esperar();
  const t = e.canal.textos("42");
  assert.match(t[1], /Noticias del día/); assert.match(t[2], /No he podido obtener[\s\S]*no se pudo contactar/);
  assert.ok(e.canal.mensajes[2].teclado!.flat().some((x) => x.datos === "sec:agenda"));
});

test("el horóscopo se trae al momento con la URL configurada del Worker", async () => {
  const e = entorno();
  await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
  await e.escribir("/perfil"); await e.esperar();
  const almacen = new AlmacenD1(e.env.DB); const u = (await almacen.getUsuario("42"))!; u.nacimiento = "1990-04-05"; await almacen.guardarUsuario(u);
  e.http.añadir("horoscopefree.fly.dev", { sign: "aries", date: "2026-10-05", language: "es", text: "Hoy toca empezar algo.", source: "https://www.20minutos.es/horoscopo/aries/" });
  e.canal.limpiar();
  await e.pulsar("sec:horoscopo"); await e.esperar();
  assert.match(e.canal.textos("42").join("\n"), /Hoy toca empezar algo/);
  assert.ok((await almacen.getHoroscopo("aries"))?.prediccion.includes("empezar"));
});

test("las rutas internas exigen el secreto: sin él (o por GET) no hacen nada", async () => {
  const e = entorno();
  const llamar = (ruta: string, cab: Record<string, string>, metodo = "POST") => manejarFetch(new Request(`https://x.workers.dev${ruta}`, { method: metodo, headers: cab, body: metodo === "POST" ? JSON.stringify({ uid: "42", ref: "agenda" }) : undefined }), e.env, undefined, e.fabrica);
  assert.equal((await llamar("/interno/seccion", {})).status, 403);
  assert.equal((await llamar("/interno/seccion", { "x-interno": "otro" })).status, 403);
  assert.equal((await llamar("/interno/programacion", { "x-interno": "otro" })).status, 403);
  assert.equal((await llamar("/interno/seccion", { "x-interno": SECRETO }, "GET")).status, 403);
  assert.equal((await llamar("/interno/otra", { "x-interno": SECRETO })).status, 404);
  assert.equal(e.canal.mensajes.length, 0);
  // un usuario que no existe se ignora sin error
  assert.equal((await llamar("/interno/seccion", { "x-interno": SECRETO })).status, 200); assert.equal(e.canal.mensajes.length, 0);
});

test("el cron reparte cada programación vencida en su propia ejecución y se rearman; sin SELF las procesa una a una", async () => {
  for (const conSelf of [true, false]) {
    const e = entorno();
    if (!conSelf) delete e.env.SELF;
    await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
    e.canal.limpiar(); e.llamadas.length = 0;
    const almacen = new AlmacenD1(e.env.DB);
    const primera = (await almacen.programacionesVencidas(new Date(8.64e15), 1))[0];
    const ahora = new Date(primera.proximo.getTime() + 60_000); // un minuto después de que toque la primera
    const r = await manejarTick(e.env, () => ahora, e.fabrica);
    assert.equal(r.enviados >= 1 && r.fallidos === 0, true, `${conSelf}: ${JSON.stringify(r)}`);
    assert.equal(e.llamadas.filter((l) => l.ruta === "/interno/programacion").length > 0, conSelf);
    assert.ok(e.canal.mensajes.length >= 1, "se envió el resumen");
    const quedan = await almacen.programacionesVencidas(ahora, 50);
    assert.equal(quedan.length, 0, `${conSelf}: quedan ${JSON.stringify(quedan)} (ahora ${ahora.toISOString()}; r=${JSON.stringify(r)})`);
    assert.deepEqual(await manejarTick(e.env, () => ahora, e.fabrica), { enviados: 0, omitidos: 0, fallidos: 0 }); // y no se repite
  }
});

test("si falla la llamada interna, el cron lo cuenta y la programación sigue vencida para el minuto siguiente", async () => {
  const e = entorno();
  await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
  e.env.SELF = { fetch: async () => { throw new Error("sin conexión interna"); } };
  const manana = new Date(Date.now() + 36 * 3_600_000);
  const r = await manejarTick(e.env, () => manana, e.fabrica);
  assert.ok(r.fallidos >= 1 && r.enviados === 0);
  assert.ok((await new AlmacenD1(e.env.DB).programacionesVencidas(manana, 50)).length >= 1);
});

// ---------- Control de acceso en D1 ----------
test("acceso en D1: accesos, invitaciones (un uso, caducidad, personales y atómicas) y solicitudes", async () => {
  const { almacen } = nuevo();
  const ahora = new Date("2026-10-05T10:00:00Z");
  await almacen.guardarAcceso({ id: "1", rol: "admin", nombre: "Juan", desde: ahora });
  await almacen.guardarAcceso({ id: "2", rol: "usuario", nombre: "Ana", desde: new Date(ahora.getTime() + 1000) });
  await almacen.guardarAcceso({ id: "2", rol: "usuario", nombre: "Ana B", desde: ahora }); // actualizar no cambia «desde» ni duplica
  assert.deepEqual((await almacen.listarAccesos()).map((a) => `${a.id}:${a.rol}:${a.nombre}`), ["1:admin:Juan", "2:usuario:Ana B"]);
  assert.equal((await almacen.getAcceso("2"))!.desde.getTime(), ahora.getTime() + 1000);
  await almacen.borrarAcceso("2"); assert.equal(await almacen.getAcceso("2"), null);

  const caduca = new Date(ahora.getTime() + 7 * 86_400_000);
  await almacen.guardarInvitacion({ codigo: "GENERICA", caduca, creadaPor: "1" });
  await almacen.guardarInvitacion({ codigo: "PERSONAL", caduca, creadaPor: "1", para: "7" });
  await almacen.guardarInvitacion({ codigo: "VIEJA", caduca: new Date(ahora.getTime() - 1), creadaPor: "1" });
  assert.equal(await almacen.consumirInvitacion("VIEJA", "9", ahora), null); // caducada
  assert.equal(await almacen.consumirInvitacion("NO-EXISTE", "9", ahora), null);
  assert.equal(await almacen.consumirInvitacion("PERSONAL", "9", ahora), null); // es de otra persona
  assert.equal((await almacen.consumirInvitacion("PERSONAL", "7", ahora))!.para, "7"); assert.equal(await almacen.consumirInvitacion("PERSONAL", "7", ahora), null); // y una sola vez
  const [a, b] = await Promise.all([almacen.consumirInvitacion("GENERICA", "10", ahora), almacen.consumirInvitacion("GENERICA", "11", ahora)]);
  assert.equal([a, b].filter(Boolean).length, 1, "dos personas a la vez: solo una entra"); // atómico
  await almacen.guardarInvitacion({ codigo: "P2", caduca, creadaPor: "1", para: "8" }); await almacen.borrarInvitacionesPara("8"); assert.equal(await almacen.consumirInvitacion("P2", "8", ahora), null);

  await almacen.guardarSolicitud({ id: "5", nombre: "Eva", usuario: "eva_g", fecha: new Date(ahora.getTime() + 10), estado: "pendiente" });
  await almacen.guardarSolicitud({ id: "4", nombre: "Leo", fecha: ahora, estado: "rechazada" });
  assert.deepEqual((await almacen.listarSolicitudes()).map((s) => s.id), ["4", "5"]); // por fecha
  assert.deepEqual((await almacen.listarSolicitudes("pendiente")).map((s) => `${s.id}:${s.usuario}`), ["5:eva_g"]);
  assert.equal((await almacen.getSolicitud("4"))!.usuario, undefined);
  await almacen.guardarSolicitud({ ...(await almacen.getSolicitud("5"))!, estado: "rechazada" }); assert.equal((await almacen.getSolicitud("5"))!.estado, "rechazada");
  await almacen.borrarSolicitud("4"); assert.equal(await almacen.getSolicitud("4"), null);
});

test("con ADMIN_CHAT_ID el Worker es privado: solo entran el administrador y quien tenga invitación; sin él, abierto", async () => {
  for (const privado of [true, false]) {
    const e = entorno();
    if (privado) e.env.ADMIN_CHAT_ID = "42"; // el usuario 42 de estos tests es el administrador
    const enviar = (chat: number, texto: string) => manejarFetch(new Request("https://x.workers.dev/telegram", { method: "POST", headers: { "x-telegram-bot-api-secret-token": SECRETO }, body: JSON.stringify({ update_id: Math.floor(Math.random() * 1e9), message: { chat: { id: chat, type: "private" }, from: { first_name: `U${chat}` }, text: texto } }) }), e.env, e.ctx, e.fabrica);
    await enviar(99, "/start"); await e.esperar();
    const almacen = new AlmacenD1(e.env.DB);
    assert.equal(!!(await almacen.getUsuario("99")), !privado); // abierto: se registra; privado: nada
    assert.match(e.canal.textos("99").join("\n"), privado ? /Bot privado/ : /Soy tu agenda personal/);
    await enviar(42, "/start"); await e.esperar();
    assert.ok(await almacen.getUsuario("42")); assert.equal((await almacen.getAcceso("42"))?.rol, privado ? "admin" : undefined);
  }
});

test("las cuatro cabeceras del menú existen como imágenes PNG válidas y de un tamaño que Telegram admite", () => {
  for (const estilo of ["informal", "formal"]) for (const modo of ["claro", "oscuro"]) {
    const f = readFileSync(join(__dirname, "..", "..", "..", "publico", `menu-${estilo}-${modo}.png`));
    assert.deepEqual([...f.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${estilo}-${modo}: firma PNG`);
    const ancho = f.readUInt32BE(16), alto = f.readUInt32BE(20);
    assert.ok(ancho >= 800 && alto >= 200 && ancho / alto <= 20 && ancho + alto <= 10_000, `${estilo}-${modo}: ${ancho}x${alto}`);
    assert.ok(f.length > 20_000 && f.length < 5_000_000, `${estilo}-${modo}: ${f.length} bytes (Telegram admite hasta 5 MB por URL)`);
  }
});

test("el webhook usa su propia dirección para la cabecera del menú, según el estilo y modo del usuario", async () => {
  const e = entorno();
  const almacen = new AlmacenD1(e.env.DB);
  await e.escribir("/start"); await e.esperar(); await e.pulsar("o:omitir"); await e.esperar();
  const u = (await almacen.getUsuario("42"))!; await almacen.guardarUsuario({ ...u, estilo: "formal", modo: "oscuro" });
  assert.deepEqual([(await almacen.getUsuario("42"))!.estilo, (await almacen.getUsuario("42"))!.modo], ["formal", "oscuro"]); // se guardan en D1
  e.canal.limpiar();
  await e.escribir("/menu"); await e.esperar();
  const foto = e.canal.mensajes.find((m) => m.foto)!;
  assert.equal(foto.foto, "https://x.workers.dev/menu-formal-oscuro.png"); // el origen de la petición
  assert.match(foto.html, /AGENDA PERSONAL/);
});

test("worker: la API de la mini app exige datos firmados por Telegram y respeta el acceso privado", async () => {
  const { createHmac } = await import("node:crypto");
  const { d1, almacen } = nuevo();
  const env: Env = { DB: d1, TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_WEBHOOK_SECRET: "secreto-largo-1234567890" };
  const firmar = (id: number, token = env.TELEGRAM_BOT_TOKEN) => {
    const p = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id, first_name: "Ana" }) });
    const texto = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
    p.set("hash", createHmac("sha256", createHmac("sha256", "WebAppData").update(token).digest()).update(texto).digest("hex"));
    return p.toString();
  };
  const api = (ruta: string, auth?: string, e: Env = env) =>
    manejarFetch(new Request(`https://x.workers.dev${ruta}`, { method: "POST", headers: auth ? { authorization: `tma ${auth}` } : {}, body: "{}" }), e);
  assert.equal((await api("/api/estado")).status, 401);
  assert.equal((await api("/api/estado", firmar(7, "otro:token"))).status, 401); // firmado con otro token
  assert.equal((await api("/api/estado", firmar(7))).status, 404); // firma válida pero aún no ha usado el bot
  assert.equal((await manejarFetch(new Request("https://x.workers.dev/api/estado"), env)).status, 405);
  await almacen.guardarUsuario(usuarioNuevo("7", "Ana", T0));
  const r = await api("/api/estado", firmar(7)); assert.equal(r.status, 200);
  assert.equal(((await r.json()) as any).usuario.nombre, "Ana");
  const privado: Env = { ...env, ADMIN_CHAT_ID: "1" }; // bot privado: el usuario 7 no está autorizado
  assert.equal((await api("/api/estado", firmar(7), privado)).status, 403);
  await almacen.guardarAcceso({ id: "7", rol: "usuario", nombre: "Ana", desde: T0 });
  assert.equal((await api("/api/estado", firmar(7), privado)).status, 200);
});

test("worker: la lista compartida se abre con su enlace sin firma de Telegram (y solo con el código correcto)", async () => {
  const { d1, almacen } = nuevo();
  const env: Env = { DB: d1, TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_WEBHOOK_SECRET: "secreto-largo-1234567890" };
  const u = usuarioNuevo("7", "Ana", T0); u.compra.items = [{ id: "a1", texto: "Leche", hecho: false }]; u.compra.token = "abcdefghijkmnpqrst";
  await almacen.guardarUsuario(u);
  await almacen.cacheSet("lista:abcdefghijkmnpqrst", "7", 3600_000, new Date());
  const lista = (cuerpo: unknown, metodo = "POST") => manejarFetch(new Request("https://x.workers.dev/api/lista", { method: metodo, body: metodo === "POST" ? JSON.stringify(cuerpo) : undefined }), env);
  const r = await lista({ token: "abcdefghijkmnpqrst", accion: "estado" }); assert.equal(r.status, 200);
  assert.deepEqual(((await r.json()) as any).items.map((x: any) => x.texto), ["Leche"]);
  assert.equal((await lista({ token: "abcdefghijkmnpqrst", accion: "marcar", id: "a1" })).status, 200);
  assert.equal((await almacen.getUsuario("7"))!.compra.items[0].hecho, true);
  assert.equal((await lista({ token: "zzzzzzzzzzzzzzzzzz", accion: "estado" })).status, 404);
  assert.equal((await lista({}, "GET")).status, 405);
});

test("la frase del día: 365 frases distintas, cada una con texto y autor", () => {
  const js = readFileSync(join(__dirname, "..", "..", "..", "publico", "app", "frases.js"), "utf8");
  const frases = new Function(`${js}; return FRASES;`)() as [string, string][];
  assert.equal(frases.length, 365);
  assert.equal(new Set(frases.map((f) => f[0])).size, 365); // sin repetidas
  for (const [texto, autor] of frases) { assert.ok(texto.length >= 8 && texto.length <= 200, texto); assert.ok(autor.length >= 3 && autor.length <= 60, autor); }
  const dia = (y: number, m: number, d: number) => Math.floor((Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 864e5); // igual que la app
  assert.equal(dia(2026, 0, 1), 1); assert.equal(dia(2026, 11, 31), 365); assert.equal(dia(2028, 11, 31), 366); // año bisiesto: el último día repite la primera
  assert.equal(frases[(366 - 1) % 365][0], frases[0][0]);
});

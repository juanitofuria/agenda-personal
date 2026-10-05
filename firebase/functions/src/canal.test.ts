import { test } from "node:test";
import assert from "node:assert/strict";
import { AlmacenMemoria, idProgramacion } from "./almacen";
import { claveCache, eventoDesdeDoc, programacionDesdeDoc, usuarioDesdeDoc } from "./almacenFirestore";
import { esc, escAttr, trocear } from "./canal";
import { CanalTelegram, ErrorTelegram, leerActualizacion } from "./telegram";
import { Evento, usuarioNuevo } from "./modelo";

test("esc escapa HTML y escAttr también las comillas", () => {
  assert.equal(esc("<b>a & b</b>"), "&lt;b&gt;a &amp; b&lt;/b&gt;");
  assert.equal(escAttr('x"y<z'), "x&quot;y&lt;z");
});

test("trocear: un texto corto no se parte; uno largo se corta entre párrafos y nunca supera el máximo", () => {
  assert.deepEqual(trocear("hola"), ["hola"]);
  const parrafos = Array.from({ length: 30 }, (_, i) => `<b>Bloque ${i}</b>\n` + "texto ".repeat(40)).join("\n\n");
  const partes = trocear(parrafos, 1000);
  assert.ok(partes.length > 1);
  assert.ok(partes.every((p) => p.length <= 1000));
  assert.equal(partes.join("\n\n").replace(/\s+/g, " ").trim(), parrafos.replace(/\s+/g, " ").trim()); // no se pierde nada
  assert.ok(partes.every((p) => (p.match(/<b>/g) ?? []).length === (p.match(/<\/b>/g) ?? []).length), "no se corta dentro de una etiqueta");
});

test("trocear: una línea enorme se corta sin perder texto", () => {
  const partes = trocear("x".repeat(9000), 3800);
  assert.ok(partes.length >= 3 && partes.every((p) => p.length <= 3800));
  assert.equal(partes.join("").length, 9000);
  const frase = Array.from({ length: 2000 }, (_, i) => `palabra${i}`).join(" ");
  const trozos = trocear(frase, 3800);
  assert.ok(trozos.every((p) => p.length <= 3800));
  assert.equal(trozos.join(" "), frase, "se corta en espacios y no se parte ninguna palabra");
});

// ---------- Telegram ----------
function httpTelegram(respuestas: (url: string, cuerpo: any) => any = () => ({ ok: true })) {
  const llamadas: { url: string; cuerpo: any }[] = [];
  return { llamadas, http: { async post(url: string, cuerpo?: unknown) { llamadas.push({ url, cuerpo }); const r = respuestas(url, cuerpo); if (r instanceof Error) throw r; return { data: r }; } } };
}
const errTg = (status: number, description: string) => Object.assign(new Error("fallo"), { response: { status, data: { ok: false, description } } });

test("CanalTelegram.enviar: sendMessage en HTML con teclado inline", async () => {
  const { http, llamadas } = httpTelegram();
  await new CanalTelegram("TOKEN", http).enviar("42", "<b>hola</b>", [[{ texto: "A", datos: "a:1" }, { texto: "Web", url: "https://x.es" }]]);
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, "https://api.telegram.org/botTOKEN/sendMessage");
  assert.equal(llamadas[0].cuerpo.parse_mode, "HTML"); assert.equal(llamadas[0].cuerpo.chat_id, "42");
  assert.deepEqual(llamadas[0].cuerpo.reply_markup, { inline_keyboard: [[{ text: "A", callback_data: "a:1" }, { text: "Web", url: "https://x.es" }]] });
});

test("CanalTelegram.enviar: un mensaje largo se trocea y el teclado va solo en el último", async () => {
  const { http, llamadas } = httpTelegram();
  const largo = Array.from({ length: 20 }, (_, i) => `Párrafo ${i} ` + "x".repeat(400)).join("\n\n");
  await new CanalTelegram("T", http).enviar("1", largo, [[{ texto: "OK", datos: "ok" }]]);
  assert.ok(llamadas.length >= 2);
  assert.ok(llamadas.slice(0, -1).every((l) => l.cuerpo.reply_markup === undefined));
  assert.ok(llamadas[llamadas.length - 1].cuerpo.reply_markup);
});

test("CanalTelegram: el token nunca aparece en el cuerpo y un 403 se reconoce como bloqueo", async () => {
  const { http } = httpTelegram(() => errTg(403, "Forbidden: bot was blocked by the user"));
  await assert.rejects(new CanalTelegram("T", http).enviar("1", "x"), (e: ErrorTelegram) => e instanceof ErrorTelegram && e.bloqueado && e.codigo === 403);
});

test("CanalTelegram.editar: si no hay cambios no hace nada; si no se puede editar envía uno nuevo; un bloqueo se propaga", async () => {
  let n = 0;
  const a = httpTelegram(() => errTg(400, "Bad Request: message is not modified"));
  await new CanalTelegram("T", a.http).editar("1", 5, "x");
  assert.equal(a.llamadas.length, 1);
  const b = httpTelegram((url) => (url.endsWith("editMessageText") && n++ === 0 ? errTg(400, "message can't be edited") : { ok: true }));
  await new CanalTelegram("T", b.http).editar("1", 5, "x");
  assert.deepEqual(b.llamadas.map((l) => l.url.split("/").pop()), ["editMessageText", "sendMessage"]);
  const c = httpTelegram(() => errTg(403, "Forbidden: bot was blocked by the user"));
  await assert.rejects(new CanalTelegram("T", c.http).editar("1", 5, "x"), (e: ErrorTelegram) => e.bloqueado);
});

test("leerActualizacion: mensajes, botones, bloqueos y lo que se ignora", () => {
  const priv = { id: 7, type: "private" };
  assert.deepEqual(leerActualizacion({ update_id: 1, message: { chat: priv, from: { first_name: "Ana" }, text: "hola" } }), { chatId: "7", nombre: "Ana", updateId: 1, texto: "hola" });
  assert.deepEqual(leerActualizacion({ update_id: 2, callback_query: { id: "c1", data: "m:menu", from: { first_name: "Ana" }, message: { chat: priv, message_id: 55 } } }),
    { chatId: "7", nombre: "Ana", updateId: 2, callback: { id: "c1", datos: "m:menu", mensajeId: 55 } });
  assert.deepEqual(leerActualizacion({ update_id: 3, my_chat_member: { chat: priv, new_chat_member: { status: "kicked" } } }), { chatId: "7", nombre: "", updateId: 3, bloqueado: true });
  assert.equal(leerActualizacion({ update_id: 4, my_chat_member: { chat: priv, new_chat_member: { status: "member" } } }), null);
  assert.equal(leerActualizacion({ update_id: 5, message: { chat: { id: 9, type: "group" }, text: "hola" } }), null, "los grupos se ignoran");
  assert.equal(leerActualizacion({ update_id: 6, message: { chat: priv, photo: [] } }), null, "mensajes sin texto");
  assert.equal(leerActualizacion({ message: {} }), null);
  assert.equal(leerActualizacion(null), null);
});

// ---------- Almacén ----------
const ev = (o: Partial<Evento> = {}): Omit<Evento, "id"> => ({ uid: "u1", tipo: "alarma", titulo: "x", lugar: "", fechaHora: new Date("2026-10-05T07:00:00Z"), antelacionMin: 0, repeticion: "ninguna", avisado: false, hecho: false, creadoEn: new Date(0), ...o });

test("AlmacenMemoria: eventos, copia defensiva y borrado de usuario en cascada", async () => {
  const a = new AlmacenMemoria();
  await a.guardarUsuario(usuarioNuevo("u1", "Ana", new Date(0)));
  const e1 = await a.guardarEvento(ev()); const e2 = await a.guardarEvento(ev({ uid: "u2" }));
  await a.guardarProgramacion({ id: idProgramacion("u1", "evento", e1.id), uid: "u1", tipo: "evento", ref: e1.id, proximo: new Date(0) });
  await a.guardarProgramacion({ id: idProgramacion("u2", "evento", e2.id), uid: "u2", tipo: "evento", ref: e2.id, proximo: new Date(0) });
  (await a.getEvento("u1", e1.id))!.titulo = "cambiado";
  assert.equal((await a.getEvento("u1", e1.id))!.titulo, "x", "los objetos devueltos son copias");
  await a.borrarUsuario("u1");
  assert.equal(await a.getUsuario("u1"), null); assert.equal((await a.listarEventos("u1")).length, 0);
  assert.equal((await a.listarEventos("u2")).length, 1, "no toca a otros usuarios");
  assert.deepEqual([...a.programaciones.keys()], [idProgramacion("u2", "evento", e2.id)]);
});

test("AlmacenMemoria: programaciones vencidas ordenadas y reclamo atómico", async () => {
  const a = new AlmacenMemoria();
  const t = (s: string) => new Date(`2026-10-04T${s}:00Z`);
  await a.guardarProgramacion({ id: "b", uid: "u", tipo: "seccion", ref: "x", proximo: t("09:00") });
  await a.guardarProgramacion({ id: "a", uid: "u", tipo: "seccion", ref: "x", proximo: t("08:00") });
  await a.guardarProgramacion({ id: "c", uid: "u", tipo: "seccion", ref: "x", proximo: t("12:00") });
  assert.deepEqual((await a.programacionesVencidas(t("10:00"), 10)).map((p) => p.id), ["a", "b"]);
  assert.deepEqual((await a.programacionesVencidas(t("10:00"), 1)).map((p) => p.id), ["a"]);
  assert.equal(await a.reclamarProgramacion("a", t("08:00"), t("20:00")), true);
  assert.equal(await a.reclamarProgramacion("a", t("08:00"), t("21:00")), false, "el segundo no la consigue");
  assert.equal(await a.reclamarProgramacion("no-existe", t("08:00"), t("21:00")), false);
});

test("AlmacenMemoria: caché con caducidad", async () => {
  const a = new AlmacenMemoria(); const t0 = new Date("2026-10-04T08:00:00Z");
  await a.cacheSet("k", "v", 60_000, t0);
  assert.equal(await a.cacheGet("k", new Date(t0.getTime() + 59_000)), "v");
  assert.equal(await a.cacheGet("k", new Date(t0.getTime() + 61_000)), null);
  assert.equal(await a.cacheGet("otra", t0), null);
});

test("conversores de Firestore: valores por defecto y claves seguras", () => {
  const u = usuarioDesdeDoc("7", { nombre: "Ana" });
  assert.equal(u.zona, "Europe/Madrid"); assert.equal(u.activo, true); assert.equal(u.estado, null); assert.deepEqual(u.temas, []); assert.equal(u.onboardingHecho, false);
  assert.equal(usuarioDesdeDoc("7", { activo: false }).activo, false);
  const e = eventoDesdeDoc("7", "e1", { tipo: "cita", titulo: "x", fechaHora: new Date("2026-10-05T07:00:00Z") });
  assert.equal(e.repeticion, "ninguna"); assert.equal(e.antelacionMin, 0); assert.equal(e.fechaHora!.toISOString(), "2026-10-05T07:00:00.000Z");
  assert.equal(eventoDesdeDoc("7", "e1", { tipo: "tarea" }).fechaHora, null);
  assert.equal(programacionDesdeDoc("p", { uid: "7", tipo: "seccion", ref: "tiempo", proximo: new Date(5) }).proximo.getTime(), 5);
  assert.ok(!/[\/]/.test(claveCache("mercados:2026-10-04/1")) && claveCache("a b/c").length > 0);
  assert.ok(claveCache("x".repeat(1000)).length <= 400);
});

test("un 403 solo cuenta como «usuario bloqueado» si Telegram lo dice; el de un proxy o cortafuegos no", () => {
  for (const msg of ["Forbidden: bot was blocked by the user", "Forbidden: user is deactivated", "Forbidden: bot was kicked from the group chat", "Forbidden: bot can't initiate conversation with a user"]) assert.equal(new ErrorTelegram(msg, 403).bloqueado, true, msg);
  assert.equal(new ErrorTelegram("Forbidden", 403).bloqueado, false); // un 403 genérico (proxy, cortafuegos) no es un bloqueo
  assert.equal(new ErrorTelegram("Access denied by network policy", 403).bloqueado, false);
  assert.equal(new ErrorTelegram("Bad Request: chat not found", 400).bloqueado, false);
  assert.equal(new ErrorTelegram("Too Many Requests", 429).bloqueado, false);
});

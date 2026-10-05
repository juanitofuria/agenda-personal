import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { crearBanco } from "./arnes";
import { manejarApi, validarInitData } from "./miniapp";
import { usuarioNuevo } from "./modelo";

const TOKEN = "123:ABC";
const AHORA = new Date("2026-10-05T10:00:00Z");

/** Datos de inicio firmados como lo hace Telegram. */
export function initDataFirmado(id: number, token = TOKEN, fecha = AHORA.getTime() / 1000, nombre = "Ana"): string {
  const p = new URLSearchParams({ auth_date: String(Math.floor(fecha)), query_id: "q1", user: JSON.stringify({ id, first_name: nombre }) });
  const texto = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  p.set("hash", createHmac("sha256", createHmac("sha256", "WebAppData").update(token).digest()).update(texto).digest("hex"));
  return p.toString();
}

test("validarInitData: acepta lo firmado por Telegram y rechaza firmas falsas, otro bot o datos caducados", () => {
  assert.deepEqual(validarInitData(initDataFirmado(42), TOKEN, AHORA), { id: "42", nombre: "Ana" });
  assert.equal(validarInitData(initDataFirmado(42, "999:OTRO"), TOKEN, AHORA), null); // firmado con otro token
  assert.equal(validarInitData(initDataFirmado(42).replace("42", "43"), TOKEN, AHORA), null); // manipulado
  assert.equal(validarInitData(initDataFirmado(42, TOKEN, AHORA.getTime() / 1000 - 2 * 86400), TOKEN, AHORA), null); // caducado
  assert.equal(validarInitData("", TOKEN, AHORA), null);
  assert.equal(validarInitData("user=%7B%22id%22%3A1%7D&hash=abc", TOKEN, AHORA), null);
});

async function banco() {
  const b = crearBanco(AHORA);
  const u = usuarioNuevo("1", "Ana", AHORA); u.zona = "Europe/Madrid"; u.onboardingHecho = true; u.ciudad = { nombre: "Córdoba", provincia: "Córdoba", lat: 37.89, lon: -4.78 };
  await b.almacen.guardarUsuario(u);
  return { b, api: async (ruta: string, c: Record<string, unknown> = {}) => manejarApi(b.deps, (await b.almacen.getUsuario("1"))!, ruta, c) };
}

test("mini app: estado, apariencia y secciones se guardan y se ven en el bot", async () => {
  const { b, api } = await banco();
  const e = (await api("/api/estado")).cuerpo as any;
  assert.equal(e.usuario.nombre, "Ana"); assert.equal(e.usuario.estilo, "informal"); assert.equal(e.secciones.length, 5); assert.match(e.usuario.sol, /amanece \d\d:\d\d/);
  await api("/api/apariencia", { estilo: "formal", modo: "auto" });
  const u = (await b.almacen.getUsuario("1"))!; assert.deepEqual([u.estilo, u.modo], ["formal", "auto"]);
  await api("/api/apariencia", { estilo: "raro", modo: "violeta" }); assert.equal((await b.almacen.getUsuario("1"))!.estilo, "formal"); // valores inválidos se ignoran
  assert.equal((await api("/api/seccion", { ref: "noticias", activa: true, hora: "07:45" })).estado, 200);
  assert.deepEqual([(await b.almacen.getUsuario("1"))!.secciones.noticias.activa, (await b.almacen.getUsuario("1"))!.secciones.noticias.hora], [true, "07:45"]);
  assert.ok([...b.almacen.programaciones.values()].some((p) => p.ref === "noticias")); // y queda programada
  assert.equal((await api("/api/seccion", { ref: "inventada", activa: true })).estado, 404);
  assert.equal((await api("/api/seccion", { ref: "horoscopo", activa: true })).estado, 409); // falta la fecha de nacimiento
});

test("mini app: crear, completar y borrar eventos (con su aviso programado)", async () => {
  const { b, api } = await banco();
  assert.equal((await api("/api/evento", { tipo: "cita", titulo: "" , cuando: "2026-10-06T10:30" })).estado, 400);
  assert.equal((await api("/api/evento", { tipo: "cita", titulo: "Cardiología" })).estado, 400); // una cita necesita fecha
  assert.equal((await api("/api/evento", { tipo: "cita", titulo: "Ayer", cuando: "2026-10-01T10:30" })).estado, 400); // pasada
  const r = await api("/api/evento", { tipo: "cita", titulo: "Cardiología", lugar: "Hospital", cuando: "2026-10-06T10:30", antelacionMin: 60 });
  assert.equal(r.estado, 200); const ev = (r.cuerpo as any).evento;
  const guardado = (await b.almacen.getEvento("1", ev.id))!;
  assert.equal(guardado.fechaHora!.toISOString(), "2026-10-06T08:30:00.000Z"); // 10:30 en Madrid (UTC+2)
  assert.equal(guardado.antelacionMin, 60); assert.ok([...b.almacen.programaciones.values()].some((p) => p.ref === ev.id));
  const t = await api("/api/evento", { tipo: "tarea", titulo: "Llamar al fontanero" }); assert.equal(t.estado, 200); // la tarea no necesita fecha
  assert.equal(((await api("/api/estado")).cuerpo as any).eventos.length, 2);
  await api("/api/evento/accion", { id: ev.id, accion: "hecho" }); assert.equal((await b.almacen.getEvento("1", ev.id))!.hecho, true);
  await api("/api/evento/accion", { id: ev.id, accion: "borrar" });
  assert.equal(await b.almacen.getEvento("1", ev.id), null); assert.ok(![...b.almacen.programaciones.values()].some((p) => p.ref === ev.id));
  assert.equal((await api("/api/evento/accion", { id: "nada", accion: "borrar" })).estado, 404);
});

test("mini app: «Ver» manda la sección al chat y «Todo lo activado» solo las activas", async () => {
  const { b, api } = await banco();
  assert.equal((await api("/api/enviar", { ref: "todo" })).estado, 409); // nada activado
  await api("/api/seccion", { ref: "agenda", activa: true });
  const r = await api("/api/enviar", { ref: "agenda" }); assert.equal(r.estado, 200);
  assert.equal(b.canal.mensajes.filter((m) => m.chatId === "1").length, 1);
  assert.equal(((await api("/api/enviar", { ref: "todo" })).cuerpo as any).enviadas, 1);
});

test("mini app: «ver» devuelve las secciones para mostrarlas dentro de la app, sin escribir en el chat, con sus botones útiles", async () => {
  const { b, api } = await banco();
  assert.equal((await api("/api/ver", { ref: "todo" })).estado, 409);
  await api("/api/seccion", { ref: "agenda", activa: true });
  b.canal.limpiar();
  const r = (await api("/api/ver", { ref: "agenda" })).cuerpo as any;
  assert.equal(r.secciones.length, 1); assert.match(r.secciones[0].html, /Agenda|agenda/); assert.equal(b.canal.mensajes.length, 0);
  assert.ok(r.secciones[0].botones.some((x: any) => x.ir === "eventos")); // «Mis eventos» lleva a esa pantalla de la app
  assert.ok(!r.secciones[0].botones.some((x: any) => x.texto.includes("Menú")));
  const mala = (await api("/api/ver", { ref: "inventada" })).cuerpo as any; assert.ok(mala.secciones[0].error);
  const sub = (await api("/api/ver", { ref: "tiempo:luna" })).cuerpo as any; assert.ok(sub.secciones[0].html || sub.secciones[0].error);
});

test("mini app: perfil y temas de noticias se editan desde la app", async () => {
  const { b, api } = await banco();
  assert.equal((await api("/api/perfil", { nombre: "  Juanito ", nacimiento: "1984-04-05" })).estado, 200);
  const u = (await b.almacen.getUsuario("1"))!; assert.deepEqual([u.nombre, u.nacimiento], ["Juanito", "1984-04-05"]);
  assert.equal((await api("/api/perfil", { nacimiento: "1984-13-45" })).estado, 400);
  const t = (await api("/api/tema", { titulo: "Ajedrez", consulta: "ajedrez OR Magnus" })).cuerpo as any; assert.equal(t.ref, "tema:ajedrez");
  assert.ok([...b.almacen.programaciones.values()].some((p) => p.ref === "tema:ajedrez"));
  assert.equal((await api("/api/tema", { titulo: "Ajedrez" })).estado, 200); assert.equal((await b.almacen.getUsuario("1"))!.temas.length, 2); // id distinto
  await api("/api/tema", { borrar: "ajedrez" });
  assert.deepEqual((await b.almacen.getUsuario("1"))!.temas.map((x) => x.id), ["ajedrez-2"]);
  assert.ok(![...b.almacen.programaciones.values()].some((p) => p.ref === "tema:ajedrez"));
  assert.equal((await api("/api/tema", { titulo: " " })).estado, 400);
});

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

test("mini app: lista de la compra (añadir varias, marcar, terminar guardando con fecha o eliminando, historial)", async () => {
  const { b, api } = await banco();
  const c = (cuerpo: Record<string, unknown>) => api("/api/compra", cuerpo);
  assert.equal((await c({ accion: "anadir", texto: "  " })).estado, 400);
  await c({ accion: "anadir", texto: "Leche, Pan\nHuevos; " });
  let l = (await b.almacen.getUsuario("1"))!.compra; assert.deepEqual(l.items.map((x) => x.texto), ["Leche", "Pan", "Huevos"]);
  assert.equal((await c({ accion: "terminar", guardar: true })).estado, 409); // nada marcado
  await c({ accion: "marcar", id: l.items[0].id }); await c({ accion: "marcar", id: l.items[1].id });
  assert.equal((await c({ accion: "marcar", id: "nada" })).estado, 404);
  await c({ accion: "terminar", guardar: true });
  l = (await b.almacen.getUsuario("1"))!.compra;
  assert.deepEqual(l.items.map((x) => x.texto), ["Huevos"]); // lo no comprado se queda
  assert.equal(l.historial.length, 1); assert.deepEqual(l.historial[0].items, ["Leche", "Pan"]); assert.equal(l.historial[0].fecha, AHORA.toISOString());
  await c({ accion: "anadir", texto: "Sal" }); await c({ accion: "marcar", id: (await b.almacen.getUsuario("1"))!.compra.items[1].id });
  await c({ accion: "terminar", guardar: false }); // eliminar sin guardar
  l = (await b.almacen.getUsuario("1"))!.compra; assert.equal(l.historial.length, 1); assert.deepEqual(l.items.map((x) => x.texto), ["Huevos"]);
  await c({ accion: "repetir", id: l.historial[0].id }); assert.deepEqual((await b.almacen.getUsuario("1"))!.compra.items.map((x) => x.texto), ["Huevos", "Leche", "Pan"]);
  await c({ accion: "quitar", id: (await b.almacen.getUsuario("1"))!.compra.items[0].id });
  await c({ accion: "olvidar", id: l.historial[0].id }); assert.equal((await b.almacen.getUsuario("1"))!.compra.historial.length, 0);
  await c({ accion: "vaciar" }); assert.deepEqual((await b.almacen.getUsuario("1"))!.compra.items, []);
  assert.deepEqual(((await api("/api/estado")).cuerpo as any).compra.items, []);
});

test("lista compartida por enlace: quien la recibe ve, añade, marca y quita; al terminar la compra el enlace caduca y el siguiente es nuevo", async () => {
  const { manejarListaPublica } = await import("./miniapp");
  const { b, api } = await banco();
  b.deps.urlBase = "https://agenda.test";
  const dueno = async (cuerpo: Record<string, unknown>) => (await api("/api/compra", cuerpo)).cuerpo as any;
  assert.equal((await api("/api/compra", { accion: "marcar", id: "x" })).estado, 404);
  await dueno({ accion: "anadir", texto: "Leche, Pan" });
  const r1 = await dueno({ accion: "compartir" });
  assert.match(r1.enlace, /^https:\/\/agenda\.test\/lista\/\?t=[a-z2-9]{18}$/);
  const token = r1.enlace.split("t=")[1];
  assert.equal((await dueno({ accion: "compartir" })).enlace, r1.enlace); // mientras la lista siga abierta, el mismo enlace
  const pub = (c: Record<string, unknown>) => manejarListaPublica(b.deps, { token, ...c });
  const v = (await pub({ accion: "estado" })).cuerpo as any; assert.deepEqual(v.items.map((x: any) => x.texto), ["Leche", "Pan"]); assert.equal(v.propietario, "Ana");
  await pub({ accion: "anadir", texto: "Huevos" }); await pub({ accion: "marcar", id: v.items[0].id }); // lo que hace quien recibe el enlace…
  const mio = (await b.almacen.getUsuario("1"))!.compra; assert.deepEqual(mio.items.map((x) => [x.texto, x.hecho]), [["Leche", true], ["Pan", false], ["Huevos", false]]); // …lo ve el dueño
  assert.equal((await pub({ accion: "terminar", guardar: true })).estado, 403); // quien recibe el enlace no puede terminar la compra ni tocar el historial
  assert.equal((await pub({ accion: "vaciar" })).estado, 403);
  await pub({ accion: "quitar", id: v.items[1].id });
  assert.equal((await manejarListaPublica(b.deps, { token: "aaaaaaaaaaaaaaaaaa", accion: "estado" })).estado, 404); // código inventado
  assert.equal((await manejarListaPublica(b.deps, { token: "../../etc", accion: "estado" })).estado, 404);
  await dueno({ accion: "terminar", guardar: true }); // el dueño termina la compra
  assert.equal((await pub({ accion: "estado" })).estado, 404); // el enlace viejo ya no vale
  await dueno({ accion: "anadir", texto: "Sal" });
  const r2 = await dueno({ accion: "compartir" }); assert.notEqual(r2.enlace, r1.enlace); // la nueva lista, enlace nuevo
  await dueno({ accion: "descompartir" });
  assert.equal((await manejarListaPublica(b.deps, { token: r2.enlace.split("t=")[1], accion: "estado" })).estado, 404);
});

test("mini app: avatar (emoji, foto de Telegram, foto subida o inicial) y lista de avatares", async () => {
  const { b, api } = await banco();
  const e = (await api("/api/estado")).cuerpo as any; assert.equal(e.avatar, null); assert.ok(e.avatares.length >= 60 && e.avatares.includes("🦊")); // sin elegir: la app pinta la inicial
  assert.equal((await api("/api/avatar", { tipo: "emoji", emoji: "💩", color: 1 })).estado, 400); // fuera de la lista
  assert.equal((await api("/api/avatar", { tipo: "emoji", emoji: "🦊", color: 99 })).estado, 400);
  await api("/api/avatar", { tipo: "emoji", emoji: "🐼", color: 3 }); assert.deepEqual((await b.almacen.getUsuario("1"))!.avatar, { tipo: "emoji", emoji: "🐼", color: 3 });
  await api("/api/avatar", { tipo: "telegram" }); assert.deepEqual((await b.almacen.getUsuario("1"))!.avatar, { tipo: "telegram" });
  assert.equal((await api("/api/avatar", { tipo: "foto", foto: "http://malo.example/x.png" })).estado, 400);
  assert.equal((await api("/api/avatar", { tipo: "foto", foto: "data:image/jpeg;base64," + "A".repeat(80_000) })).estado, 400); // demasiado grande
  assert.equal((await api("/api/avatar", { tipo: "foto", foto: "data:text/html;base64,PHNjcmlwdD4=" })).estado, 400); // solo imágenes
  const foto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
  assert.equal((await api("/api/avatar", { tipo: "foto", foto })).estado, 200);
  const e2 = (await api("/api/estado")).cuerpo as any; assert.deepEqual(e2.avatar, { tipo: "foto" }); assert.equal(e2.fotoAvatar, foto);
  await api("/api/avatar", { tipo: "ninguno" }); assert.equal(((await api("/api/estado")).cuerpo as any).avatar, null);
  assert.equal((await api("/api/avatar", { tipo: "raro" })).estado, 400);
});

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

test("acceso desde otro dispositivo: el enlace vale una vez y 10 minutos; la sesión se puede renovar y cerrar", async () => {
  const { crearAcceso, canjearAcceso, usuarioDeSesion, cerrarSesion } = await import("./sesiones");
  const al = new (await import("./almacen")).AlmacenMemoria(); const t0 = new Date("2026-10-05T10:00:00Z");
  const c = await crearAcceso(al, "1", t0); assert.match(c, /^[a-z2-9]{20}$/);
  assert.equal(await canjearAcceso(al, "malo", t0), null); assert.equal(await canjearAcceso(al, "a".repeat(20), t0), null);
  const r = (await canjearAcceso(al, c, new Date(t0.getTime() + 5 * 60_000)))!; assert.equal(r.uid, "1"); assert.match(r.token, /^[a-z2-9]{40}$/);
  assert.equal(await canjearAcceso(al, c, t0), null); // un solo uso
  const c2 = await crearAcceso(al, "1", t0); assert.equal(await canjearAcceso(al, c2, new Date(t0.getTime() + 11 * 60_000)), null); // caducado a los 10 minutos
  assert.equal(await usuarioDeSesion(al, r.token, t0), "1"); assert.equal(await usuarioDeSesion(al, "x".repeat(40), t0), null); assert.equal(await usuarioDeSesion(al, "corto", t0), null);
  assert.equal(await usuarioDeSesion(al, r.token, new Date(t0.getTime() + 179 * 24 * 3600_000)), "1");
  assert.equal(await usuarioDeSesion(al, r.token, new Date(t0.getTime() + 181 * 24 * 3600_000)), null); // 180 días
  await cerrarSesion(al, r.token, t0); assert.equal(await usuarioDeSesion(al, r.token, t0), null);
});

test("bot: /app da un enlace de acceso de un solo uso", async () => {
  const b = crearBanco(AHORA); b.deps.urlBase = "https://agenda.test";
  const u = usuarioNuevo("1", "Ana", AHORA); u.onboardingHecho = true; await b.almacen.guardarUsuario(u);
  await b.escribir("1", "/app");
  const boton = b.canal.botones("1").find((x) => x.url)!; assert.match(boton.url!, /^https:\/\/agenda\.test\/app\/\?acceso=[a-z2-9]{20}$/);
  const { canjearAcceso } = await import("./sesiones"); const codigo = boton.url!.split("acceso=")[1];
  assert.equal((await canjearAcceso(b.almacen, codigo, AHORA))!.uid, "1");
  const b2 = crearBanco(AHORA); await b2.almacen.guardarUsuario(u); await b2.escribir("1", "/app"); assert.match(b2.canal.textos("1").at(-1)!, /aún no está disponible/); // sin dirección pública
});

test("mini app: notificaciones (dispositivos, canal y prueba)", async () => {
  const { b, api } = await banco();
  const { createECDH, randomBytes } = await import("node:crypto"); const { b64u } = await import("./webpush");
  const e = createECDH("prime256v1"); e.generateKeys();
  const suscripcion = { endpoint: "https://push.example/abc123", p256dh: b64u(e.getPublicKey()), auth: b64u(randomBytes(16)) };
  const clave = ((await api("/api/push/clave")).cuerpo as any).clave; assert.equal(clave.length, 87); // 65 bytes en base64url
  assert.equal(((await api("/api/push/clave")).cuerpo as any).clave, clave); // siempre la misma
  assert.equal((await api("/api/notificaciones", { canal: "app" })).estado, 409); // sin dispositivo no se puede elegir «solo app»
  assert.equal((await api("/api/push/probar")).estado, 409); assert.equal((await api("/api/push/suscribir", { suscripcion: { ...suscripcion, auth: "x" } })).estado, 400);
  assert.equal((await api("/api/push/suscribir", { suscripcion, dispositivo: "  Mi móvil " })).estado, 200);
  await api("/api/push/suscribir", { suscripcion, dispositivo: "Mi móvil" }); // el mismo dispositivo no se duplica
  let e1 = ((await api("/api/estado")).cuerpo as any).notificaciones; assert.equal(e1.dispositivos.length, 1); assert.equal(e1.dispositivos[0].nombre, "Mi móvil"); assert.equal(e1.canal, "ambos"); // al activar el primer dispositivo, los avisos llegan también por la app
  assert.equal((await api("/api/notificaciones", { canal: "ambos" })).estado, 200); assert.equal((await api("/api/notificaciones", { canal: "otro" })).estado, 400);
  assert.equal((await api("/api/push/probar")).estado, 409); // sin emisor (no disponible aquí)
  const enviados: string[] = []; b.deps.push = async (s, aviso) => { enviados.push(`${s.dispositivo}:${aviso.titulo}`); return "ok"; };
  assert.deepEqual(((await api("/api/push/probar")).cuerpo as any).enviadas, 1); assert.match(enviados[0], /^Mi móvil:🔔/);
  b.deps.push = async () => "caducada"; assert.equal((await api("/api/push/probar")).estado, 502);
  e1 = ((await api("/api/estado")).cuerpo as any).notificaciones; assert.equal(e1.dispositivos.length, 0); // se olvidó el caducado
  await api("/api/push/suscribir", { suscripcion }); await api("/api/push/quitar", { id: suscripcion.endpoint.slice(-24) });
  assert.equal(((await api("/api/estado")).cuerpo as any).notificaciones.dispositivos.length, 0);
  assert.equal(((await api("/api/estado")).cuerpo as any).notificaciones.canal, "telegram"); // sin dispositivos vuelve a solo Telegram
  const primera = (await api("/api/push/suscribir", { suscripcion })).cuerpo as any; assert.deepEqual([primera.canal, primera.cambiado], ["ambos", true]);
  await api("/api/notificaciones", { canal: "app" }); const segunda = (await api("/api/push/suscribir", { suscripcion: { ...suscripcion, endpoint: "https://push.example/otro" } })).cuerpo as any; assert.deepEqual([segunda.canal, segunda.cambiado], ["app", false]); // no se pisa lo elegido
});

test("WhatsApp en un toque: teléfonos, enlace y repetición anual", async () => {
  const { normalizarTelefono, enlaceWhatsApp } = await import("./whatsapp");
  assert.equal(normalizarTelefono("600 11 22 33"), "34600112233"); assert.equal(normalizarTelefono("+34 600-11-22-33"), "34600112233");
  assert.equal(normalizarTelefono("0034600112233"), "34600112233"); assert.equal(normalizarTelefono("+44 7700 900123"), "447700900123");
  for (const mal of ["", "abc", "12", "+1234567890123456", "123"]) assert.equal(normalizarTelefono(mal), null, mal);
  assert.equal(enlaceWhatsApp({ telefono: "34600112233", texto: "¡Feliz cumple! 🎂 & besos" }), "https://wa.me/34600112233?text=%C2%A1Feliz%20cumple!%20%F0%9F%8E%82%20%26%20besos");
  assert.equal(enlaceWhatsApp({ telefono: "", texto: "Hola" }), "https://wa.me/?text=Hola");
  const { siguienteRepeticion } = await import("./fechas");
  const f = (s: string) => new Date(s);
  assert.equal(siguienteRepeticion(f("2026-10-14T07:00:00Z"), "anual", "Europe/Madrid")!.toISOString(), "2027-10-14T07:00:00.000Z"); // misma hora local
  assert.equal(siguienteRepeticion(f("2028-02-29T09:00:00Z"), "anual", "Europe/Madrid")!.toISOString(), "2029-02-28T09:00:00.000Z"); // 29-feb → 28-feb
  assert.equal(siguienteRepeticion(f("2026-01-15T09:00:00Z"), "anual", "Europe/Madrid")!.toISOString(), "2027-01-15T09:00:00.000Z"); // invierno
});

test("mini app: mensaje de WhatsApp programado (crear, validar y avisar con el botón de envío)", async () => {
  const { b, api } = await banco();
  assert.equal((await api("/api/evento", { tipo: "mensaje", para: "Mamá", cuando: "2026-10-14T09:00" })).estado, 400); // sin texto
  assert.equal((await api("/api/evento", { tipo: "mensaje", para: "Mamá", texto: "Hola", telefono: "abc", cuando: "2026-10-14T09:00" })).estado, 400); // teléfono mal
  assert.equal((await api("/api/evento", { tipo: "mensaje", para: "Mamá", texto: "Hola" })).estado, 400); // sin fecha
  const r = await api("/api/evento", { tipo: "mensaje", para: "Mamá", telefono: "600 11 22 33", texto: "¡Feliz cumpleaños! 🎂", cuando: "2026-10-14T09:00", repeticion: "anual" });
  assert.equal(r.estado, 200); const ev = (r.cuerpo as any).evento;
  assert.equal(ev.titulo, "Mensaje a Mamá"); assert.deepEqual(ev.mensaje, { para: "Mamá", telefono: "34600112233", texto: "¡Feliz cumpleaños! 🎂" }); assert.match(ev.enlaceWa, /^https:\/\/wa\.me\/34600112233\?text=/);
  assert.equal((await b.almacen.getEvento("1", ev.id))!.repeticion, "anual"); assert.ok([...b.almacen.programaciones.values()].some((p) => p.ref === ev.id));
  // llega la hora: aviso por Telegram con el botón de WhatsApp y por la app con la acción de un toque
  const u = (await b.almacen.getUsuario("1"))!; u.notificaciones = { canal: "ambos", suscripciones: [{ endpoint: "https://push.example/x", p256dh: "p", auth: "a", dispositivo: "móvil", desde: "2026-10-01" }] }; await b.almacen.guardarUsuario(u);
  const { tick } = await import("./scheduler"); const avisos: any[] = [];
  const ahora = new Date("2026-10-14T07:00:30Z"); // 09:00 en Madrid
  await tick({ almacen: b.almacen, canal: b.canal, http: b.http, ahora: () => ahora, push: async (_s, a) => { avisos.push(a); return "ok"; } });
  assert.equal(avisos.length, 1); assert.equal(avisos[0].titulo, "💬 Enviar a Mamá"); assert.equal(avisos[0].url, `/app/?wa=${ev.id}`); assert.equal(avisos[0].enlace.url, ev.enlaceWa);
  const boton = b.canal.botones("1").find((x) => x.url); assert.equal(boton!.url, ev.enlaceWa); assert.match(boton!.texto, /WhatsApp/);
  assert.match(b.canal.textos("1").at(-1)!, /Feliz cumpleaños/); assert.deepEqual(b.canal.violaciones, []);
  // repetición anual: se reprograma para el año que viene
  assert.equal((await b.almacen.getEvento("1", ev.id))!.fechaHora!.toISOString(), "2027-10-14T07:00:00.000Z");
});

test("noticias como tarjetas: el RSS de Bing trae la foto, y la sección entrega las noticias estructuradas", async () => {
  const { leerRss } = await import("./rss");
  const xml = `<rss><channel><item><title>Titular uno</title><link>https://www.bing.com/news/apiclick.aspx?url=https%3a%2f%2fdiario.example%2funo&amp;x=1</link><pubDate>Sun, 04 Oct 2026 08:00:00 GMT</pubDate><News:Source>Diario</News:Source><News:Image>http://www.bing.com/th?id=ON.ABC123&amp;pid=News</News:Image></item>
    <item><title>Titular dos</title><link>https://d.example/dos</link><News:Image>https://x.example/foto.jpg</News:Image></item><item><title>Sin foto</title><link>https://d.example/tres</link></item></channel></rss>`;
  const n = leerRss(xml);
  assert.equal(n[0].enlace, "https://diario.example/uno"); assert.equal(n[0].imagen, "https://www.bing.com/th?id=ON.ABC123&pid=News&w=360&h=220&c=7&rs=1"); // https y con tamaño
  assert.equal(n[1].imagen, "https://x.example/foto.jpg"); assert.equal(n[2].imagen, undefined);
  const { b, api } = await banco();
  b.http.añadir("bing.com/news", xml).añadir("news.google.com", xml);
  await api("/api/seccion", { ref: "noticias", activa: true });
  const r = (await api("/api/ver", { ref: "noticias" })).cuerpo as any; const s = r.secciones[0];
  assert.ok(s.grupos.length >= 1); assert.equal(s.grupos[0].noticias[0].titulo, "Titular uno"); assert.equal(s.grupos[0].noticias[0].enlace, "https://diario.example/uno"); assert.match(s.grupos[0].noticias[0].imagen, /^https:\/\//);
});

test("resumen de hoy: lo que se pide se guarda y la pantalla principal lo muestra sin volver a prepararlo", async () => {
  const { b, api } = await banco();
  const estado = async () => ((await api("/api/estado")).cuerpo as any).resumenHoy as any[];
  assert.deepEqual(await estado(), []); // aún no se ha pedido nada
  await api("/api/seccion", { ref: "agenda", activa: true });
  const r1 = (await api("/api/ver", { ref: "agenda" })).cuerpo as any; assert.match(r1.secciones[0].hora, /^\d\d:\d\d$/);
  const hoy = await estado(); assert.equal(hoy.length, 1); assert.equal(hoy[0].ref, "agenda"); assert.equal(hoy[0].titulo, "Agenda"); assert.ok(hoy[0].previa.length > 3);
  // lo guardado se devuelve sin preparar de nuevo (aunque haya cambiado la agenda)
  await api("/api/evento", { tipo: "tarea", titulo: "Algo nuevo" });
  const g = (await api("/api/ver", { ref: "agenda", guardado: true })).cuerpo as any; assert.equal(g.secciones[0].guardado, true); assert.equal(g.secciones[0].html, r1.secciones[0].html);
  const f = (await api("/api/ver", { ref: "agenda" })).cuerpo as any; assert.equal(f.secciones[0].guardado, undefined); // sin «guardado» se vuelve a preparar
  assert.equal(((await api("/api/ver", { ref: "tiempo:horas", guardado: true })).cuerpo as any).secciones[0].guardado, undefined); // las subpantallas no se guardan
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 24 * 3600_000); // al día siguiente, la pantalla principal vuelve a estar vacía
  assert.deepEqual(await estado(), []);
});

test("notas: se crean sin fecha, con título o a partir del texto", async () => {
  const { b, api } = await banco();
  const r = await api("/api/evento", { tipo: "nota", texto: "Comprar regalo para Ana\nque le gusta el azul" }); assert.equal(r.estado, 200);
  const ev = (r.cuerpo as any).evento; assert.equal(ev.titulo, "Comprar regalo para Ana"); assert.equal(ev.nota, "Comprar regalo para Ana\nque le gusta el azul"); assert.equal(ev.cuando, null);
  assert.equal((await b.almacen.getEvento("1", ev.id))!.nota, "Comprar regalo para Ana\nque le gusta el azul");
  assert.equal([...b.almacen.programaciones.values()].some((p) => p.ref === ev.id), false); // no avisa
  assert.equal((await api("/api/evento", { tipo: "nota", titulo: "Ideas", texto: "" })).estado, 200);
  assert.equal((await api("/api/evento", { tipo: "nota" })).estado, 400); // sin nada
});

test("secciones: las integradas se pueden eliminar (dejan de enviarse y se ocultan) y volver a añadir", async () => {
  const { b, api } = await banco();
  await api("/api/seccion", { ref: "tiempo", activa: true, hora: "07:30" });
  assert.ok([...b.almacen.programaciones.values()].some((p) => p.ref === "tiempo"));
  await api("/api/seccion", { ref: "tiempo", oculta: true });
  const u = (await b.almacen.getUsuario("1"))!; assert.deepEqual([u.secciones.tiempo.oculta, u.secciones.tiempo.activa], [true, false]);
  assert.ok(![...b.almacen.programaciones.values()].some((p) => p.ref === "tiempo")); // ya no se envía
  const e = ((await api("/api/estado")).cuerpo as any).secciones.find((s: any) => s.ref === "tiempo"); assert.equal(e.oculta, true);
  const { tecladoHoy } = await import("./bot/vistas"); assert.ok(!tecladoHoy(u).flat().some((x) => x.datos === "sec:tiempo")); // tampoco sale en el bot
  await api("/api/seccion", { ref: "tiempo", oculta: false }); assert.equal((await b.almacen.getUsuario("1"))!.secciones.tiempo.oculta, false);
  await api("/api/seccion", { ref: "tema:inexistente", oculta: true }); // los temas no se ocultan: se borran con /api/tema
  assert.equal((await api("/api/seccion", { ref: "tema:x", oculta: true })).estado, 404);
});

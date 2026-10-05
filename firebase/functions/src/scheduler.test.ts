import { test } from "node:test";
import assert from "node:assert/strict";
import { idProgramacion } from "./almacen";
import { Banco, bloqueado, crearBanco, geocodingFalso, rssFalso } from "./arnes";
import { localAUtc, partesEnZona } from "./fechas";
import { Evento } from "./modelo";
import { tick } from "./scheduler";

const MAD = "Europe/Madrid";
const U = "42";
const local = (d: Date, z = MAD) => { const p = partesEnZona(d, z); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")} ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };
const prog = (b: Banco, tipo: "seccion" | "evento", ref: string) => b.almacen.programaciones.get(idProgramacion(U, tipo, ref));
const avanzar = (b: Banco, iso: string) => { b.reloj.ahora = new Date(iso); };
const correr = (b: Banco) => tick({ almacen: b.almacen, canal: b.canal, http: b.http, ahora: b.deps.ahora });
const evs = async (b: Banco) => b.almacen.listarEventos(U);

/** Usuario con configuración terminada (noticias 07:10, agenda 07:20, mercados 14:00) a las 06:00 de Madrid del domingo 4-oct-2026. */
async function usuarioListo(): Promise<Banco> {
  const b = crearBanco(new Date("2026-10-04T04:00:00Z"));
  b.http.añadir("news.google.com", rssFalso("Noticia", 5));
  await b.escribir(U, "/start"); await b.pulsar(U, "o:omitir");
  b.canal.limpiar();
  return b;
}

/** Quita los resúmenes diarios para probar solo los avisos de eventos (si no, al avanzar el reloj también vencen ellos). */
const sinResumenes = (b: Banco) => b.almacen.borrarProgramacionesDe(U, "seccion");

async function nuevaAlarma(b: Banco, titulo: string, cuando: string, rep = "ninguna") {
  await b.pulsar(U, "n:tipo:alarma"); await b.escribir(U, titulo); await b.escribir(U, cuando); await b.pulsar(U, `n:rep:${rep}`);
  b.canal.limpiar();
  return (await evs(b)).find((e) => e.titulo === titulo)!;
}

// =============== Resúmenes diarios ===============
test("el resumen se envía a su hora, se rearma para el día siguiente y no se repite", async () => {
  const b = await usuarioListo();
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-04 07:10");
  avanzar(b, "2026-10-04T05:09:00Z"); // 07:09
  assert.deepEqual(await correr(b), { enviados: 0, omitidos: 0, fallidos: 0 });
  avanzar(b, "2026-10-04T05:10:20Z"); // 07:10:20
  const r = await correr(b);
  assert.equal(r.enviados, 1);
  assert.match(b.canal.ultimo(U).html, /Noticias del día/); assert.equal(b.canal.ultimo(U).chatId, U);
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-05 07:10");
  assert.deepEqual(await correr(b), { enviados: 0, omitidos: 0, fallidos: 0 }); // la misma hora no se manda dos veces
  assert.equal(b.canal.mensajes.length, 1);
});

test("varias secciones vencidas a la vez se envían todas", async () => {
  const b = await usuarioListo();
  b.http.añadir("finance.yahoo.com", new Error("x"));
  avanzar(b, "2026-10-04T05:25:00Z"); // 07:25: noticias (07:10) y agenda (07:20)
  const r = await correr(b);
  assert.equal(r.enviados, 2);
  assert.ok(b.canal.textos(U).some((t) => t.startsWith("🗓 <b>Tu agenda</b>")) && b.canal.textos(U).some((t) => t.startsWith("📰 <b>Noticias del día</b>")));
});

test("tras una caída larga no se mandan resúmenes de hace horas, pero sí se rearman", async () => {
  const b = await usuarioListo();
  avanzar(b, "2026-10-04T10:00:00Z"); // 12:00: noticias y agenda llevan casi 5 h de retraso
  const r = await correr(b);
  assert.equal(r.enviados, 0); assert.equal(r.omitidos, 2);
  assert.equal(b.canal.mensajes.length, 0);
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-05 07:10");
});

test("si falla la obtención de datos se reintenta a los 10 minutos y, agotados los intentos, se espera al día siguiente", async () => {
  const b = await usuarioListo();
  b.http.añadir("news.google.com", new Error("Google caído"));
  avanzar(b, "2026-10-04T05:10:00Z");
  assert.equal((await correr(b)).fallidos, 1);
  let p = prog(b, "seccion", "noticias")!;
  assert.equal(local(p.proximo), "2026-10-04 07:20"); assert.equal(p.intentos, 1);
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 11 * 60_000); await correr(b);
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 11 * 60_000); await correr(b);
  p = prog(b, "seccion", "noticias")!; assert.equal(p.intentos, 3);
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 11 * 60_000); await correr(b);
  p = prog(b, "seccion", "noticias")!;
  assert.equal(local(p.proximo), "2026-10-05 07:10"); assert.equal(p.intentos, 0);
  assert.equal(b.canal.mensajes.filter((m) => /Noticias del día/.test(m.html)).length, 0);
});

test("si un reintento funciona, vuelve a su hora normal y se cuenta como enviado", async () => {
  const b = await usuarioListo();
  b.http.añadir("news.google.com", new Error("caído"));
  avanzar(b, "2026-10-04T05:10:00Z"); await correr(b);
  b.http.añadir("news.google.com", rssFalso("Noticia", 5));
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 11 * 60_000);
  assert.equal((await correr(b)).enviados >= 1, true);
  const p = prog(b, "seccion", "noticias")!;
  assert.equal(local(p.proximo), "2026-10-05 07:10"); assert.equal(p.intentos, 0);
});

test("dos ejecuciones simultáneas no duplican el envío", async () => {
  const b = await usuarioListo();
  avanzar(b, "2026-10-04T05:10:30Z");
  const [r1, r2] = await Promise.all([correr(b), correr(b)]);
  assert.equal(r1.enviados + r2.enviados, 1);
  assert.equal(b.canal.mensajes.filter((m) => /Noticias del día/.test(m.html)).length, 1);
});

test("el resumen de un tema personalizado y el del tiempo se envían a su hora", async () => {
  const b = await usuarioListo();
  b.http.añadir("geocoding-api", geocodingFalso());
  await b.pulsar(U, "s:tema+"); await b.escribir(U, "Ajedrez"); await b.pulsar(U, "s:temaskip");
  assert.equal(local(prog(b, "seccion", "tema:ajedrez")!.proximo), "2026-10-05 08:30".replace("05", "04")); // hoy 08:30 (aún no ha pasado)
  b.canal.limpiar();
  avanzar(b, "2026-10-04T06:31:00Z"); // 08:31
  await correr(b);
  assert.ok(b.canal.textos(U).some((t) => /⭐ <b>Ajedrez<\/b>/.test(t)));
});

test("una sección desactivada o un usuario borrado o bloqueado dejan de enviarse", async () => {
  const b = await usuarioListo();
  const u = (await b.almacen.getUsuario(U))!; u.secciones.noticias.activa = false; await b.almacen.guardarUsuario(u);
  avanzar(b, "2026-10-04T05:10:30Z");
  await correr(b);
  assert.equal(b.canal.mensajes.filter((m) => /Noticias del día/.test(m.html)).length, 0);
  assert.equal(prog(b, "seccion", "noticias"), undefined, "la programación huérfana se limpia");
  await b.almacen.borrarUsuario(U); // restos de una programación de un usuario inexistente
  await b.almacen.guardarProgramacion({ id: "fantasma", uid: U, tipo: "seccion", ref: "agenda", proximo: new Date("2026-10-04T05:00:00Z") });
  await correr(b);
  assert.equal(b.almacen.programaciones.size, 0);
});

test("si el usuario ha bloqueado el bot (403) se desactiva y se borran sus envíos", async () => {
  const b = await usuarioListo();
  b.canal.falla = () => bloqueado();
  avanzar(b, "2026-10-04T05:10:30Z");
  const r = await correr(b);
  assert.equal(r.fallidos >= 1, true);
  assert.equal((await b.almacen.getUsuario(U))!.activo, false); assert.equal(b.almacen.programaciones.size, 0);
});

test("un usuario que falla no impide enviar a los demás", async () => {
  const b = await usuarioListo();
  await b.escribir("77", "/start"); await b.pulsar("77", "o:omitir");
  b.canal.limpiar();
  b.canal.falla = (chat) => (chat === U ? new Error("500 Telegram") : undefined);
  avanzar(b, "2026-10-04T05:10:30Z");
  const r = await correr(b);
  assert.equal(r.enviados, 1); assert.equal(r.fallidos, 1);
  assert.equal(b.canal.mensajes[0].chatId, "77");
});

// =============== Avisos de eventos ===============
test("alarma de una sola vez: avisa con los botones, se conserva y no vuelve a sonar", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Tomar la pastilla", "hoy 9:30");
  avanzar(b, "2026-10-04T07:30:10Z"); // 09:30:10
  const r = await correr(b);
  assert.equal(r.enviados, 1);
  const m = b.canal.ultimo(U);
  assert.match(m.html, /⏰ <b>Tomar la pastilla<\/b>/); assert.match(m.html, /hora de tu alarma/);
  assert.deepEqual(m.teclado!.flat().map((x) => x.datos), [`e:delok:${e.id}`, `e:keep:${e.id}`, `e:ver:${e.id}`, `e:snz:${e.id}`]);
  assert.deepEqual(m.teclado!.flat().map((x) => x.texto), ["🗑 Eliminar", "✅ Conservar", "✏️ Modificar", "💤 Posponer 10 min"]);
  assert.equal(prog(b, "evento", e.id), undefined);
  assert.equal((await b.almacen.getEvento(U, e.id))!.avisado, true);
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 3_600_000);
  assert.equal((await correr(b)).enviados, 0);
});

test("botones del aviso: Conservar mantiene, Eliminar borra y Modificar abre el evento", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Reunión", "hoy 9:30");
  avanzar(b, "2026-10-04T07:30:10Z"); await correr(b);
  await b.pulsarTexto(U, "Conservar");
  assert.match(b.canal.ultimo(U).html, /Conservado/); assert.ok(await b.almacen.getEvento(U, e.id));
  await b.pulsar(U, `e:ver:${e.id}`); // «Modificar»
  assert.match(b.canal.ultimo(U).html, /Reunión/); assert.ok(b.canal.botones(U).some((x) => x.texto.includes("Fecha y hora")));
  await b.pulsar(U, `e:delok:${e.id}`);
  assert.equal(await b.almacen.getEvento(U, e.id), null);
});

test("posponer 10 minutos: vuelve a avisar y no altera la repetición del evento", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Medicación", "hoy 9:30", "diaria");
  avanzar(b, "2026-10-04T07:30:05Z"); await correr(b);
  // la alarma diaria ya está rearmada para mañana
  assert.equal(local((await b.almacen.getEvento(U, e.id))!.fechaHora!), "2026-10-05 09:30");
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-05 09:30");
  await b.pulsar(U, `e:snz:${e.id}`);
  assert.match(b.canal.ultimo(U).html, /Te lo recuerdo de nuevo a las 09:40/);
  const pos = prog(b, "evento", `posponer_${e.id}`)!;
  assert.equal(local(pos.proximo), "2026-10-04 09:40"); assert.equal(pos.posponer, true);
  avanzar(b, "2026-10-04T07:35:00Z"); assert.equal((await correr(b)).enviados, 0);
  avanzar(b, "2026-10-04T07:40:10Z");
  assert.equal((await correr(b)).enviados, 1);
  assert.match(b.canal.ultimo(U).html, /Medicación/);
  assert.equal(prog(b, "evento", `posponer_${e.id}`), undefined);
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-05 09:30", "la repetición diaria sigue intacta");
  assert.equal(local((await b.almacen.getEvento(U, e.id))!.fechaHora!), "2026-10-05 09:30");
});

test("alarma diaria: avisa cada día a la misma hora local aunque cambie el horario de verano", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Despertador", "24/10 9:00", "diaria"); // sábado antes del cambio de hora del 25-oct
  assert.equal(prog(b, "evento", e.id)!.proximo.toISOString(), "2026-10-24T07:00:00.000Z"); // UTC+2
  b.reloj.ahora = new Date("2026-10-24T07:00:30Z"); await correr(b);
  assert.equal(prog(b, "evento", e.id)!.proximo.toISOString(), "2026-10-25T08:00:00.000Z"); // UTC+1: sigue siendo las 09:00
  b.reloj.ahora = new Date("2026-10-25T08:00:30Z"); assert.equal((await correr(b)).enviados, 1);
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-26 09:00");
});

test("alarma de lunes a viernes: el viernes salta al lunes", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Fichar", "viernes 8:00", "laborables");
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-09 08:00");
  b.reloj.ahora = new Date("2026-10-09T06:00:30Z"); await correr(b);
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-12 08:00");
});

test("cita con antelación: avisa antes y dice cuándo es", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  await b.pulsar(U, "n:tipo:cita"); await b.escribir(U, "Cardiología"); await b.escribir(U, "mañana 11:00"); await b.escribir(U, "Hospital <Norte>"); await b.pulsar(U, "n:ant:180");
  b.canal.limpiar();
  avanzar(b, "2026-10-05T06:00:10Z"); // 08:00 de mañana = 3 h antes
  assert.equal((await correr(b)).enviados >= 1, true);
  const m = b.canal.mensajes.find((x) => /Cardiología/.test(x.html))!;
  assert.match(m.html, /🩺 <b>Cardiología<\/b>/); assert.match(m.html, /Tienes una cita/); assert.match(m.html, /Dónde<\/b>\nHospital &lt;Norte&gt;/); assert.match(m.html, /Es<\/b>\nhoy · 11:00/);
});

test("tarea con aviso", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "Llamar al banco"); await b.escribir(U, "hoy 12:00");
  b.canal.limpiar();
  avanzar(b, "2026-10-04T10:00:10Z");
  await correr(b);
  assert.match(b.canal.mensajes.find((x) => /banco/.test(x.html))!.html, /✅ <b>Llamar al banco<\/b>\n<i>Tienes una tarea pendiente/);
});

test("aviso retrasado: se marca si lleva más de 10 minutos y se descarta si es de hace más de un día", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e1 = await nuevaAlarma(b, "Uno", "hoy 9:00");
  const e2 = await nuevaAlarma(b, "Dos", "hoy 9:05");
  avanzar(b, "2026-10-04T07:20:00Z"); // 09:20
  await correr(b);
  assert.ok(b.canal.mensajes.find((m) => /Uno/.test(m.html))!.html.includes("aviso retrasado"));
  assert.ok(b.canal.mensajes.find((m) => /Dos/.test(m.html))!.html.includes("aviso retrasado"));
  const e3 = await nuevaAlarma(b, "Tres", "hoy 23:00");
  b.canal.limpiar();
  avanzar(b, "2026-10-06T10:00:00Z"); // dos días después
  const r = await correr(b);
  assert.equal(b.canal.mensajes.filter((m) => /Tres/.test(m.html)).length, 0); assert.ok(r.omitidos >= 1);
  assert.equal(prog(b, "evento", e3.id), undefined);
  void e1; void e2;
});

test("un evento borrado o una tarea hecha no avisan", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Borrada", "hoy 9:30");
  await b.almacen.borrarEvento(U, e.id); // borrado sin pasar por el bot: queda la programación huérfana
  const t = await nuevaAlarma(b, "Hecha", "hoy 9:31");
  await b.almacen.guardarEvento({ ...(await b.almacen.getEvento(U, t.id))!, hecho: true });
  avanzar(b, "2026-10-04T07:40:00Z");
  await correr(b);
  assert.equal(b.canal.mensajes.length, 0); assert.equal(b.almacen.programaciones.size, 0, "las programaciones huérfanas se limpian");
});

test("si Telegram falla al enviar un aviso se reintenta a los 2 minutos sin perderlo", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const e = await nuevaAlarma(b, "Importante", "hoy 9:30");
  b.canal.falla = () => new Error("502 Bad Gateway");
  avanzar(b, "2026-10-04T07:30:10Z");
  assert.equal((await correr(b)).fallidos, 1);
  const p = prog(b, "evento", e.id)!;
  assert.equal(p.intentos, 1); assert.equal(local(p.proximo), "2026-10-04 09:32");
  assert.equal((await b.almacen.getEvento(U, e.id))!.avisado, false);
  b.canal.falla = undefined;
  b.reloj.ahora = new Date("2026-10-04T07:32:30Z");
  assert.equal((await correr(b)).enviados, 1);
  assert.match(b.canal.ultimo(U).html, /Importante/); assert.equal(prog(b, "evento", e.id), undefined);
});

test("alarma en otra zona horaria: suena a la hora local del usuario", async () => {
  const b = await usuarioListo();
  await sinResumenes(b);
  const u = (await b.almacen.getUsuario(U))!; u.zona = "America/Mexico_City"; await b.almacen.guardarUsuario(u);
  const e = await nuevaAlarma(b, "Allí", "mañana 9:00"); // en México aún es el día 3 por la noche
  assert.equal(prog(b, "evento", e.id)!.proximo.toISOString(), localAUtc(2026, 10, 4, 9, 0, "America/Mexico_City").toISOString());
  avanzar(b, "2026-10-04T15:00:30Z"); await correr(b);
  assert.ok(b.canal.mensajes.some((m) => /Allí/.test(m.html)));
});

test("no se programan avisos para eventos ya pasados (aunque se creen a mano)", async () => {
  const b = await usuarioListo();
  const base: Omit<Evento, "id"> = { uid: U, tipo: "alarma", titulo: "Vieja", lugar: "", fechaHora: new Date("2026-10-01T07:00:00Z"), antelacionMin: 0, repeticion: "diaria", avisado: false, hecho: false, creadoEn: new Date(0) };
  const { programarEvento } = await import("./programar");
  const ev = await programarEvento(b.almacen, { ...base, id: "x" }, MAD, b.reloj.ahora);
  assert.equal(local(ev.fechaHora!), "2026-10-04 09:00", "la repetición diaria se adelanta a la primera ocurrencia futura: hoy a las 09:00, que aún no ha llegado");
  const p = prog(b, "evento", "x")!; assert.equal(local(p.proximo), "2026-10-04 09:00");
  const unica = await programarEvento(b.almacen, { ...base, id: "y", repeticion: "ninguna" }, MAD, b.reloj.ahora);
  assert.equal(prog(b, "evento", unica.id), undefined);
});

test("si la ejecución muere a medias, el resumen no se pierde: queda alquilado 10 min y se reintenta", async () => {
  const b = await usuarioListo();
  avanzar(b, "2026-10-04T05:10:00Z"); // 07:10
  const original = b.canal.enviar.bind(b.canal);
  b.canal.enviar = () => new Promise<void>(() => undefined); // «se cuelga»: es como si Cloudflare matara la ejecución aquí
  void correr(b);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-04 07:20"); // alquilado, no perdido hasta mañana
  b.canal.enviar = original;
  avanzar(b, "2026-10-04T05:19:00Z");
  assert.deepEqual(await correr(b), { enviados: 0, omitidos: 0, fallidos: 0 }); // todavía alquilado: nadie lo duplica
  avanzar(b, "2026-10-04T05:21:00Z");
  const r = await correr(b);
  assert.equal(r.enviados >= 1, true); assert.ok(b.canal.textos(U).some((t) => t.includes("Noticia")));
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-05 07:10"); // y vuelve a su hora
});

test("si la ejecución muere a medias, la alarma tampoco se pierde", async () => {
  const b = await usuarioListo(); await sinResumenes(b);
  const e = await nuevaAlarma(b, "Pastilla", "hoy 9:00");
  avanzar(b, "2026-10-04T07:00:30Z"); // 09:00:30
  const original = b.canal.enviar.bind(b.canal);
  b.canal.enviar = () => new Promise<void>(() => undefined);
  void correr(b);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(prog(b, "evento", e.id), "el aviso sigue programado"); assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-04 09:10");
  b.canal.enviar = original;
  avanzar(b, "2026-10-04T07:11:00Z");
  await correr(b);
  assert.ok(b.canal.textos(U).some((t) => t.includes("Pastilla")));
  assert.equal(prog(b, "evento", e.id), undefined); // enviado: se borra
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { idProgramacion } from "./almacen";
import { Banco, crearBanco, geocodingFalso, previsionFalsa, rssFalso } from "./arnes";
import { contenidoDeSeccion, manejarEntrada } from "./bot/bot";
import { localAUtc, partesEnZona } from "./fechas";

const MAD = "Europe/Madrid";
const U = "42";
const AHORA = new Date("2026-10-04T08:00:00Z"); // domingo 10:00 en Madrid

const prog = (b: Banco, tipo: "seccion" | "evento", ref: string) => b.almacen.programaciones.get(idProgramacion(U, tipo, ref));
const local = (d: Date, z = MAD) => { const p = partesEnZona(d, z); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")} ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };
const evs = async (b: Banco) => (await b.almacen.listarEventos(U)).sort((a, c) => (a.fechaHora?.getTime() ?? 0) - (c.fechaHora?.getTime() ?? 0));
const textoUltimo = (b: Banco) => b.canal.ultimo(U).html;
const hayBoton = (b: Banco, t: string) => b.canal.botones(U).some((x) => x.texto.includes(t));

/** Usuario que ya terminó la configuración con noticias, agenda y mercados (lo que queda al omitirla). */
async function usuarioListo(b = crearBanco(AHORA)): Promise<Banco> {
  await b.escribir(U, "/start");
  await b.pulsar(U, "o:omitir");
  b.canal.limpiar();
  return b;
}

// =============== Asistente inicial ===============
test("/start inicia el asistente con la bienvenida y la opción de omitir", async () => {
  const b = crearBanco(AHORA);
  await b.escribir(U, "/start");
  assert.match(textoUltimo(b), /Soy tu agenda personal/);
  assert.deepEqual(b.canal.botones(U).map((x) => x.datos), ["o:sig", "o:omitir"]);
  assert.equal((await b.almacen.getUsuario(U))!.onboardingHecho, false);
});

test("asistente completo: intereses, aficiones, nombre, nacimiento y ciudad → secciones programadas", async () => {
  const b = crearBanco(AHORA);
  b.http.añadir("geocoding-api", geocodingFalso("Montoro"));
  await b.escribir(U, "/start");
  await b.pulsarTexto(U, "Empezar");
  assert.match(textoUltimo(b), /¿Qué quieres recibir\?/);
  assert.ok(hayBoton(b, "✅ 📰 Noticias") && hayBoton(b, "▫️ 🔮 Horóscopo"));
  await b.pulsar(U, "o:s:horoscopo"); // activa el horóscopo
  await b.pulsar(U, "o:s:mercados");  // y desactiva los mercados
  assert.ok(hayBoton(b, "✅ 🔮 Horóscopo") && hayBoton(b, "▫️ 📈 Mercados"));
  await b.pulsar(U, "o:sig");
  assert.match(textoUltimo(b), /¿Qué te interesa\?/);
  await b.pulsarTexto(U, "Fútbol");
  await b.pulsarTexto(U, "Motociclismo");
  await b.pulsarTexto(U, "Fútbol"); // lo desmarca
  assert.ok(hayBoton(b, "▫️ ⚽ Fútbol") && hayBoton(b, "✅ 🏍 Motociclismo"));
  await b.pulsar(U, "o:sig");
  await b.escribir(U, "ajedrez, pesca deportiva ,  ");
  assert.match(textoUltimo(b), /¿Cómo te llamo\?/);
  await b.escribir(U, "Ana");
  assert.match(textoUltimo(b), /fecha de nacimiento/);
  await b.escribir(U, "31/02/1990");
  assert.match(textoUltimo(b), /No he entendido la fecha/);
  await b.escribir(U, "05/04/1984");
  assert.match(textoUltimo(b), /municipio/);
  await b.escribir(U, "Montoro");
  assert.equal(b.canal.botones(U).length, 3); // dos resultados + «ninguna»
  await b.pulsar(U, "o:lugar:0");
  assert.match(textoUltimo(b), /¡Todo listo!/); assert.match(textoUltimo(b), /Horóscopo de ♈ Aries/); assert.match(textoUltimo(b), /Montoro/);
  assert.match(textoUltimo(b), /Ajedrez, Pesca deportiva|Motociclismo, Ajedrez, Pesca deportiva/);
  await b.pulsar(U, "o:fin");
  assert.match(textoUltimo(b), /Agenda Personal/); assert.match(textoUltimo(b), /Hola, Ana/);

  const u = (await b.almacen.getUsuario(U))!;
  assert.equal(u.onboardingHecho, true); assert.equal(u.estado, null); assert.equal(u.nombre, "Ana"); assert.equal(u.nacimiento, "1984-04-05");
  assert.deepEqual(u.ciudad, { nombre: "Montoro", provincia: "Córdoba", lat: 38.02409, lon: -4.38 }); assert.equal(u.zona, "Europe/Madrid");
  assert.deepEqual(Object.entries(u.secciones).filter(([, c]) => c.activa).map(([k]) => k).sort(), ["agenda", "horoscopo", "noticias", "tiempo"]);
  assert.deepEqual(u.temas.map((t) => [t.id, t.hora, t.activa]), [["motociclismo", "08:30", true], ["ajedrez", "08:35", true], ["pesca-deportiva", "08:40", true]]);
  // programaciones: una por sección/tema activo, a su hora en Madrid
  assert.equal(local(prog(b, "seccion", "tiempo")!.proximo), "2026-10-05 07:00"); // hoy a las 07:00 ya pasó
  assert.equal(local(prog(b, "seccion", "horoscopo")!.proximo), "2026-10-05 08:00");
  assert.equal(local(prog(b, "seccion", "tema:ajedrez")!.proximo), "2026-10-05 08:35");
  assert.equal(prog(b, "seccion", "mercados"), undefined);
  assert.equal(b.almacen.programaciones.size, 7);
});

test("omitir todo: entra en el menú con noticias, agenda y mercados (tiempo y horóscopo necesitan datos)", async () => {
  const b = crearBanco(AHORA);
  await b.escribir(U, "/start");
  await b.pulsar(U, "o:omitir");
  assert.match(textoUltimo(b), /Agenda Personal/);
  const u = (await b.almacen.getUsuario(U))!;
  assert.equal(u.onboardingHecho, true);
  assert.deepEqual(Object.entries(u.secciones).filter(([, c]) => c.activa).map(([k]) => k).sort(), ["agenda", "mercados", "noticias"]);
  assert.deepEqual([...b.almacen.programaciones.values()].map((p) => p.ref).sort(), ["agenda", "mercados", "noticias"]);
  assert.equal(local(prog(b, "seccion", "mercados")!.proximo), "2026-10-04 14:00"); // hoy a las 14:00 aún no ha pasado
});

test("omitir a mitad conserva lo ya escrito y deja las secciones por defecto", async () => {
  const b = crearBanco(AHORA);
  await b.escribir(U, "/start"); await b.pulsar(U, "o:sig");
  await b.pulsar(U, "o:sig"); await b.pulsar(U, "o:sig"); await b.pulsar(U, "o:sig"); // hasta «nombre»
  await b.escribir(U, "Luis");
  await b.pulsar(U, "o:omitir");
  const u = (await b.almacen.getUsuario(U))!;
  assert.equal(u.nombre, "Luis"); assert.equal(u.onboardingHecho, true);
  // Se pasó por la pantalla de intereses sin tocarla: valen las que venían marcadas (noticias, agenda, mercados y tiempo)…
  assert.deepEqual(Object.entries(u.secciones).filter(([, c]) => c.activa).map(([k]) => k).sort(), ["agenda", "mercados", "noticias"]);
  assert.equal(u.secciones.tiempo.activa, false, "…salvo el tiempo, que sin ciudad no se activa");
});

test("el asistente tolera una ciudad que no existe, un fallo de red y 'ninguna'", async () => {
  const b = crearBanco(AHORA);
  await b.escribir(U, "/start");
  for (let i = 0; i < 6; i++) await b.pulsar(U, "o:sig"); // hasta «ciudad»
  assert.match(textoUltimo(b), /municipio/);
  b.http.añadir("geocoding-api", { results: [] });
  await b.escribir(U, "Zzzz"); assert.match(textoUltimo(b), /No encuentro ese municipio/);
  b.http.añadir("geocoding-api", new Error("timeout"));
  await b.escribir(U, "Montoro"); assert.match(textoUltimo(b), /No he podido buscar/);
  b.http.añadir("geocoding-api", geocodingFalso());
  await b.escribir(U, "Montoro");
  await b.pulsarTexto(U, "Ninguna"); // pasa al resumen sin ciudad
  assert.match(textoUltimo(b), /¡Todo listo!/);
  await b.pulsar(U, "o:fin");
  assert.equal((await b.almacen.getUsuario(U))!.ciudad, null);
});

test("cualquier mensaje de un usuario nuevo inicia el asistente; un botón antiguo también", async () => {
  const b = crearBanco(AHORA);
  await b.escribir("7", "hola");
  assert.match(b.canal.ultimo("7").html, /Soy tu agenda personal/);
  const c = crearBanco(AHORA);
  await c.pulsar("8", "e:lista");
  assert.match(c.canal.ultimo("8").html, /Soy tu agenda personal/);
});

// =============== Menús y resúmenes ===============
test("menú principal, ayuda, comandos y texto suelto", async () => {
  const b = await usuarioListo();
  await b.escribir(U, "/menu");
  assert.deepEqual(b.canal.botones(U).map((x) => x.datos), ["m:hoy", "n:menu", "e:lista", "s:lista", "p:ver", "m:ayuda"]);
  await b.escribir(U, "/ayuda"); assert.match(textoUltimo(b), /Comandos/);
  await b.escribir(U, "/hoy"); assert.match(textoUltimo(b), /Resumen de hoy/);
  await b.escribir(U, "blablabla"); assert.match(textoUltimo(b), /Usa el menú/);
  await b.escribir(U, "/nueva"); assert.match(textoUltimo(b), /¿Qué quieres crear\?/);
  await b.escribir(U, "/eventos"); assert.match(textoUltimo(b), /Mis eventos/);
  await b.escribir(U, "/secciones"); assert.match(textoUltimo(b), /Mis secciones/);
  await b.escribir(U, "/perfil"); assert.match(textoUltimo(b), /Tu perfil/);
  await b.escribir(U, "/menu@MiBot"); assert.match(textoUltimo(b), /Agenda Personal/);
});

test("el resumen de hoy muestra las secciones y envía cada una; un fallo no rompe el bot", async () => {
  const b = await usuarioListo();
  b.http.añadir("news.google.com", rssFalso("Noticia", 5));
  await b.pulsar(U, "m:hoy");
  assert.ok(hayBoton(b, "Noticias") && hayBoton(b, "Todo lo activado"));
  await b.pulsar(U, "sec:noticias");
  assert.match(textoUltimo(b), /Noticias del día/);
  b.http.añadir("news.google.com", new Error("caído"));
  await b.pulsar(U, "sec:noticias"); // la caché (30 min) todavía responde sin llamar a Google
  assert.match(textoUltimo(b), /Noticias del día/);
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 31 * 60_000); // caduca la caché y ya no hay datos
  await b.pulsar(U, "sec:noticias");
  assert.match(textoUltimo(b), /No he podido obtener esa información/);
  assert.ok(hayBoton(b, "Menú"));
  b.canal.limpiar();
  b.http.añadir("news.google.com", rssFalso("Noticia", 5));
  await b.pulsar(U, "sec:todo"); // noticias + agenda + mercados (Yahoo no está definido en el test: ese mensaje es el de error)
  assert.equal(b.canal.mensajes.length, 4); // tarjeta de resumen + 3 secciones
  assert.match(b.canal.mensajes[0].html, /Tu resumen de hoy/);
});

test("la vista del tiempo se navega editando el mismo mensaje", async () => {
  const b = await usuarioListo();
  b.http.añadir("api.open-meteo.com", previsionFalsa("2026-10-04", "2026-10-05")).añadir("historical", new Error("x"));
  const u = (await b.almacen.getUsuario(U))!; u.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 38, lon: -4 }; await b.almacen.guardarUsuario(u);
  await b.pulsar(U, "sec:tiempo");
  const id = b.canal.ultimo(U).id;
  await b.pulsar(U, "sev:tiempo:horas");
  assert.equal(b.canal.ultimo(U).editado, id); assert.match(textoUltimo(b), /Hora a hora/);
  await b.pulsar(U, "sev:tiempo:luna"); assert.match(textoUltimo(b), /Calendario lunar/);
  await b.pulsar(U, "sev:tiempo"); assert.match(textoUltimo(b), /Tiempo · Montoro/);
});

// =============== Crear eventos ===============
test("alarma diaria: título, fecha escrita y repetición → guardada y programada", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:menu"); await b.pulsar(U, "n:tipo:alarma");
  assert.match(textoUltimo(b), /Nueva alarma/);
  await b.escribir(U, "Tomar la pastilla");
  assert.match(textoUltimo(b), /¿Cuándo\?/);
  await b.escribir(U, "cuando pueda"); assert.match(textoUltimo(b), /No he entendido la fecha/);
  await b.escribir(U, "hoy 8:00"); assert.match(textoUltimo(b), /ya ha pasado/);
  await b.escribir(U, "mañana 9:30");
  assert.match(textoUltimo(b), /¿Se repite\?/);
  await b.pulsar(U, "n:rep:diaria");
  assert.match(textoUltimo(b), /Guardado/); assert.match(textoUltimo(b), /Tomar la pastilla/); assert.match(textoUltimo(b), /Se repite<\/b>\ncada día/);
  const [e] = await evs(b);
  assert.equal(e.tipo, "alarma"); assert.equal(local(e.fechaHora!), "2026-10-05 09:30"); assert.equal(e.repeticion, "diaria"); assert.equal(e.antelacionMin, 0);
  assert.equal(prog(b, "evento", e.id)!.proximo.getTime(), e.fechaHora!.getTime());
  assert.equal((await b.almacen.getUsuario(U))!.estado, null);
});

test("cita: lugar con HTML, antelación de un día y aviso programado un día antes", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:cita");
  await b.escribir(U, "Cardiología");
  await b.escribir(U, "15/10 18:00");
  assert.match(textoUltimo(b), /¿Dónde es\?/);
  await b.escribir(U, "Hospital <Reina Sofía>");
  assert.match(textoUltimo(b), /antelación/);
  await b.pulsar(U, "n:ant:1440");
  assert.match(textoUltimo(b), /Aviso<\/b>\n1 día antes/); assert.match(textoUltimo(b), /Hospital &lt;Reina Sofía&gt;/);
  const [e] = await evs(b);
  assert.equal(local(e.fechaHora!), "2026-10-15 18:00"); assert.equal(e.lugar, "Hospital <Reina Sofía>");
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-14 18:00");
});

test("cita con el aviso previo ya pasado: avisa a la hora del evento y lo explica", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:cita"); await b.escribir(U, "Dentista"); await b.escribir(U, "hoy 12:00");
  await b.pulsar(U, "n:skip"); // sin lugar
  await b.pulsar(U, "n:ant:1440");
  assert.match(textoUltimo(b), /ya habría pasado/);
  const [e] = await evs(b);
  assert.equal(e.antelacionMin, 0); assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-04 12:00");
});

test("tarea con atajo de fecha y tarea sin fecha", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "Llamar al fontanero");
  await b.pulsar(U, "n:t:m9"); // «Mañana 9:00»
  assert.match(textoUltimo(b), /Guardado/);
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "Comprar pan");
  await b.pulsar(U, "n:sinfecha");
  assert.match(textoUltimo(b), /Sin fecha: no habrá aviso/);
  const todas = await evs(b);
  const a = todas.find((x) => x.titulo === "Llamar al fontanero")!, c = todas.find((x) => x.titulo === "Comprar pan")!;
  assert.equal(local(a.fechaHora!), "2026-10-05 09:00"); assert.ok(prog(b, "evento", a.id));
  assert.equal(c.fechaHora, null); assert.equal(prog(b, "evento", c.id), undefined);
});

test("sin hora se usa las 09:00 y se avisa", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "Revisar el coche"); await b.escribir(U, "viernes");
  assert.ok(b.canal.textos(U).some((t) => /uso las 09:00/.test(t)));
  assert.equal(local((await evs(b))[0].fechaHora!), "2026-10-09 09:00");
});

test("cancelar durante la creación no guarda nada; un botón de una creación terminada vuelve al menú", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:alarma"); await b.escribir(U, "Algo");
  await b.pulsar(U, "x:cancelar");
  assert.match(textoUltimo(b), /Cancelado/); assert.equal((await evs(b)).length, 0); assert.equal((await b.almacen.getUsuario(U))!.estado, null);
  await b.pulsar(U, "n:rep:diaria"); assert.match(textoUltimo(b), /¿Qué quieres crear\?/);
  await b.pulsar(U, "n:tipo:alarma"); await b.escribir(U, "/cancelar"); assert.match(textoUltimo(b), /Cancelado/);
});

// =============== Ver, editar y eliminar ===============
async function conCita(b: Banco) {
  await b.pulsar(U, "n:tipo:cita"); await b.escribir(U, "Cardiología"); await b.escribir(U, "mañana 11:00"); await b.escribir(U, "Hospital"); await b.pulsar(U, "n:ant:60");
  b.canal.limpiar();
  return (await evs(b))[0];
}

test("lista de eventos y detalle con todas las acciones", async () => {
  const b = await usuarioListo();
  assert.match((await (async () => { await b.pulsar(U, "e:lista"); return textoUltimo(b); })()), /Todavía no tienes alarmas/);
  const e = await conCita(b);
  await b.pulsar(U, "e:lista");
  assert.match(textoUltimo(b), /1 próximo/); assert.ok(hayBoton(b, "mañana · 11:00 · Cardiología"));
  await b.pulsar(U, `e:ver:${e.id}`);
  assert.match(textoUltimo(b), /Cardiología/); assert.match(textoUltimo(b), /Dónde<\/b>\nHospital/); assert.match(textoUltimo(b), /Aviso<\/b>\n1 h antes/);
  for (const t of ["Título", "Fecha y hora", "Lugar", "Antelación", "Repetición", "Eliminar"]) assert.ok(hayBoton(b, t), t);
});

test("modificar título, fecha, lugar, antelación y repetición reprograma el aviso", async () => {
  const b = await usuarioListo();
  const e = await conCita(b);
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-05 10:00");
  await b.pulsar(U, `e:ed:titulo:${e.id}`); await b.escribir(U, "Cardiología (revisión)");
  assert.match(textoUltimo(b), /Actualizado/); assert.match(textoUltimo(b), /revisión/);
  await b.pulsar(U, `e:ed:cuando:${e.id}`); await b.escribir(U, "lunes 12:30");
  assert.equal(local((await evs(b))[0].fechaHora!), "2026-10-05 12:30"); assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-05 11:30");
  await b.pulsar(U, `e:ed:lugar:${e.id}`); await b.escribir(U, "Clínica Vista");
  assert.equal((await evs(b))[0].lugar, "Clínica Vista");
  await b.pulsar(U, `e:ed:ant:${e.id}`); await b.pulsar(U, `e:ant:180:${e.id}`);
  assert.equal(local(prog(b, "evento", e.id)!.proximo), "2026-10-05 09:30"); assert.match(textoUltimo(b), /3 h antes/);
  await b.pulsar(U, `e:ed:rep:${e.id}`); await b.pulsar(U, `e:rep:semanal:${e.id}`);
  assert.equal((await evs(b))[0].repeticion, "semanal"); assert.match(textoUltimo(b), /cada semana/);
});

test("editar con fecha inválida o pasada no cambia nada", async () => {
  const b = await usuarioListo();
  const e = await conCita(b);
  await b.pulsar(U, `e:ed:cuando:${e.id}`);
  await b.escribir(U, "???"); assert.match(textoUltimo(b), /No he entendido/);
  await b.escribir(U, "ayer 10:00"); assert.match(textoUltimo(b), /ya ha pasado/);
  assert.equal((await evs(b))[0].fechaHora!.getTime(), e.fechaHora!.getTime());
});

test("eliminar pide confirmación; confirmar borra el evento y su aviso; cancelar lo conserva", async () => {
  const b = await usuarioListo();
  const e = await conCita(b);
  await b.pulsar(U, `e:del:${e.id}`);
  assert.match(textoUltimo(b), /¿Eliminar\?<\/b>\n<i>Cardiología<\/i>/);
  await b.pulsarTexto(U, "Cancelar");
  assert.equal((await evs(b)).length, 1);
  await b.pulsar(U, `e:del:${e.id}`); await b.pulsar(U, `e:delok:${e.id}`);
  assert.match(textoUltimo(b), /Eliminado/); assert.equal((await evs(b)).length, 0); assert.equal(prog(b, "evento", e.id), undefined);
  await b.pulsar(U, `e:ver:${e.id}`); assert.match(textoUltimo(b), /ya no existe/);
});

test("tareas: marcar hecha y volver a pendiente quita y devuelve el aviso", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "Pagar la luz"); await b.pulsar(U, "n:t:m9");
  const t = (await evs(b))[0];
  await b.pulsar(U, `e:hecho:${t.id}`);
  assert.match(textoUltimo(b), /Hecha/); assert.equal(prog(b, "evento", t.id), undefined);
  await b.pulsar(U, `e:hecho:${t.id}`);
  assert.ok(prog(b, "evento", t.id)); assert.doesNotMatch(textoUltimo(b), /Hecha/);
});

// =============== Secciones y temas ===============
test("activar/desactivar secciones y cambiar su hora reprograma el envío", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "s:lista");
  assert.ok(hayBoton(b, "✅ 📰 Noticias · 07:10") && hayBoton(b, "▫️ 🌤 Tiempo · 07:00"));
  await b.pulsar(U, "s:tog:noticias");
  assert.match(textoUltimo(b), /Desactivada/); assert.equal(prog(b, "seccion", "noticias"), undefined);
  await b.pulsar(U, "s:tog:noticias"); assert.match(textoUltimo(b), /Activada/); assert.ok(prog(b, "seccion", "noticias"));
  await b.pulsar(U, "s:hora:noticias"); await b.escribir(U, "25:00"); assert.match(textoUltimo(b), /No he entendido la hora/);
  await b.escribir(U, "6h30".replace("h", ":"));
  assert.match(textoUltimo(b), /06:30/);
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo), "2026-10-05 06:30");
  assert.equal((await b.almacen.getUsuario(U))!.secciones.noticias.hora, "06:30");
});

test("activar el tiempo sin ciudad la pide y activa la sección al elegirla; igual con el horóscopo y la fecha", async () => {
  const b = await usuarioListo();
  b.http.añadir("geocoding-api", geocodingFalso());
  await b.pulsar(U, "s:tog:tiempo");
  assert.match(textoUltimo(b), /¿Dónde vives\?/); assert.equal((await b.almacen.getUsuario(U))!.secciones.tiempo.activa, false);
  await b.escribir(U, "Montoro"); await b.pulsar(U, "p:lugar:0");
  assert.match(textoUltimo(b), /¡Listo!<\/b>[\s\S]*Ciudad<\/b>\nMontoro/);
  assert.equal((await b.almacen.getUsuario(U))!.secciones.tiempo.activa, true); assert.ok(prog(b, "seccion", "tiempo"));
  await b.pulsar(U, "s:tog:horoscopo"); assert.match(textoUltimo(b), /fecha de nacimiento/);
  await b.escribir(U, "05/04/1984");
  assert.equal((await b.almacen.getUsuario(U))!.secciones.horoscopo.activa, true); assert.ok(prog(b, "seccion", "horoscopo"));
});

test("añadir un tema: nombre y búsqueda; nombres repetidos no chocan; eliminar lo quita", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "s:tema+"); await b.escribir(U, "Ajedrez");
  assert.match(textoUltimo(b), /¿Qué busco\?/);
  await b.escribir(U, "ajedrez OR Magnus Carlsen");
  assert.match(textoUltimo(b), /Tema añadido<\/b>\n<i>Ajedrez<\/i>/);
  let u = (await b.almacen.getUsuario(U))!;
  assert.deepEqual(u.temas.map((t) => [t.id, t.consulta, t.hora]), [["ajedrez", "ajedrez OR Magnus Carlsen", "08:30"]]);
  assert.equal(local(prog(b, "seccion", "tema:ajedrez")!.proximo), "2026-10-05 08:30");
  await b.pulsar(U, "s:tema+"); await b.escribir(U, "ajedrez"); await b.pulsar(U, "s:temaskip"); // «Usar el nombre»
  u = (await b.almacen.getUsuario(U))!;
  assert.deepEqual(u.temas.map((t) => t.id), ["ajedrez", "ajedrez-2"]); assert.equal(u.temas[1].consulta, "ajedrez");
  await b.pulsar(U, "s:temadel:ajedrez"); await b.pulsar(U, "s:temadelok:ajedrez");
  assert.deepEqual((await b.almacen.getUsuario(U))!.temas.map((t) => t.id), ["ajedrez-2"]); assert.equal(prog(b, "seccion", "tema:ajedrez"), undefined);
});

test("un tema con un nombre larguísimo no rompe los límites de los botones de Telegram", async () => {
  const b = await usuarioListo();
  const largo = "Energías renovables y transición ecológica en el sur de Europa 2026";
  await b.pulsar(U, "s:tema+"); await b.escribir(U, largo); await b.escribir(U, "energías renovables");
  const t = (await b.almacen.getUsuario(U))!.temas[0];
  assert.ok(t.titulo.length <= 40 && t.id.length <= 40);
  await b.pulsar(U, "s:lista"); await b.pulsar(U, `s:ver:tema:${t.id}`); await b.pulsar(U, `s:temadel:${t.id}`); await b.pulsar(U, `s:temadelok:${t.id}`);
  await b.pulsar(U, "m:hoy");
  assert.equal(b.canal.violaciones.length, 0);
});

// =============== Perfil ===============
test("cambiar de ciudad actualiza la zona horaria y reprograma las secciones a la nueva hora local", async () => {
  const b = await usuarioListo();
  const u0 = (await b.almacen.getUsuario(U))!; u0.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 1, lon: 1 }; u0.secciones.tiempo.activa = true; await b.almacen.guardarUsuario(u0);
  b.http.añadir("geocoding-api", geocodingFalso());
  await b.pulsar(U, "p:ciudad"); await b.escribir(U, "Ciudad de México");
  await b.pulsar(U, "p:lugar:1"); // México, UTC-6
  const u = (await b.almacen.getUsuario(U))!;
  assert.equal(u.zona, "America/Mexico_City");
  assert.equal(local(prog(b, "seccion", "noticias")!.proximo, "America/Mexico_City"), "2026-10-04 07:10"); // 02:00 allí: aún es hoy
});

test("perfil: nombre y nacimiento; fecha inválida se rechaza", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "p:ver"); assert.match(textoUltimo(b), /sin indicar/);
  await b.pulsar(U, "p:nombre"); await b.escribir(U, "<b>Luis</b>"); assert.match(textoUltimo(b), /Encantado, &lt;b&gt;Luis&lt;\/b&gt;/);
  await b.pulsar(U, "p:nacimiento"); await b.escribir(U, "1/1/2999"); assert.match(textoUltimo(b), /No he entendido la fecha/);
  await b.escribir(U, "20/08/1990");
  await b.pulsar(U, "p:ver"); assert.match(textoUltimo(b), /20\/08\/1990 · ♌ Leo/);
});

test("borrar mis datos: confirma, elimina todo y deja de programar; /start vuelve a empezar", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:tarea"); await b.escribir(U, "x"); await b.pulsar(U, "n:t:m9");
  assert.ok(b.almacen.programaciones.size > 0 && (await evs(b)).length === 1);
  await b.escribir(U, "/borrar"); assert.match(textoUltimo(b), /¿Borrar todos tus datos\?/);
  await b.pulsarTexto(U, "Cancelar"); assert.ok(await b.almacen.getUsuario(U));
  await b.pulsar(U, "p:borrar"); await b.pulsar(U, "p:borrarok");
  assert.match(textoUltimo(b), /Datos borrados/);
  assert.equal(await b.almacen.getUsuario(U), null); assert.equal((await evs(b)).length, 0); assert.equal(b.almacen.programaciones.size, 0);
  await b.escribir(U, "/start"); assert.match(textoUltimo(b), /Soy tu agenda personal/);
});

// =============== Robustez ===============
test("una actualización repetida de Telegram se ignora", async () => {
  const b = await usuarioListo();
  b.canal.limpiar();
  await manejarEntrada(b.deps, { chatId: U, nombre: "Ana", updateId: 500, texto: "/menu" });
  await manejarEntrada(b.deps, { chatId: U, nombre: "Ana", updateId: 500, texto: "/menu" });
  await manejarEntrada(b.deps, { chatId: U, nombre: "Ana", updateId: 499, texto: "/menu" });
  assert.equal(b.canal.mensajes.length, 1);
});

test("bloquear el bot desactiva al usuario y quita sus envíos; volver a escribir lo reactiva", async () => {
  const b = await usuarioListo();
  assert.ok(b.almacen.programaciones.size > 0);
  await manejarEntrada(b.deps, { chatId: U, nombre: "", updateId: 900, bloqueado: true });
  assert.equal((await b.almacen.getUsuario(U))!.activo, false); assert.equal(b.almacen.programaciones.size, 0);
  await manejarEntrada(b.deps, { chatId: "999", nombre: "", updateId: 1, bloqueado: true }); // usuario desconocido: sin efecto
  await manejarEntrada(b.deps, { chatId: U, nombre: "Ana", updateId: 901, texto: "/menu" });
  assert.equal((await b.almacen.getUsuario(U))!.activo, true); assert.ok(b.almacen.programaciones.size > 0);
});

test("un error interno no deja al usuario sin respuesta y la conversación sigue funcionando", async () => {
  const b = await usuarioListo();
  const original = b.almacen.listarEventos.bind(b.almacen);
  b.almacen.listarEventos = async () => { throw new Error("Firestore caído"); };
  await b.escribir(U, "/eventos");
  assert.match(textoUltimo(b), /Ha ocurrido un error/);
  b.almacen.listarEventos = original;
  await b.escribir(U, "/eventos"); assert.match(textoUltimo(b), /Mis eventos/);
});

test("botones con datos inventados o de otro flujo no rompen nada", async () => {
  const b = await usuarioListo();
  for (const d of ["noop", "zz:1", "e:ver", "e:ed:titulo", "s:ver:no-existe", "s:tog:no-existe", "p:lugar:9", "o:lugar:9", "sec:no-existe", "n:ant:60", "e:rep:diaria:nada"]) await b.pulsar(U, d);
  await b.escribir(U, "/menu"); assert.match(textoUltimo(b), /Agenda Personal/);
});

test("el texto de los usuarios se escapa siempre (no se puede inyectar HTML en los mensajes)", async () => {
  const b = await usuarioListo();
  await b.pulsar(U, "n:tipo:alarma"); await b.escribir(U, '<a href="http://malo">pulsa</a>'); await b.escribir(U, "mañana 9:00"); await b.pulsar(U, "n:rep:ninguna");
  for (const m of b.canal.mensajes) assert.doesNotMatch(m.html, /<a href="http:\/\/malo"/);
  assert.match(b.canal.textos(U).join("\n"), /&lt;a href=/);
  assert.equal((await evs(b))[0].titulo, '<a href="http://malo">pulsa</a>'.slice(0, 80));
});

test("fechas del bot usan la zona del usuario", async () => {
  const b = await usuarioListo();
  const u = (await b.almacen.getUsuario(U))!; u.zona = "America/New_York"; await b.almacen.guardarUsuario(u);
  await b.pulsar(U, "n:tipo:alarma"); await b.escribir(U, "x"); await b.escribir(U, "mañana 9:00"); await b.pulsar(U, "n:rep:ninguna");
  assert.equal((await evs(b))[0].fechaHora!.toISOString(), localAUtc(2026, 10, 5, 9, 0, "America/New_York").toISOString());
});

test("construcción remota: todas las secciones se piden a la vez, se envían en orden y un fallo ofrece «Reintentar» con el motivo", async () => {
  const b = await usuarioListo();
  b.http.añadir("news.google.com", rssFalso("Noticia", 5));
  const u = (await b.almacen.getUsuario(U))!;
  const pedidas: string[] = [];
  let fallar = "";
  b.deps.construirRemoto = async (p) => {
    pedidas.push(p.ref);
    if (p.ref === fallar) throw new Error("HTTP 403 desde la fuente");
    await new Promise((r) => setTimeout(r, p.ref === "noticias" ? 30 : 1)); // la primera es la más lenta: aun así sale primera
    return contenidoDeSeccion(b.deps, u, p.ref);
  };
  b.canal.limpiar();
  await b.pulsar(U, "sec:todo");
  assert.deepEqual(pedidas, ["noticias", "agenda", "mercados"]); // se piden todas antes de enviar
  const t = b.canal.textos(U);
  assert.match(t[0], /Tu resumen de hoy/); assert.match(t[1], /Noticias del día/); assert.match(t[2], /Tu agenda/); // en orden
  // fallo de una sección: motivo y botón de reintentar; el resto sigue
  fallar = "agenda"; b.canal.limpiar();
  await b.pulsar(U, "sec:todo");
  const t2 = b.canal.textos(U);
  assert.match(t2[1], /Noticias del día/); assert.match(t2[2], /No he podido obtener[\s\S]*HTTP 403 desde la fuente/);
  assert.ok(b.canal.mensajes[2].teclado!.flat().some((x) => x.datos === "sec:agenda" && /Reintentar/.test(x.texto)));
  // una sección suelta y la navegación dentro de ella (editar el mensaje)
  fallar = ""; b.canal.limpiar();
  await b.pulsar(U, "sec:agenda"); await b.pulsar(U, "sev:agenda");
  assert.equal(b.canal.mensajes[0].editado, undefined); assert.equal(b.canal.mensajes[1].editado !== undefined, true);
});

test("el horóscopo se pide al momento si la tarea diaria aún no lo ha guardado, y se guarda para los demás", async () => {
  const b = await usuarioListo();
  const u = (await b.almacen.getUsuario(U))!; u.nacimiento = "1990-04-05"; await b.almacen.guardarUsuario(u);
  const llamadas: string[] = [];
  b.http.añadir("horoscopefree.test", (() => { llamadas.push("pedido"); return { sign: "aries", date: "2026-10-04", language: "es", text: "Un buen día para empezar.", source: "https://www.20minutos.es/horoscopo/aries/", cached: false }; }));
  b.deps.horoscopoCfg = { baseUrl: "https://horoscopefree.test", idioma: "es" };
  b.canal.limpiar();
  await b.pulsar(U, "sec:horoscopo");
  assert.match(textoUltimo(b), /Un buen día para empezar/); assert.equal(llamadas.length, 1);
  assert.equal((await b.almacen.getHoroscopo("aries"))?.fecha, "2026-10-04"); // guardado
  await b.pulsar(U, "sec:horoscopo"); assert.equal(llamadas.length, 1); // la segunda vez ya no se pide
  // si la fuente falla y no hay nada guardado, se dice sin romper
  const b2 = await usuarioListo(); const u2 = (await b2.almacen.getUsuario(U))!; u2.nacimiento = "1990-04-05"; await b2.almacen.guardarUsuario(u2);
  b2.http.añadir("horoscopefree.test", new Error("caído")); b2.deps.horoscopoCfg = { baseUrl: "https://horoscopefree.test", idioma: "es" };
  await b2.pulsar(U, "sec:horoscopo"); assert.match(textoUltimo(b2), /Todavía no hay horóscopo/);
});

test("/diagnostico comprueba cada fuente y dice cuáles responden y cuáles no", async () => {
  const b = await usuarioListo();
  b.http.añadir("api.open-meteo.com", { current: {} }).añadir("news.google.com", rssFalso("Noticia", 7)).añadir("finance.yahoo.com", Object.assign(new Error("Request failed"), { response: { status: 429 } }));
  b.http.añadir("horoscopefree.test", { text: "x" }); b.deps.horoscopoCfg = { baseUrl: "https://horoscopefree.test", idioma: "es" };
  await b.escribir(U, "/diagnostico");
  const t = textoUltimo(b);
  assert.match(t, /✅ <b>Open-Meteo/); assert.match(t, /✅ <b>Google News[\s\S]*7 noticias/); assert.match(t, /❌ <b>Yahoo Finance[\s\S]*HTTP 429/); assert.match(t, /✅ <b>horoscopefree/);
  assert.match(t, /0 de 12/);
});

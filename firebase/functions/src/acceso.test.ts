import { test } from "node:test";
import assert from "node:assert/strict";
import { Banco, crearBanco, rssFalso } from "./arnes";
import { leerActualizacion, CanalTelegram } from "./telegram";
import { tick } from "./scheduler";
import { idProgramacion } from "./almacen";

const ADMIN = "1", AMIGA = "20", OTRO = "30";
const texto = (b: Banco, chat: string) => b.canal.ultimo(chat)?.html ?? "";
const botones = (b: Banco, chat: string) => b.canal.botones(chat);
const conAdmin = (): Banco => { const b = crearBanco(new Date("2026-10-04T04:00:00Z")); b.deps.adminId = ADMIN; b.http.añadir("news.google.com", rssFalso("Noticia", 3)); return b; };
const codigoDe = (url: string) => /start=inv_([A-Za-z0-9]+)/.exec(url)![1];

test("sin administrador configurado el bot sigue abierto (y /miid funciona para averiguar el número)", async () => {
  const b = crearBanco();
  await b.escribir(AMIGA, "/miid"); assert.match(texto(b, AMIGA), new RegExp(`<code>${AMIGA}</code>`));
  assert.equal(await b.almacen.getUsuario(AMIGA), null); // /miid no registra a nadie
  await b.escribir(AMIGA, "/start"); assert.match(texto(b, AMIGA), /Soy tu agenda personal/); // abierto: cualquiera entra
  await b.escribir(AMIGA, "/invitar"); assert.doesNotMatch(texto(b, AMIGA), /Invitación creada/); // los comandos de administrador no existen sin administrador
});

test("con administrador, quien no está autorizado solo ve «Bot privado» y no se guarda nada suyo", async () => {
  const b = conAdmin();
  await b.escribir(AMIGA, "/start", "Ana");
  assert.match(texto(b, AMIGA), /Bot privado/); assert.ok(botones(b, AMIGA).some((x) => x.datos === "acc:pedir"));
  await b.escribir(AMIGA, "hola"); assert.match(texto(b, AMIGA), /Bot privado/);
  await b.pulsar(AMIGA, "m:menu"); await b.pulsar(AMIGA, "sec:noticias"); await b.pulsar(AMIGA, "acc:inv"); await b.escribir(AMIGA, "/invitar"); await b.escribir(AMIGA, "/diagnostico");
  assert.equal(await b.almacen.getUsuario(AMIGA), null); assert.equal(await b.almacen.getAcceso(AMIGA), null); assert.equal(b.almacen.invitaciones.size, 0);
  assert.ok(b.canal.textos(AMIGA).every((t) => /Bot privado/.test(t)), "todo lo que recibe es el aviso de bot privado");
  await b.escribir(AMIGA, "/miid"); assert.match(texto(b, AMIGA), /Tu ID de Telegram/); // /miid sí
});

test("el administrador entra solo, ve el botón «Acceso» y los demás no", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/start", "Juan"); await b.pulsar(ADMIN, "o:omitir");
  assert.equal((await b.almacen.getAcceso(ADMIN))!.rol, "admin");
  await b.escribir(ADMIN, "/menu"); assert.ok(botones(b, ADMIN).some((x) => x.datos === "acc:menu"));
  await b.pulsar(ADMIN, "acc:menu"); assert.match(texto(b, ADMIN), /Solicitudes pendientes/); assert.match(texto(b, ADMIN), /Personas con acceso/);
  await b.almacen.guardarAcceso({ id: AMIGA, rol: "usuario", nombre: "Ana", desde: new Date() });
  await b.escribir(AMIGA, "/start", "Ana"); await b.pulsar(AMIGA, "o:omitir"); await b.escribir(AMIGA, "/menu");
  assert.ok(!botones(b, AMIGA).some((x) => x.datos === "acc:menu")); // un usuario normal no ve «Acceso»
  await b.pulsar(AMIGA, "acc:inv"); await b.escribir(AMIGA, "/usuarios"); assert.equal(b.almacen.invitaciones.size, 0); // y sus comandos no hacen nada
});

test("solicitud de acceso: el administrador recibe el aviso con Aprobar/Rechazar y no se duplica", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/start", "Juan");
  await b.escribir(AMIGA, "/start", "Ana");
  await b.pulsar(AMIGA, "acc:pedir");
  assert.match(texto(b, AMIGA), /Solicitud enviada/);
  assert.equal((await b.almacen.getSolicitud(AMIGA))!.estado, "pendiente");
  const aviso = b.canal.ultimo(ADMIN)!; assert.match(aviso.html, /Solicitud de acceso/); assert.match(aviso.html, new RegExp(`Ana[\\s\\S]*<code>${AMIGA}</code>`));
  assert.deepEqual(botones(b, ADMIN).map((x) => x.datos), [`acc:ok:${AMIGA}`, `acc:no:${AMIGA}`]);
  const avisos = b.canal.textos(ADMIN).length;
  await b.pulsar(AMIGA, "acc:pedir"); await b.escribir(AMIGA, "hola"); // insiste
  assert.match(texto(b, AMIGA), /Solicitud pendiente/); assert.equal(b.canal.textos(ADMIN).length, avisos); // el administrador no recibe un segundo aviso
  assert.equal(b.almacen.solicitudes.size, 1);
});

test("aprobar: se envía una invitación personal con enlace; solo vale para esa persona y una vez", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/start", "Juan");
  await b.escribir(AMIGA, "/start", "Ana"); await b.pulsar(AMIGA, "acc:pedir");
  await b.escribir(OTRO, "/start", "Otro"); // otra persona, sin solicitud
  await b.pulsar(ADMIN, `acc:ok:${AMIGA}`);
  const invitacion = b.canal.ultimo(AMIGA)!;
  assert.match(invitacion.html, /Solicitud aprobada/);
  const url = invitacion.teclado!.flat().find((x) => x.url)!.url!;
  assert.match(url, /^https:\/\/t\.me\/agenda_test_bot\?start=inv_[A-Za-z0-9]{14}$/);
  assert.match(b.canal.ultimo(ADMIN)!.html, /Invitación enviada/); assert.equal(b.almacen.solicitudes.size, 0); assert.equal((await b.almacen.listarSolicitudes()).length, 0);
  const codigo = codigoDe(url);
  assert.equal((await b.almacen.getAcceso(AMIGA)), null); // todavía no ha entrado
  // otra persona con el mismo enlace: no vale (es personal)
  await b.escribir(OTRO, `/start inv_${codigo}`, "Otro"); assert.match(texto(b, OTRO), /Invitación no válida/); assert.equal(await b.almacen.getAcceso(OTRO), null);
  // la destinataria entra
  await b.escribir(AMIGA, `/start inv_${codigo}`, "Ana");
  assert.equal((await b.almacen.getAcceso(AMIGA))!.rol, "usuario");
  assert.match(texto(b, AMIGA), /Soy tu agenda personal/); // y empieza el asistente
  assert.match(b.canal.ultimo(ADMIN)!.html, /Ana[\s\S]*ha entrado con una invitación/);
  // y la invitación ya no sirve
  await b.almacen.borrarAcceso(AMIGA);
  await b.escribir(AMIGA, `/start inv_${codigo}`, "Ana"); assert.match(texto(b, AMIGA), /Invitación no válida/);
});

test("rechazar: se le avisa, no puede volver a pedirlo, y el administrador aún puede invitarle", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/start", "Juan");
  await b.escribir(AMIGA, "/start", "Ana"); await b.pulsar(AMIGA, "acc:pedir");
  await b.pulsar(ADMIN, `acc:no:${AMIGA}`);
  assert.match(texto(b, AMIGA), /Solicitud no aprobada/); assert.match(texto(b, ADMIN), /Solicitud rechazada/);
  assert.equal((await b.almacen.getSolicitud(AMIGA))!.estado, "rechazada");
  const avisos = b.canal.textos(ADMIN).length;
  await b.pulsar(AMIGA, "acc:pedir"); await b.escribir(AMIGA, "/start");
  assert.match(texto(b, AMIGA), /no ha sido aprobada/); assert.equal(b.canal.textos(ADMIN).length, avisos); // no insiste al administrador
  assert.equal(await b.almacen.getAcceso(AMIGA), null);
  await b.pulsar(ADMIN, `acc:ok:${AMIGA}`); assert.match(texto(b, ADMIN), /ya no está pendiente/); // una rechazada ya no se aprueba desde la solicitud
  await b.escribir(ADMIN, "/invitar"); // pero puede invitarle con un enlace
  const url = /https:\/\/t\.me\/\S+/.exec(texto(b, ADMIN))![0];
  await b.escribir(AMIGA, `/start inv_${codigoDe(url)}`, "Ana");
  assert.equal((await b.almacen.getAcceso(AMIGA))!.rol, "usuario"); assert.equal(await b.almacen.getSolicitud(AMIGA), null);
});

test("/invitar: enlace de un solo uso que caduca a los 7 días", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/invitar");
  assert.match(texto(b, ADMIN), /Invitación creada/); assert.match(texto(b, ADMIN), /Vale para una persona/);
  const [inv] = [...b.almacen.invitaciones.values()];
  assert.equal(inv.para, undefined); assert.equal(inv.caduca.getTime() - b.reloj.ahora.getTime(), 7 * 86_400_000);
  const codigo = inv.codigo;
  await b.escribir(AMIGA, `/start inv_${codigo}`, "Ana"); assert.equal((await b.almacen.getAcceso(AMIGA))!.rol, "usuario");
  await b.escribir(OTRO, `/start inv_${codigo}`, "Otro"); assert.match(texto(b, OTRO), /Invitación no válida/); // un solo uso
  await b.escribir(ADMIN, "/invitar"); const cad = [...b.almacen.invitaciones.keys()][0];
  b.reloj.ahora = new Date(b.reloj.ahora.getTime() + 8 * 86_400_000);
  await b.escribir(OTRO, `/start inv_${cad}`, "Otro"); assert.match(texto(b, OTRO), /Invitación no válida/); assert.equal(await b.almacen.getAcceso(OTRO), null); // caducada
  await b.escribir(OTRO, "/start inv_inventado123", "Otro"); assert.match(texto(b, OTRO), /Invitación no válida/); // código falso
});

test("/usuarios y /solicitudes: lista con botones; quitar acceso pide confirmación, borra sus datos y le deja fuera", async () => {
  const b = conAdmin();
  await b.escribir(ADMIN, "/start", "Juan");
  await b.almacen.guardarAcceso({ id: AMIGA, rol: "usuario", nombre: "Ana", desde: new Date() });
  await b.escribir(AMIGA, "/start", "Ana"); await b.pulsar(AMIGA, "o:omitir");
  await b.escribir(AMIGA, "/nueva"); await b.pulsar(AMIGA, "n:tipo:tarea"); await b.escribir(AMIGA, "Llamar"); await b.pulsar(AMIGA, "n:sinfecha");
  assert.ok((await b.almacen.listarEventos(AMIGA)).length === 1 && [...b.almacen.programaciones.values()].some((p) => p.uid === AMIGA));
  await b.escribir(ADMIN, "/solicitudes"); assert.match(texto(b, ADMIN), /No hay ninguna pendiente/);
  await b.escribir(ADMIN, "/usuarios");
  assert.match(texto(b, ADMIN), /👑[\s\S]*Juan[\s\S]*tú/); assert.match(texto(b, ADMIN), /👤[\s\S]*Ana/);
  assert.deepEqual(botones(b, ADMIN).filter((x) => x.datos?.startsWith("acc:del")).map((x) => x.datos), [`acc:del:${AMIGA}`]); // al administrador no se le puede quitar
  await b.pulsar(ADMIN, `acc:del:${AMIGA}`); assert.match(texto(b, ADMIN), /¿Quitar el acceso\?/);
  assert.ok(await b.almacen.getAcceso(AMIGA)); // todavía no: falta confirmar
  await b.pulsar(ADMIN, `acc:delok:${AMIGA}`);
  assert.equal(await b.almacen.getAcceso(AMIGA), null); assert.equal(await b.almacen.getUsuario(AMIGA), null); assert.deepEqual(await b.almacen.listarEventos(AMIGA), []);
  assert.ok(![...b.almacen.programaciones.values()].some((p) => p.uid === AMIGA));
  assert.ok(b.canal.textos(AMIGA).some((t) => /Acceso retirado/.test(t)));
  await b.escribir(AMIGA, "/start", "Ana"); assert.match(texto(b, AMIGA), /Bot privado/); // ya no entra
  await b.pulsar(ADMIN, `acc:delok:${ADMIN}`); assert.equal((await b.almacen.getAcceso(ADMIN))!.rol, "admin"); // el administrador no puede quitarse
  await b.escribir(ADMIN, "/solicitudes"); // con solicitudes: una por mensaje con sus botones
  await b.escribir(OTRO, "/start", "Otro"); await b.pulsar(OTRO, "acc:pedir"); b.canal.limpiar();
  await b.escribir(ADMIN, "/solicitudes"); assert.deepEqual(botones(b, ADMIN).map((x) => x.datos), [`acc:ok:${OTRO}`, `acc:no:${OTRO}`]);
});

test("los envíos programados solo llegan a quien tiene acceso (el administrador siempre)", async () => {
  const b = crearBanco(new Date("2026-10-04T04:00:00Z")); b.http.añadir("news.google.com", rssFalso("Noticia", 3));
  for (const id of [ADMIN, AMIGA, OTRO]) { await b.escribir(id, "/start", id); await b.pulsar(id, "o:omitir"); } // bot aún abierto: los tres tienen resúmenes programados
  b.deps.adminId = ADMIN; // se activa el control de acceso
  await b.almacen.guardarAcceso({ id: AMIGA, rol: "usuario", nombre: "Ana", desde: new Date() }); // el administrador no hace falta (no tiene fila)
  b.canal.limpiar(); b.reloj.ahora = new Date("2026-10-04T05:11:00Z"); // 07:11: toca noticias
  const r = await tick({ almacen: b.almacen, canal: b.canal, http: b.http, ahora: () => b.reloj.ahora, adminId: ADMIN });
  assert.ok(r.enviados >= 2);
  assert.ok(b.canal.textos(ADMIN).some((t) => /Noticia/.test(t))); assert.ok(b.canal.textos(AMIGA).some((t) => /Noticia/.test(t)));
  assert.deepEqual(b.canal.textos(OTRO), []); // sin acceso: nada
  assert.ok(!b.almacen.programaciones.has(idProgramacion(OTRO, "seccion", "noticias"))); // y la que le tocaba se le quita (las demás, cuando les toque)
  b.reloj.ahora = new Date("2026-10-04T13:00:00Z"); // 15:00: ya han tocado todas
  await tick({ almacen: b.almacen, canal: b.canal, http: b.http, ahora: () => b.reloj.ahora, adminId: ADMIN });
  assert.ok(![...b.almacen.programaciones.values()].some((p) => p.uid === OTRO)); assert.deepEqual(b.canal.textos(OTRO), []);
  assert.ok(b.almacen.programaciones.has(idProgramacion(ADMIN, "seccion", "noticias")));
});

test("Telegram: la actualización trae el @usuario y el bot conoce su propio nombre (getMe) sin pedirlo cada vez", async () => {
  const e = leerActualizacion({ update_id: 1, message: { chat: { id: 7, type: "private" }, from: { first_name: "Ana", username: "ana_g" }, text: "hola" } })!;
  assert.equal(e.usuario, "ana_g");
  assert.equal(leerActualizacion({ update_id: 2, callback_query: { id: "c", data: "x", from: { first_name: "Ana", username: "ana_g" }, message: { message_id: 3, chat: { id: 7, type: "private" } } } })!.usuario, "ana_g");
  let llamadas = 0;
  const canal = new CanalTelegram("T", { post: async (url: string) => { llamadas++; assert.ok(url.endsWith("/getMe")); return { data: { ok: true, result: { username: "Informacion_relevante_bot" } } }; } });
  assert.equal(await canal.nombreUsuario(), "Informacion_relevante_bot"); assert.equal(await canal.nombreUsuario(), "Informacion_relevante_bot"); assert.equal(llamadas, 1);
});

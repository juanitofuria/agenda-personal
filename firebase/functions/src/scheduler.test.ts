import { test } from "node:test";
import assert from "node:assert/strict";
import { AlmacenMemoria, idProgramacion } from "./almacen";
import { usuarioNuevo } from "./modelo";
import { tick } from "./scheduler";

const AHORA = new Date("2026-10-04T08:00:00Z");

test("el planificador envía recordatorios por Web Push y marca los avisos entregados", async () => {
  const almacen = new AlmacenMemoria();
  const usuario = usuarioNuevo("uid-ana", "Ana", AHORA);
  usuario.notificaciones.suscripciones = [{ endpoint: "https://push.example/device", p256dh: "key", auth: "secret", dispositivo: "PC", desde: AHORA.toISOString() }];
  await almacen.guardarUsuario(usuario);
  const evento = await almacen.guardarEvento({
    uid: usuario.id, tipo: "cita", titulo: "Dentista", lugar: "", fechaHora: AHORA,
    antelacionMin: 0, repeticion: "ninguna", avisado: false, hecho: false, creadoEn: AHORA,
  });
  await almacen.guardarProgramacion({ id: idProgramacion(usuario.id, "evento", evento.id), uid: usuario.id, tipo: "evento", ref: evento.id, proximo: AHORA });

  const avisos: { titulo: string; url: string }[] = [];
  const resultado = await tick({
    almacen, ahora: () => AHORA,
    push: async (_suscripcion, aviso) => { avisos.push({ titulo: aviso.titulo, url: aviso.url }); return "ok"; },
  });

  assert.deepEqual(resultado, { enviados: 1, omitidos: 0, fallidos: 0 });
  assert.deepEqual(avisos, [{ titulo: "🩺 Dentista", url: "/app/?ir=cita" }]);
  assert.equal((await almacen.getEvento(usuario.id, evento.id))?.avisado, true);
});

test("el planificador conserva una programación fallida para reintentar", async () => {
  const almacen = new AlmacenMemoria();
  const usuario = usuarioNuevo("uid-ana", "Ana", AHORA);
  usuario.notificaciones.suscripciones = [{ endpoint: "https://push.example/device", p256dh: "key", auth: "secret", dispositivo: "PC", desde: AHORA.toISOString() }];
  await almacen.guardarUsuario(usuario);
  const evento = await almacen.guardarEvento({
    uid: usuario.id, tipo: "alarma", titulo: "Medicamento", lugar: "", fechaHora: AHORA,
    antelacionMin: 0, repeticion: "ninguna", avisado: false, hecho: false, creadoEn: AHORA,
  });
  const id = idProgramacion(usuario.id, "evento", evento.id);
  await almacen.guardarProgramacion({ id, uid: usuario.id, tipo: "evento", ref: evento.id, proximo: AHORA });

  const resultado = await tick({ almacen, ahora: () => AHORA, push: async () => "error" });
  assert.equal(resultado.fallidos, 1);
  assert.equal((await almacen.programacionesVencidas(new Date(AHORA.getTime() + 2 * 60_000), 1))[0].id, id);
});

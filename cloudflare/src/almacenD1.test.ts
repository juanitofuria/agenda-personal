import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AlmacenD1 } from "./almacenD1";
import { d1Sqlite } from "./d1sqlite";
import { Env, Fabrica, manejarFetch } from "./app";
import { usuarioNuevo } from "../../firebase/functions/src/modelo";
import { idProgramacion } from "../../firebase/functions/src/almacen";

const ESQUEMA = readFileSync(join(__dirname, "..", "..", "..", "schema.sql"), "utf8");
const nuevo = () => { const db = d1Sqlite(ESQUEMA); return { db, almacen: new AlmacenD1(db) }; };
const AHORA = new Date("2026-10-04T08:00:00Z");
const FIREBASE = {
  apiKey: "web-api-key",
  authDomain: "bexora-agenda-personal.firebaseapp.com",
  appId: "1:91393495192:web:example",
  messagingSenderId: "91393495192",
  projectId: "bexora-agenda-personal",
  storageBucket: "bexora-agenda-personal.firebasestorage.app",
};
const fabrica: Fabrica = () => ({ http: { get: async () => ({ data: "" }) } });
const env = (db: ReturnType<typeof d1Sqlite>): Env => ({
  DB: db,
  APP_ORIGINS: "https://bexora-agenda-personal.web.app",
  FIREBASE_WEB_CONFIG: FIREBASE,
});

test("D1 conserva los datos web del usuario, eventos y programaciones", async () => {
  const { almacen } = nuevo();
  const usuario = usuarioNuevo("firebase-uid", "Ana", AHORA);
  usuario.nacimiento = "1990-05-17";
  await almacen.guardarUsuario(usuario);
  assert.deepEqual(await almacen.getUsuario(usuario.id), usuario);

  const evento = await almacen.guardarEvento({
    uid: usuario.id, tipo: "tarea", titulo: "Comprar", lugar: "", fechaHora: null,
    antelacionMin: 0, repeticion: "ninguna", avisado: false, hecho: false, creadoEn: AHORA,
  });
  const programacion = { id: idProgramacion(usuario.id, "evento", evento.id), uid: usuario.id, tipo: "evento" as const, ref: evento.id, proximo: AHORA };
  await almacen.guardarProgramacion(programacion);
  assert.equal((await almacen.programacionesVencidas(AHORA, 1))[0].ref, evento.id);
  await almacen.borrarUsuario(usuario.id);
  assert.equal(await almacen.getUsuario(usuario.id), null);
  assert.deepEqual(await almacen.listarEventos(usuario.id), []);
  assert.deepEqual(await almacen.programacionesVencidas(AHORA, 1), []);
});

test("la API valida Firebase, crea el perfil inicial y devuelve el estado del usuario", async () => {
  const { db, almacen } = nuevo();
  const e = env(db);
  const verificar = async (token: string, project: string) =>
    token === "valido" && project === FIREBASE.projectId ? { uid: "uid-ana", nombre: "Ana", email: "ana@example.com" } : null;
  const post = (ruta: string, authorization?: string) => manejarFetch(new Request(`https://agenda.example${ruta}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) },
    body: "{}",
  }), e, undefined, fabrica, verificar);

  assert.equal((await post("/api/estado")).status, 401);
  assert.equal((await post("/api/estado", "Bearer invalido")).status, 401);
  const response = await post("/api/estado", "Bearer valido");
  assert.equal(response.status, 200);
  const body = await response.json() as { usuario: { nombre: string } };
  assert.equal(body.usuario.nombre, "Ana");
  assert.equal((await almacen.getUsuario("uid-ana"))?.nombre, "Ana");
});

test("la configuración y el preflight CORS solo admiten el sitio configurado", async () => {
  const { db } = nuevo();
  const e = env(db);
  const request = (origin: string, method: string) => manejarFetch(new Request("https://agenda.example/api/config", {
    method,
    headers: { origin, ...(method === "OPTIONS" ? { "access-control-request-method": "GET" } : {}) },
  }), e);

  const preflight = await request("https://bexora-agenda-personal.web.app", "OPTIONS");
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://bexora-agenda-personal.web.app");
  assert.equal(preflight.headers.get("access-control-allow-methods"), "GET, OPTIONS");
  assert.equal((await request("https://sitio-no-autorizado.example", "OPTIONS")).status, 403);
  const config = await request("https://bexora-agenda-personal.web.app", "GET");
  assert.equal(config.status, 200);
  assert.deepEqual(await config.json(), { firebase: FIREBASE });
});

test("la lista compartida sigue accesible por token", async () => {
  const { db, almacen } = nuevo();
  const e = env(db);
  const usuario = usuarioNuevo("uid-ana", "Ana", AHORA);
  usuario.compra.items = [{ id: "a1", texto: "Leche", hecho: false }];
  usuario.compra.token = "abcdefghijkmnpqrst";
  await almacen.guardarUsuario(usuario);
  await almacen.cacheSet("lista:abcdefghijkmnpqrst", usuario.id, 3_600_000, new Date());
  const lista = await manejarFetch(new Request("https://agenda.example/api/lista", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: usuario.compra.token, accion: "estado" }),
  }), e, undefined, fabrica);
  assert.equal(lista.status, 200);
  assert.deepEqual((await lista.json() as { items: { texto: string }[] }).items.map((item) => item.texto), ["Leche"]);
});

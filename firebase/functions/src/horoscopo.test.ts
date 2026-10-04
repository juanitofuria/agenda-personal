import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SIGNOS, actualizarTodos, comoErrorApi, construirDoc, ErrorApi, fechaEnZona, nombreFuente, obtenerSigno,
  reintentar, urlHoroscopo, urlSegura, Config, Http, HoroscopoDoc, RespuestaApi,
} from "./horoscopo";

const cfg: Config = { baseUrl: "https://horoscopefree.example/", idioma: "es" };
const FUENTE = "https://www.20minutos.es/horoscopo/aries/";

/** Respuesta con la forma documentada por horoscopefree. */
const ok = (fecha: string, extra: Partial<RespuestaApi> = {}): RespuestaApi => ({
  sign: "aries", date: fecha, language: "es", text: "Hoy es un buen día para empezar algo nuevo.", source: FUENTE, cached: false, ...extra,
});

/** Error con la forma que tiene el de axios: response.status y response.data { error, message }. */
const errHttp = (status: number, error: string, message = "detalle") =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: { error, message } } });

function fakeHttp(rutas: (url: string) => unknown) {
  const llamadas: string[] = [];
  const http: Http = {
    async get(url) {
      llamadas.push(url);
      const r = rutas(url);
      if (r instanceof Error) throw r;
      return { data: r };
    },
  };
  return { http, llamadas };
}

test("fechaEnZona usa la zona de los usuarios y no la del servidor", () => {
  const instante = new Date("2026-10-03T22:30:00Z"); // 00:30 del día 4 en Madrid
  assert.equal(fechaEnZona(instante, "Europe/Madrid"), "2026-10-04");
  assert.equal(fechaEnZona(instante, "UTC"), "2026-10-03");
});

test("hay 12 signos con ids únicos sin tildes y nombres en inglés válidos para la API", () => {
  assert.equal(SIGNOS.length, 12);
  assert.equal(new Set(SIGNOS.map((s) => s.id)).size, 12);
  assert.ok(SIGNOS.every((s) => /^[a-z]+$/.test(s.id) && /^[a-z]+$/.test(s.ingles)));
  assert.deepEqual(SIGNOS.map((s) => s.ingles), ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]);
});

test("urlHoroscopo: GET /horoscope/{idioma}/{signo}/{fecha} con el signo en inglés", () => {
  assert.equal(urlHoroscopo(cfg, SIGNOS.find((s) => s.id === "escorpio")!, "2026-10-04"), "https://horoscopefree.example/horoscope/es/scorpio/2026-10-04");
});

test("nombreFuente y urlSegura", () => {
  assert.equal(nombreFuente(FUENTE), "20minutos.es");
  assert.equal(nombreFuente("no es url"), "no es url");
  assert.equal(urlSegura(FUENTE), FUENTE);
  assert.equal(urlSegura("javascript:alert(1)"), "");
  assert.equal(urlSegura("file:///etc/passwd"), "");
  assert.equal(urlSegura(undefined), "");
  assert.equal(urlSegura(42), "");
});

test("comoErrorApi lee el código y el mensaje de la API, y clasifica transitorios", () => {
  const e400 = comoErrorApi(errHttp(400, "VALIDATION", "future date"));
  assert.equal(e400.estado, 400); assert.equal(e400.codigo, "VALIDATION"); assert.match(e400.message, /future date/); assert.equal(e400.transitorio, false);
  assert.equal(comoErrorApi(errHttp(404, "NOT_FOUND")).transitorio, false);
  assert.equal(comoErrorApi(errHttp(502, "NETWORK")).transitorio, true);
  assert.equal(comoErrorApi(errHttp(502, "PARSE")).transitorio, true);
  assert.equal(comoErrorApi(new Error("timeout of 30000ms exceeded")).transitorio, true); // sin respuesta
});

test("reintentar repite los fallos transitorios pero no los errores 4xx", async () => {
  let n = 0;
  assert.equal(await reintentar(async () => { if (++n < 3) throw errHttp(502, "NETWORK"); return "ok"; }, 3, 0), "ok");
  assert.equal(n, 3);
  let m = 0;
  await assert.rejects(reintentar(async () => { m++; throw errHttp(400, "VALIDATION"); }, 3, 0), (e: ErrorApi) => e.codigo === "VALIDATION");
  assert.equal(m, 1, "un 400 no se reintenta");
  await assert.rejects(reintentar(async () => { throw errHttp(502, "NETWORK"); }, 2, 0), /NETWORK/);
});

test("obtenerSigno devuelve la respuesta y rechaza lo que no es un objeto", async () => {
  const { http, llamadas } = fakeHttp(() => ok("2026-10-04"));
  const r = await obtenerSigno(http, cfg, SIGNOS[1], "2026-10-04", 1, 0);
  assert.equal(r.text, "Hoy es un buen día para empezar algo nuevo.");
  assert.deepEqual(llamadas, ["https://horoscopefree.example/horoscope/es/taurus/2026-10-04"]);
  await assert.rejects(obtenerSigno(fakeHttp(() => "<html>").http, cfg, SIGNOS[0], "2026-10-04", 1, 0), /no válida/);
});

test("construirDoc: texto, fecha, idioma y fuente con URL", () => {
  const doc = construirDoc(SIGNOS[0], "2026-10-04", ok("2026-10-04"), cfg, new Date("2026-10-04T04:00:00Z"))!;
  assert.deepEqual(doc, {
    signo: "aries", fecha: "2026-10-04", prediccion: "Hoy es un buen día para empezar algo nuevo.", idioma: "es",
    fuente: "20minutos.es", fuenteUrl: FUENTE, actualizadoEn: "2026-10-04T04:00:00.000Z",
  });
});

test("construirDoc: sin texto no hay documento; fecha rara usa la pedida; URL peligrosa se descarta", () => {
  assert.equal(construirDoc(SIGNOS[0], "2026-10-04", ok("2026-10-04", { text: "   " }), cfg), null);
  assert.equal(construirDoc(SIGNOS[0], "2026-10-04", {}, cfg), null);
  assert.equal(construirDoc(SIGNOS[0], "2026-10-04", ok("ayer"), cfg)!.fecha, "2026-10-04");
  const d = construirDoc(SIGNOS[0], "2026-10-04", ok("2026-10-04", { source: "javascript:alert(1)" }), cfg)!;
  assert.equal(d.fuenteUrl, ""); assert.equal(d.fuente, "");
});

function deps(rutas: (u: string) => unknown, extra: Record<string, unknown> = {}) {
  const guardados = new Map<string, HoroscopoDoc>();
  const { http, llamadas } = fakeHttp(rutas);
  return {
    guardados, llamadas,
    dep: {
      http, config: cfg, zona: "Europe/Madrid", ahora: new Date("2026-10-04T04:00:00Z"), intentos: 1, esperaMs: 0,
      guardar: async (id: string, d: HoroscopoDoc) => { guardados.set(id, d); }, ...extra,
    },
  };
}

test("actualizarTodos guarda los 12 signos con 12 peticiones y la fecha de Madrid", async () => {
  const { dep, guardados, llamadas } = deps(() => ok("2026-10-04"));
  const r = await actualizarTodos(dep);
  assert.equal(r.actualizados.length, 12); assert.equal(r.fallidos.length, 0);
  assert.equal(guardados.size, 12); assert.equal(llamadas.length, 12);
  assert.ok(llamadas.every((u) => u.endsWith("/2026-10-04")));
  assert.ok(llamadas.some((u) => u.includes("/scorpio/")) && llamadas.some((u) => u.includes("/sagittarius/")));
  assert.equal(guardados.get("escorpio")!.fecha, "2026-10-04");
});

test("actualizarTodos pide la fecha de los usuarios (Madrid), no la de UTC", async () => {
  // 22:30Z del día 3 = 00:30 del día 4 en Madrid: la fecha de los usuarios es el 4.
  const { dep, llamadas } = deps(() => ok("2026-10-04"), { ahora: new Date("2026-10-03T22:30:00Z") });
  await actualizarTodos(dep);
  assert.ok(llamadas.every((u) => u.endsWith("/2026-10-04")));
});

test("actualizarTodos: los signos que ya están al día no se vuelven a pedir", async () => {
  const { dep, llamadas, guardados } = deps(() => ok("2026-10-04"), { fechaGuardada: async (id: string) => (id === "leo" || id === "aries" ? "2026-10-04" : "2026-10-03") });
  const r = await actualizarTodos(dep);
  assert.deepEqual(r.alDia.sort(), ["aries", "leo"]); assert.equal(r.actualizados.length, 10);
  assert.equal(llamadas.length, 10); assert.ok(!guardados.has("leo"));
});

test("actualizarTodos: un signo caído no impide actualizar los demás", async () => {
  const { dep, guardados } = deps((u) => (u.includes("/leo/") ? errHttp(502, "PARSE", "selector") : ok("2026-10-04")));
  const r = await actualizarTodos(dep);
  assert.deepEqual(r.fallidos, ["leo"]); assert.equal(r.actualizados.length, 11); assert.ok(!guardados.has("leo"));
});

test("actualizarTodos: si el editor aún no ha publicado el de hoy no se guarda nada ni se pisa el anterior", async () => {
  const { dep, guardados, llamadas } = deps(() => errHttp(502, "NETWORK", "upstream 404"));
  const r = await actualizarTodos({ ...dep, intentos: 2 });
  assert.equal(r.fallidos.length, 12); assert.equal(guardados.size, 0);
  assert.equal(llamadas.length, 24, "cada signo se reintenta una vez");
});

test("actualizarTodos: un 400 (config o fecha mal) no se reintenta", async () => {
  const { dep, llamadas } = deps(() => errHttp(400, "VALIDATION", "future date"));
  const r = await actualizarTodos({ ...dep, intentos: 3 });
  assert.equal(r.fallidos.length, 12); assert.equal(llamadas.length, 12);
});

test("actualizarTodos: una respuesta sin texto no se guarda (no pisa el último bueno)", async () => {
  const { dep, guardados } = deps((u) => (u.includes("/libra/") ? ok("2026-10-04", { text: "" }) : ok("2026-10-04")));
  const r = await actualizarTodos(dep);
  assert.deepEqual(r.fallidos, ["libra"]); assert.ok(!guardados.has("libra"));
});

test("actualizarTodos: no sustituye un documento por otro más antiguo", async () => {
  const { dep, guardados } = deps(() => ok("2026-10-02"), { fechaGuardada: async () => "2026-10-03" });
  const r = await actualizarTodos(dep);
  assert.equal(r.omitidos.length, 12); assert.equal(guardados.size, 0);
});

test("maxPedidos limita los signos pedidos por ejecución y el resto queda para la siguiente", async () => {
  const guardados = new Map<string, HoroscopoDoc>();
  const llamadas: string[] = [];
  const http: Http = { get: async (url: string) => { llamadas.push(url); return { data: ok("2026-10-04") }; } };
  const dep = { http, config: { baseUrl: "https://h.test", idioma: "es" }, zona: "Europe/Madrid", ahora: new Date("2026-10-04T06:00:00Z"), esperaMs: 0,
    guardar: async (id: string, doc: HoroscopoDoc) => { guardados.set(id, doc); }, fechaGuardada: async (id: string) => guardados.get(id)?.fecha, maxPedidos: 5 };
  const r1 = await actualizarTodos(dep);
  assert.equal(llamadas.length, 5); assert.equal(r1.actualizados.length, 5);
  const r2 = await actualizarTodos(dep);
  assert.equal(r2.alDia.length, 5); assert.equal(r2.actualizados.length, 5);
  const r3 = await actualizarTodos(dep);
  assert.equal(r3.actualizados.length, 2); assert.equal(guardados.size, 12);
  assert.equal(llamadas.length, 12);
});

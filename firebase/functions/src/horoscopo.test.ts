import { test } from "node:test";
import assert from "node:assert/strict";
import { leerPagina20min, obtenerSigno20min, urlSigno20min } from "./horoscopo20min";
import {
  obtenerHoroscopo, SIGNOS, actualizarTodos, comoErrorApi, construirDoc, ErrorApi, fechaEnZona, nombreFuente, obtenerSigno,
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

// ---------- 20minutos.es directo ----------
// Página de ejemplo con la misma estructura que la real (texto inventado): un primer bloque `.prediction` de descripción
// y un segundo con el archivo fechado: <p class="date"><a>7  abril de 2026</a></p> + <div>texto</div>.
const TEXTO_HOY = "Hoy conviene que te tomes las cosas con calma, sobre todo en lo que se refiere al trabajo. Por la tarde mejorará el ánimo.";
const TEXTO_AYER = "Comienza una semana intensa en la que tendrás que organizarte bien para llegar a todo lo que te has propuesto hacer.";
const pagina20min = (hoy = "7  abril de 2026") => `<html><body>
<div class="prediction aries"><h2>Aries</h2><p>Descripción general del signo, que no es una predicción del día.</p></div>
<div class="prediction" style="margin-top: 10px;"><h2>Últimas predicciones</h2>
<p class="date" style="margin-bottom: 4px;"><a href="https://www.20minutos.es/x/07/04/2026/">${hoy}</a></p>
<div style="padding-bottom: 1em;">${TEXTO_HOY}</div><p class="date" style="margin-bottom: 4px;"><a href="https://www.20minutos.es/x/06/04/2026/">6  abril de 2026</a></p>
<div style="padding-bottom: 1em;">${TEXTO_AYER} &amp; más</div><p class="date"><a>5  abril de 2026</a></p><div>corto</div></div></body></html>`;
const aries = SIGNOS[0];

test("20minutos: lee las entradas fechadas, ignora el bloque de descripción y los textos demasiado cortos", () => {
  const e = leerPagina20min(pagina20min());
  assert.deepEqual(e.map((x) => x.fecha), ["2026-04-07", "2026-04-06"]); // la de «corto» se descarta
  assert.equal(e[0].texto, TEXTO_HOY); assert.match(e[1].texto, /& más$/); // entidades decodificadas
  assert.deepEqual(leerPagina20min("<html>nada</html>"), []);
  assert.deepEqual(leerPagina20min('<div class="prediction">solo uno</div>'), []);
});

test("20minutos: pide la página del signo, elige la fecha pedida o, si aún no está, la más reciente con su fecha", async () => {
  const urls: string[] = [];
  const http: Http = { get: async (u: string, o) => { urls.push(`${u}|${o?.headers?.["User-Agent"] ? "UA" : "sin UA"}`); return { data: pagina20min() }; } };
  const r = await obtenerSigno20min(http, SIGNOS[2], "2026-04-06");
  assert.equal(urls[0], "https://www.20minutos.es/horoscopo/geminis/|UA"); assert.equal(urlSigno20min(aries), "https://www.20minutos.es/horoscopo/aries/");
  assert.equal(r.date, "2026-04-06"); assert.match(r.text!, /semana intensa/); assert.equal(r.source, "https://www.20minutos.es/horoscopo/geminis/"); assert.equal(r.language, "es");
  const sinHoy = await obtenerSigno20min(http, aries, "2026-04-08"); // el de hoy aún no está publicado
  assert.equal(sinHoy.date, "2026-04-07"); assert.equal(sinHoy.text, TEXTO_HOY);
  for (const [datos, patron] of [[123, /no válida/], ["<html>vacía</html>", /no he encontrado/]] as const)
    await assert.rejects(obtenerSigno20min({ get: async () => ({ data: datos }) }, aries, "2026-04-07"), patron);
  await assert.rejects(obtenerSigno20min({ get: async () => { throw errHttp(403, "x"); } }, aries, "2026-04-07"), /HTTP 403/);
});

test("obtenerHoroscopo: con `directo` va a 20minutos y solo usa horoscopefree si falla; sin `directo` o en otro idioma, solo horoscopefree", async () => {
  const llamadas: string[] = [];
  const mixto = (fallaDirecto: boolean, fallaApi = false): Http => ({ get: async (u: string) => {
    llamadas.push(u.includes("20minutos") ? "20min" : "api");
    if (u.includes("20minutos")) { if (fallaDirecto) throw errHttp(503, "x"); return { data: pagina20min() }; }
    if (fallaApi) throw errHttp(525, "x");
    return { data: ok("2026-04-07", { text: "Texto del servicio horoscopefree, suficientemente largo para valer como predicción del día." }) };
  } });
  const cfgDirecto: Config = { ...cfg, directo: true };
  assert.match((await obtenerHoroscopo(mixto(false), cfgDirecto, aries, "2026-04-07", 1, 0)).text!, /conviene que te tomes/); assert.deepEqual(llamadas, ["20min"]);
  llamadas.length = 0;
  assert.match((await obtenerHoroscopo(mixto(true), cfgDirecto, aries, "2026-04-07", 1, 0)).text!, /horoscopefree/); assert.deepEqual(llamadas, ["20min", "api"]);
  llamadas.length = 0;
  await assert.rejects(obtenerHoroscopo(mixto(true, true), cfgDirecto, aries, "2026-04-07", 1, 0), /20minutos: HTTP 503; horoscopefree: HTTP 525/);
  llamadas.length = 0;
  await obtenerHoroscopo(mixto(false), cfg, aries, "2026-04-07", 1, 0); assert.deepEqual(llamadas, ["api"]); // sin `directo`
  llamadas.length = 0;
  await obtenerHoroscopo(mixto(false), { ...cfgDirecto, idioma: "en" }, aries, "2026-04-07", 1, 0); assert.deepEqual(llamadas, ["api"]); // 20minutos solo en español
});

test("actualizarTodos con `directo` guarda lo de 20minutos y no depende de horoscopefree", async () => {
  const guardados = new Map<string, HoroscopoDoc>(); const urls: string[] = [];
  const http: Http = { get: async (u: string) => { urls.push(u); if (!u.includes("20minutos")) throw errHttp(525, "caído"); return { data: pagina20min() }; } };
  const r = await actualizarTodos({ http, config: { ...cfg, directo: true }, zona: "UTC", ahora: new Date("2026-04-07T08:00:00Z"), esperaMs: 0, intentos: 1,
    guardar: async (id, doc) => { guardados.set(id, doc); }, fechaGuardada: async (id) => guardados.get(id)?.fecha });
  assert.equal(r.actualizados.length, 12); assert.equal(r.fallidos.length, 0);
  assert.ok(urls.every((u) => u.includes("20minutos.es/horoscopo/")));
  assert.equal(guardados.get("aries")!.fecha, "2026-04-07"); assert.equal(guardados.get("aries")!.fuente, "20minutos.es");
});

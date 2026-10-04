import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SIGNOS, actualizarTodos, compatibilidadEs, construirDoc, fechaEnZona, formatearHora, obtenerSigno,
  parseFechaAztro, reintentar, Config, Http, HoroscopoDoc, AztroRespuesta,
} from "./horoscopo";

const cfg: Config = { baseUrl: "https://aztro.example/", pathPlantilla: "/?sign={signo}&day={dia}" };
const respuesta = (fecha: string, extra: Partial<AztroRespuesta> = {}): AztroRespuesta => ({
  current_date: fecha, compatibility: "Libra", lucky_time: "2pm", lucky_number: "17", color: "Magenta", date_range: "Mar 21 - Apr 20",
  mood: "Relaxed", description: "Today you feel bold.", ...extra,
});

/** Http de prueba: responde según un mapa url -> respuesta (o error) y anota las llamadas. */
function fakeHttp(rutas: (url: string) => unknown) {
  const llamadas: string[] = [];
  const http: Http = {
    async post(url) {
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

test("parseFechaAztro", () => {
  assert.equal(parseFechaAztro("October 4, 2026"), "2026-10-04");
  assert.equal(parseFechaAztro("January 15, 2027"), "2027-01-15");
  assert.equal(parseFechaAztro("basura"), null);
  assert.equal(parseFechaAztro(undefined), null);
});

test("formatearHora", () => {
  assert.equal(formatearHora("2pm"), "14:00");
  assert.equal(formatearHora("12am"), "00:00");
  assert.equal(formatearHora("12pm"), "12:00");
  assert.equal(formatearHora("9:30 AM"), "09:30");
  assert.equal(formatearHora("por la tarde"), "por la tarde");
  assert.equal(formatearHora(undefined), "");
});

test("compatibilidad se traduce al español", () => {
  assert.equal(compatibilidadEs("Taurus"), "Tauro");
  assert.equal(compatibilidadEs("scorpio"), "Escorpio");
  assert.equal(compatibilidadEs("Ofiuco"), "Ofiuco");
});

test("hay 12 signos con ids únicos sin tildes", () => {
  assert.equal(SIGNOS.length, 12);
  assert.equal(new Set(SIGNOS.map((s) => s.id)).size, 12);
  assert.ok(SIGNOS.every((s) => /^[a-z]+$/.test(s.id)));
});

test("reintentar repite hasta que funciona y propaga el último error", async () => {
  let n = 0;
  assert.equal(await reintentar(async () => { if (++n < 3) throw new Error("x"); return "ok"; }, 3, 0), "ok");
  await assert.rejects(reintentar(async () => { throw new Error("siempre"); }, 2, 0), /siempre/);
});

test("obtenerSigno: usa POST con el nombre inglés del signo", async () => {
  const { http, llamadas } = fakeHttp(() => respuesta("October 4, 2026"));
  const r = await obtenerSigno(http, cfg, SIGNOS.find((s) => s.id === "tauro")!, "2026-10-04", 1, 0);
  assert.equal(r.fecha, "2026-10-04");
  assert.deepEqual(llamadas, ["https://aztro.example/?sign=taurus&day=today"]);
});

test("obtenerSigno: si 'today' de Aztro va un día por detrás pide 'tomorrow'", async () => {
  const { http, llamadas } = fakeHttp((u) => respuesta(u.endsWith("day=today") ? "October 3, 2026" : "October 4, 2026", { description: u.endsWith("day=today") ? "ayer" : "hoy" }));
  const r = await obtenerSigno(http, cfg, SIGNOS[0], "2026-10-04", 1, 0);
  assert.equal(r.fecha, "2026-10-04");
  assert.equal(r.data.description, "hoy");
  assert.equal(llamadas.length, 2);
});

test("obtenerSigno: si ninguna coincide guarda la de 'today' con su propia fecha", async () => {
  const { http } = fakeHttp(() => respuesta("October 2, 2026"));
  const r = await obtenerSigno(http, cfg, SIGNOS[0], "2026-10-04", 1, 0);
  assert.equal(r.fecha, "2026-10-02");
});

test("obtenerSigno: si 'tomorrow' falla se queda con 'today'", async () => {
  const { http } = fakeHttp((u) => (u.endsWith("day=today") ? respuesta("October 3, 2026") : new Error("caído")));
  const r = await obtenerSigno(http, cfg, SIGNOS[0], "2026-10-04", 1, 0);
  assert.equal(r.fecha, "2026-10-03");
});

test("construirDoc traduce texto, ánimo y color y marca idioma es", async () => {
  const traductor = async (t: string[]) => t.map((x) => `ES(${x.trim()})`);
  const doc = (await construirDoc(SIGNOS[0], "2026-10-04", respuesta("October 4, 2026"), traductor, new Date("2026-10-04T05:00:00Z")))!;
  assert.equal(doc.idioma, "es");
  assert.equal(doc.prediccion, "ES(Today you feel bold.)");
  assert.equal(doc.animo, "ES(Relaxed)"); assert.equal(doc.color, "ES(Magenta)");
  assert.equal(doc.prediccionOriginal, "Today you feel bold.");
  assert.equal(doc.horaSuerte, "14:00"); assert.equal(doc.compatibilidad, "Libra"); assert.equal(doc.numeroSuerte, "17");
  assert.equal(doc.signo, "aries"); assert.equal(doc.actualizadoEn, "2026-10-04T05:00:00.000Z");
});

test("construirDoc: si la traducción falla publica el original en inglés", async () => {
  const doc = (await construirDoc(SIGNOS[0], "2026-10-04", respuesta("October 4, 2026"), async () => { throw new Error("API desactivada"); }))!;
  assert.equal(doc.idioma, "en"); assert.equal(doc.prediccion, "Today you feel bold."); assert.equal(doc.animo, "Relaxed");
});

test("construirDoc: sin traductor queda en inglés; lucky_number numérico pasa a texto; sin texto no hay documento", async () => {
  const doc = (await construirDoc(SIGNOS[0], "2026-10-04", respuesta("x", { lucky_number: 7 })))!;
  assert.equal(doc.idioma, "en"); assert.equal(doc.numeroSuerte, "7");
  assert.equal(await construirDoc(SIGNOS[0], "2026-10-04", respuesta("x", { description: "   " })), null);
  assert.equal(await construirDoc(SIGNOS[0], "2026-10-04", {}), null);
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

test("actualizarTodos guarda los 12 signos con 12 peticiones", async () => {
  const { dep, guardados, llamadas } = deps(() => respuesta("October 4, 2026"));
  const r = await actualizarTodos(dep);
  assert.equal(r.actualizados.length, 12); assert.equal(r.fallidos.length, 0);
  assert.equal(guardados.size, 12); assert.equal(llamadas.length, 12);
  assert.ok(llamadas.some((u) => u.includes("sign=sagittarius")));
  assert.equal(guardados.get("escorpio")!.fecha, "2026-10-04");
});

test("actualizarTodos: un signo caído no impide actualizar los demás", async () => {
  const { dep, guardados } = deps((u) => (u.includes("sign=leo&") ? new Error("500") : respuesta("October 4, 2026")));
  const r = await actualizarTodos(dep);
  assert.deepEqual(r.fallidos, ["leo"]); assert.equal(r.actualizados.length, 11); assert.ok(!guardados.has("leo"));
});

test("actualizarTodos: una respuesta sin texto no se guarda (no pisa el último bueno)", async () => {
  const { dep, guardados } = deps((u) => (u.includes("sign=libra&") ? respuesta("October 4, 2026", { description: "" }) : respuesta("October 4, 2026")));
  const r = await actualizarTodos(dep);
  assert.deepEqual(r.fallidos, ["libra"]); assert.ok(!guardados.has("libra"));
});

test("actualizarTodos: no sustituye un documento por otro más antiguo", async () => {
  const { dep, guardados } = deps(() => respuesta("October 2, 2026"), { fechaGuardada: async () => "2026-10-03" });
  const r = await actualizarTodos(dep);
  assert.equal(r.omitidos.length, 12); assert.equal(guardados.size, 0);
});

test("actualizarTodos con traductor publica en español", async () => {
  const { dep, guardados } = deps(() => respuesta("October 4, 2026"), { traductor: async (t: string[]) => t.map((x) => `ES:${x.trim()}`) });
  await actualizarTodos(dep);
  assert.equal(guardados.get("aries")!.prediccion, "ES:Today you feel bold.");
  assert.equal(guardados.get("aries")!.idioma, "es");
});

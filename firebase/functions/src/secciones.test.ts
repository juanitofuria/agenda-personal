import { test } from "node:test";
import assert from "node:assert/strict";
import { crearBanco, geocodingFalso, graficoFalso, historicoFalso, previsionFalsa, rssFalso } from "./arnes";
import { fechaIso, localAUtc, partesEnZona } from "./fechas";
import { faseDelDia, iluminacion, proximoDia, proximoEvento } from "./luna";
import { usuarioNuevo } from "./modelo";
import { leerRss, lineaNoticia } from "./rss";
import { construirContenido } from "./secciones";
import { descTiempo, emojiTiempo, nivelUv, parsearPrevision, renderHoraAHora, renderLuna, tramosLluvia } from "./secciones/tiempo";
import { cotizacionActual, parsearGrafico, ultimaSesion } from "./secciones/mercados";
import { signoDe } from "./signos";
import { grados, num1, sparkline } from "./util";

const MAD = "Europe/Madrid";
const AHORA = new Date("2026-10-04T05:00:00Z"); // 07:00 en Madrid

// ---------- Luna ----------
test("luna: instantes de lunas nuevas y llenas conocidas (error < 15 min)", () => {
  const casos: [string, boolean][] = [
    ["2024-04-08T18:21:00Z", false], ["2024-04-23T23:49:00Z", true], ["2024-05-08T03:22:00Z", false],
    ["2025-12-04T23:14:00Z", true], ["2026-03-03T11:38:00Z", true], ["2026-08-12T17:37:00Z", false],
  ];
  for (const [iso, llena] of casos) {
    const esperado = new Date(iso);
    const calculado = proximoEvento(new Date(esperado.getTime() - 3 * 86_400_000), llena);
    const min = Math.abs(calculado.getTime() - esperado.getTime()) / 60_000;
    assert.ok(min <= 15, `${iso}: ${min.toFixed(1)} min de diferencia`);
  }
});

test("luna: fases del día sin repetir la principal y en orden", () => {
  assert.equal(faseDelDia(2024, 4, 8, "UTC").nombre, "Luna nueva");
  assert.equal(faseDelDia(2024, 4, 23, "UTC").nombre, "Luna llena");
  assert.ok(iluminacion(2024, 4, 23, "UTC") > 0.97 && iluminacion(2024, 4, 8, "UTC") < 0.03);
  const abril = Array.from({ length: 30 }, (_, i) => faseDelDia(2024, 4, i + 1, "UTC").nombre);
  for (const f of ["Luna llena", "Luna nueva", "Cuarto creciente", "Cuarto menguante"]) assert.equal(abril.filter((x) => x === f).length, 1, f);
  assert.deepEqual(proximoDia(2024, 4, 10, true, "UTC"), { y: 2024, m: 4, d: 23 });
  assert.deepEqual(proximoDia(2024, 4, 10, true, MAD), { y: 2024, m: 4, d: 24 }); // 23:49 UTC ya es el 24 en Madrid
});

test("renderLuna muestra el mes con una fase por día y las próximas lunas", () => {
  const html = renderLuna(AHORA, MAD);
  assert.match(html, /Calendario lunar · octubre de 2026/);
  assert.match(html, /Próxima llena: .*26 oct/); assert.match(html, /Próxima nueva: .*10 oct/);
  assert.match(html, /<b>4<\/b>/); // hoy resaltado
  assert.equal((html.match(/[🌑🌒🌓🌔🌕🌖🌗🌘]/gu) ?? []).length >= 31, true);
});

// ---------- Tiempo ----------
const prevision = () => previsionFalsa("2026-10-04", "2026-10-05");

test("parsearPrevision toma desde la hora actual (en la zona del usuario), 18 horas y los datos del día", () => {
  const d = parsearPrevision(prevision(), AHORA, MAD);
  assert.equal(d.horas.length, 18); assert.equal(d.horas[0].hora, 7); assert.equal(d.horas[17].hora, 0); assert.equal(d.horas[17].fecha, "2026-10-05");
  assert.equal(d.amanece, "08:12"); assert.equal(d.anochece, "19:42"); assert.equal(d.tMax, 28.4); assert.equal(d.uvMax, 5.4); assert.equal(d.vientoMax, 24);
  assert.equal(d.anio, 2026);
  // más tarde empieza más tarde
  assert.equal(parsearPrevision(prevision(), new Date("2026-10-04T12:20:00Z"), MAD).horas[0].hora, 14);
});

test("tramosLluvia agrupa horas seguidas con lluvia o probabilidad alta, también al cruzar la medianoche", () => {
  const h = (hora: number, mm: number, prob: number) => ({ fecha: "", hora, temp: 20, codigo: 3, prob, mm, viento: 0, humedad: 0, uv: 0, racha: 0, dir: 0 });
  const t = tramosLluvia([h(7, 0, 5), h(8, 0.3, 40), h(9, 1.2, 80), h(10, 0, 20), h(11, 0, 65), h(12, 0, 10)]);
  assert.equal(t.length, 2);
  assert.deepEqual([t[0].desde, t[0].hasta, t[0].probMax], [8, 10, 80]); assert.ok(Math.abs(t[0].mm - 1.5) < 1e-9);
  assert.deepEqual([t[1].desde, t[1].hasta], [11, 12]);
  const noche = tramosLluvia([h(22, 0, 0), h(23, 0.5, 70), h(0, 0.8, 90)]);
  assert.deepEqual([noche[0].desde, noche[0].hasta], [23, 1]);
  assert.equal(tramosLluvia([h(1, 0, 10)]).length, 0);
});

test("textos del tiempo", () => {
  assert.equal(emojiTiempo(0), "☀️"); assert.equal(emojiTiempo(95), "⛈"); assert.equal(descTiempo(3), "cubierto"); assert.equal(descTiempo(81), "chubascos");
  assert.equal(nivelUv(2.9), "bajo"); assert.equal(nivelUv(5), "moderado"); assert.equal(nivelUv(11), "extremo");
  assert.equal(sparkline([1, 2, 3, 4, 5, 6, 7, 8]), "▁▂▃▄▅▆▇█"); assert.equal(sparkline([5, 5, 5]).length, 3); assert.equal(sparkline([]), "");
  assert.equal(grados(19.6), "20º"); assert.equal(num1(475.7), "475,7"); assert.equal(num1(3), "3");
});

test("tiempo: resumen completo con lluvia prevista, sol, viento, UV, luna y lluvia pasada", async () => {
  const b = crearBanco(AHORA);
  const u = usuarioNuevo("1", "Ana", AHORA); u.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 38.02, lon: -4.38 };
  b.http.añadir("api.open-meteo.com", prevision()).añadir("historical-forecast-api", historicoFalso());
  const c = await construirContenido("tiempo", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.match(c.html, /Tiempo · Montoro/); assert.match(c.html, /Cubierto · mín 19º \/ máx 28º/);
  assert.match(c.html, /<code>[▁▂▃▄▅▆▇█]{18}<\/code>/);
  assert.match(c.html, /Lluvia prevista<\/b>\n• 17–22 h/); assert.match(c.html, /prob\. 70 %/);
  assert.match(c.html, /Amanece 08:12 · Anochece 19:42\n11 h 30 min de luz/);
  assert.match(c.html, /Viento<\/b> .* del SO/); assert.match(c.html, /UV máx\.<\/b> 5,4 \(moderado\) — protección solar/);
  assert.match(c.html, /iluminada/); assert.match(c.html, /Ayer llovió 0,5 l\/m²\nAcumulado 2026: /);
  assert.deepEqual(c.teclado!.flat().map((x) => x.datos), ["sev:tiempo:horas", "sev:tiempo:luna", "m:menu"]);
  // dos usuarios de la misma ciudad comparten las consultas (caché)
  const antes = b.http.llamadas.length;
  await construirContenido("tiempo", { usuario: { ...u, id: "2" }, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.equal(b.http.llamadas.length, antes, "la segunda petición sale de la caché");
});

test("tiempo: hora a hora, luna, sin ciudad y con el histórico caído", async () => {
  const b = crearBanco(AHORA);
  const u = usuarioNuevo("1", "Ana", AHORA);
  const ctx = { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA };
  const sin = await construirContenido("tiempo", ctx);
  assert.match(sin.html, /necesito saber dónde vives/); assert.equal(sin.teclado![0][0].datos, "p:ciudad");
  u.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 38.02, lon: -4.38 };
  b.http.añadir("api.open-meteo.com", prevision()).añadir("historical-forecast-api", new Error("503"));
  const resumen = await construirContenido("tiempo", ctx);
  assert.match(resumen.html, /Tiempo · Montoro/); assert.doesNotMatch(resumen.html, /Ayer/);
  const horas = await construirContenido("tiempo:horas", ctx);
  assert.equal((horas.html.match(/:00 /g) ?? []).length, 18); assert.match(horas.html, /07:00 🌤 /);
  assert.match((await construirContenido("tiempo:luna", ctx)).html, /Calendario lunar/);
  const d = parsearPrevision(prevision(), AHORA, MAD);
  assert.match(renderHoraAHora(d, "Montoro"), /Hora a hora · Montoro/);
});

test("tiempo: si Open-Meteo falla la sección falla (el programador reintentará)", async () => {
  const b = crearBanco(AHORA); b.http.añadir("api.open-meteo.com", new Error("timeout"));
  const u = usuarioNuevo("1", "Ana", AHORA); u.ciudad = { nombre: "X", provincia: "", lat: 1, lon: 1 };
  await assert.rejects(construirContenido("tiempo", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA }), /timeout/);
});

// ---------- Noticias ----------
test("leerRss: títulos con medio, entidades, un solo item y XML roto", () => {
  const n = leerRss(rssFalso("Economía", 2));
  assert.equal(n.length, 2); assert.equal(n[0].titulo, "Economía noticia 1 & más"); assert.equal(n[0].fuente, "Diario 1"); assert.ok(n[0].fecha > 0);
  assert.equal(leerRss(rssFalso("x", 1)).length, 1);
  assert.deepEqual(leerRss("esto no es xml"), []); assert.deepEqual(leerRss("<rss><channel></channel></rss>"), []);
  const l = lineaNoticia({ titulo: "A <b> & B", fuente: "El Día", enlace: "https://x.es/a?b=1&c=2", fecha: 0 });
  assert.equal(l, '• <a href="https://x.es/a?b=1&amp;c=2">A &lt;b&gt; &amp; B</a> <i>(El Día)</i>');
  assert.equal(lineaNoticia({ titulo: "t", fuente: "", enlace: "javascript:alert(1)", fecha: 0 }), "• t");
});

test("noticias: economía, política y las de la zona sin repetir; tolera una consulta caída", async () => {
  const b = crearBanco(AHORA);
  b.http.añadir(/q=.*econom/i, rssFalso("Economía")).añadir(/q=.*pol%C3%ADtica/i, rssFalso("Política")).añadir(/Ayuntamiento/, rssFalso("Ayto")).añadir(/q=%22Montoro%22/, new Error("503"));
  const u = usuarioNuevo("1", "Ana", AHORA); u.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 1, lon: 1 };
  const c = await construirContenido("noticias", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.match(c.html, /Noticias del día/); assert.match(c.html, /<b>Economía<\/b>/); assert.match(c.html, /Ayuntamiento de Montoro/);
  assert.match(c.html, /No disponible ahora/); // la consulta del municipio cayó
  assert.equal((c.html.match(/Economía noticia/g) ?? []).length, 4);
  assert.ok(b.http.llamadas.some((l) => decodeURIComponent(l).includes('"Provincia"') || decodeURIComponent(l).includes('"Córdoba"')));
});

test("noticias: si no se obtiene ninguna consulta, falla", async () => {
  const b = crearBanco(AHORA); b.http.añadir("news.google.com", new Error("caído"));
  const u = usuarioNuevo("1", "Ana", AHORA);
  await assert.rejects(construirContenido("noticias", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA }), /ninguna noticia/);
});

test("tema personalizado", async () => {
  const b = crearBanco(AHORA); b.http.añadir("news.google.com", rssFalso("Ajedrez", 8));
  const u = usuarioNuevo("1", "Ana", AHORA); u.temas.push({ id: "ajedrez", titulo: "Ajedrez", emoji: "♟️", consulta: "ajedrez", hora: "08:30", activa: true });
  const c = await construirContenido("tema:ajedrez", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.match(c.html, /♟️ <b>Ajedrez<\/b>/); assert.equal((c.html.match(/Ajedrez noticia/g) ?? []).length, 7);
  assert.match((await construirContenido("tema:no-existe", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA })).html, /No encuentro ese tema/);
  await assert.rejects(construirContenido("sección-rara", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA }), /desconocida/);
});

// ---------- Mercados ----------
test("mercados: la variación se calcula contra la sesión anterior, no contra chartPreviousClose", () => {
  // chartPreviousClose (7000) es el cierre anterior a toda la ventana: usarlo daría +10 %.
  const g = parsearGrafico(graficoFalso({ precio: 7722, previo: 7650, ultimaFecha: "2026-10-02", chartPrev: 7000 }));
  const q = cotizacionActual(g);
  assert.equal(q.anterior, 7650); assert.ok(Math.abs(((q.precio - q.anterior) / q.anterior) * 100 - 0.94) < 0.01);
});

test("mercados: última sesión completada (descarta la vela de hoy) y datos insuficientes", () => {
  const g = parsearGrafico(graficoFalso({ precio: 105, previo: 100, ultimaFecha: "2026-10-04" }));
  const s = ultimaSesion(g, "2026-10-04")!; // la vela del 4 es la de hoy: se descarta
  assert.equal(s.fecha, "2026-10-03"); assert.equal(s.precio, 100);
  assert.equal(ultimaSesion(g, "2026-10-01"), null);
  assert.throws(() => parsearGrafico({}), /sin datos/);
  assert.equal(parsearGrafico({ chart: { result: [{ meta: { regularMarketPrice: 1 }, timestamp: [1], indicators: { quote: [{ close: [null] }] } }] } }).cierres.length, 0);
});

test("mercados: el contenido tolera símbolos caídos y comparte consulta entre usuarios", async () => {
  const b = crearBanco(AHORA);
  b.http.añadir("finance.yahoo.com", () => graficoFalso({ precio: 7722.7, previo: 7650.5, ultimaFecha: "2026-10-02" }))
    .añadir(/%5EIBEX/, new Error("429")).añadir("news.google.com", rssFalso("Bolsa", 4));
  const u = usuarioNuevo("1", "Ana", AHORA);
  const ctx = { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA };
  const c = await construirContenido("mercados", ctx);
  assert.match(c.html, /Premercado y activos refugio/); assert.match(c.html, /🟢 S&amp;P 500|🟢 S&P 500/); assert.match(c.html, /Cierre de la última sesión/);
  assert.match(c.html, /\(\+0,94 %\)/); assert.doesNotMatch(c.html, /IBEX/);
  assert.match(c.html, /Noticias de premercado/);
  const n = b.http.llamadas.length;
  await construirContenido("mercados", { ...ctx, usuario: { ...u, id: "2" } });
  assert.equal(b.http.llamadas.length, n, "las cotizaciones se piden una vez para todos");
});

test("mercados: sin ninguna cotización falla", async () => {
  const b = crearBanco(AHORA); b.http.añadir("finance.yahoo.com", new Error("blocked")).añadir("news.google.com", rssFalso("x"));
  await assert.rejects(construirContenido("mercados", { usuario: usuarioNuevo("1", "A", AHORA), http: b.http, almacen: b.almacen, ahora: AHORA }), /ninguna cotización/);
});

// ---------- Horóscopo y agenda ----------
test("signos", () => {
  assert.equal(signoDe("1984-04-05").nombre, "Aries"); assert.equal(signoDe("1990-03-20").id, "piscis"); assert.equal(signoDe("1990-03-21").id, "aries");
  assert.equal(signoDe("1990-12-22").id, "capricornio"); assert.equal(signoDe("1991-01-19").id, "capricornio"); assert.equal(signoDe("1991-01-20").id, "acuario");
  assert.equal(new Set(Array.from({ length: 366 }, (_, i) => signoDe(new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10)).id)).size, 12);
});

test("horóscopo: pide los datos que faltan, usa el documento del signo y avisa si es antiguo", async () => {
  const b = crearBanco(AHORA);
  const u = usuarioNuevo("1", "Ana", AHORA);
  const ctx = () => ({ usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.equal((await construirContenido("horoscopo", ctx())).teclado![0][0].datos, "p:nacimiento");
  u.nacimiento = "1984-04-05";
  assert.match((await construirContenido("horoscopo", ctx())).html, /Todavía no hay horóscopo/);
  b.almacen.horoscopos.set("aries", { signo: "aries", fecha: "2026-10-04", prediccion: "Un buen día <para> empezar & avanzar.", fuente: "20minutos.es", fuenteUrl: "https://www.20minutos.es/horoscopo/aries/" });
  let c = await construirContenido("horoscopo", ctx());
  assert.match(c.html, /Horóscopo · ♈ Aries/); assert.match(c.html, /Un buen día &lt;para&gt; empezar &amp; avanzar\./);
  assert.match(c.html, /<a href="https:\/\/www\.20minutos\.es\/horoscopo\/aries\/">20minutos\.es<\/a>/); assert.doesNotMatch(c.html, /Aún no se ha publicado/);
  b.almacen.horoscopos.set("aries", { signo: "aries", fecha: "2026-10-02", prediccion: "Antiguo", fuente: "x", fuenteUrl: "javascript:alert(1)" });
  c = await construirContenido("horoscopo", ctx());
  assert.match(c.html, /este es el del 2026-10-02/); assert.doesNotMatch(c.html, /javascript:/);
});

test("agenda: citas y alarmas de hoy y mañana, tareas pendientes, y nada de lo pasado", async () => {
  const b = crearBanco(AHORA);
  const u = usuarioNuevo("1", "Ana", AHORA);
  const base = { uid: "1", lugar: "", antelacionMin: 0, repeticion: "ninguna" as const, avisado: false, hecho: false, creadoEn: AHORA };
  await b.almacen.guardarEvento({ ...base, tipo: "cita", titulo: "Cardiología", lugar: "Hospital <Reina Sofía>", fechaHora: localAUtc(2026, 10, 4, 11, 0, MAD) });
  await b.almacen.guardarEvento({ ...base, tipo: "alarma", titulo: "Pastilla", fechaHora: localAUtc(2026, 10, 5, 8, 0, MAD) });
  await b.almacen.guardarEvento({ ...base, tipo: "cita", titulo: "Pasada", fechaHora: localAUtc(2026, 10, 3, 8, 0, MAD) });
  await b.almacen.guardarEvento({ ...base, tipo: "cita", titulo: "Lejana", fechaHora: localAUtc(2026, 10, 20, 8, 0, MAD) });
  await b.almacen.guardarEvento({ ...base, tipo: "tarea", titulo: "Llamar al banco", fechaHora: null });
  await b.almacen.guardarEvento({ ...base, tipo: "tarea", titulo: "Hecha", fechaHora: null, hecho: true });
  const c = await construirContenido("agenda", { usuario: u, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.match(c.html, /hoy 11:00 · Cardiología \(Hospital &lt;Reina Sofía&gt;\)/); assert.match(c.html, /mañana 08:00 · Pastilla/);
  assert.doesNotMatch(c.html, /Pasada|Lejana|Hecha/); assert.match(c.html, /• Llamar al banco/);
  const vacia = await construirContenido("agenda", { usuario: { ...u, id: "9" }, http: b.http, almacen: b.almacen, ahora: AHORA });
  assert.match(vacia.html, /Sin citas ni alarmas/); assert.match(vacia.html, /Nada pendiente/);
});

test("fechaIso/partesEnZona se usan de forma coherente", () => {
  assert.equal(fechaIso(AHORA, MAD), "2026-10-04"); assert.equal(partesEnZona(AHORA, MAD).h, 7);
});

// ---------- Velocidad ----------
test("noticias y tiempo piden sus datos a la vez, no uno detrás de otro", async () => {
  let activas = 0, maximo = 0;
  const lento = (data: unknown) => async () => { activas++; maximo = Math.max(maximo, activas); await new Promise((r) => setTimeout(r, 15)); activas--; return { data }; };
  const noticias = lento(rssFalso("Tema", 3));
  const u = usuarioNuevo("1", "Ana", AHORA); u.ciudad = { nombre: "Montoro", provincia: "Córdoba", lat: 38, lon: -4 };
  const b = crearBanco(AHORA);
  await construirContenido("noticias", { usuario: u, http: { get: noticias }, almacen: b.almacen, ahora: AHORA });
  assert.ok(maximo >= 4, `noticias: como mucho ${maximo} a la vez`); // economía, política, ayuntamiento y localidad

  activas = 0; maximo = 0;
  const previsionJson = prevision();
  const http = { get: async (url: string) => { activas++; maximo = Math.max(maximo, activas); await new Promise((r) => setTimeout(r, 15)); activas--; return { data: url.includes("historical") ? { daily: { precipitation_sum: [1, 2] } } : previsionJson }; } };
  const c = await construirContenido("tiempo", { usuario: u, http, almacen: b.almacen, ahora: AHORA });
  assert.equal(maximo, 2, "previsión e histórico a la vez");
  assert.match(c.html, /Acumulado 2026/);
});

import { esc } from "../canal";
import { fechaIso } from "../fechas";
import { SIGNOS, urlHoroscopo } from "../horoscopo";
import { leerPagina20min, urlSigno20min } from "../horoscopo20min";
import { episodioDeSigno, FEED_PODCAST } from "../podcast";
import { leerRss, urlBingNews, urlGoogleNews } from "../rss";
import { cabecera, conPlazo } from "../util";
import { BTN_MENU, Ctx } from "./ctx";

const CABECERAS = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9" };

interface Resultado { nombre: string; ok: boolean; detalle: string; ms: number }

/** Prueba una fuente de datos: tiempo que tarda y si responde (o por qué no). */
async function probar(nombre: string, f: () => Promise<string | void>): Promise<Resultado> {
  const t0 = Date.now();
  try {
    const extra = await conPlazo(f(), 10_000, "sin respuesta en 10 s");
    return { nombre, ok: true, detalle: extra ?? "", ms: Date.now() - t0 };
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status;
    return { nombre, ok: false, detalle: status ? `HTTP ${status}` : String((e as Error).message ?? e).slice(0, 70), ms: Date.now() - t0 };
  }
}

const seg = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;

/** /diagnostico: comprueba desde el servidor si llegan los datos de cada fuente. Sirve para saber por qué falla una sección. */
export async function diagnostico(c: Ctx): Promise<void> {
  const http = c.deps.http, cfg = c.deps.horoscopoCfg;
  const hoy = fechaIso(c.ahora, c.u.zona);
  const resultados = await Promise.all([
    probar("Open-Meteo (tiempo)", async () => { await http.get("https://api.open-meteo.com/v1/forecast?latitude=38&longitude=-4&current=temperature_2m", { timeout: 8000 }); }),
    probar("Google News (noticias)", async () => `${leerRss(String((await http.get(urlGoogleNews("economía España when:1d"), { timeout: 8000, headers: CABECERAS })).data)).length} noticias`),
    probar("Bing News (noticias)", async () => `${leerRss(String((await http.get(urlBingNews("economía España"), { timeout: 8000, headers: CABECERAS })).data)).length} noticias`),
    probar("Yahoo Finance (mercados)", async () => { await http.get("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=5d&interval=1d", { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0 AgendaPersonalBot/1.0" } }); }),
    probar("20minutos (horóscopo directo)", async () => { const e = leerPagina20min(String((await http.get(urlSigno20min(SIGNOS[0]), { timeout: 8000, headers: CABECERAS })).data)); return e.length ? `última fecha ${e[0].fecha}` : "página sin horóscopo"; }),
    probar("Podcast El Horóscopo Diario (RSS)", async () => {
      const e = await episodioDeSigno(http, c.deps.podcastFeed ?? FEED_PODCAST, SIGNOS[0], hoy);
      return e ? `«${e.titulo.slice(0, 50)}» · ${e.fecha} · ${new URL(e.url).hostname}` : "no encuentro episodios de Aries";
    }),
    cfg ? probar("horoscopefree (respaldo)", async () => { await http.get(urlHoroscopo(cfg, SIGNOS[0], hoy), { timeout: 8000 }); }) : Promise.resolve<Resultado>({ nombre: "horoscopefree (respaldo)", ok: false, detalle: "sin configurar", ms: 0 }),
  ]);
  const guardados = (await Promise.all(SIGNOS.map((s) => c.almacen.getHoroscopo(s.id).catch(() => null)))).filter((d) => d?.fecha === hoy).length;
  const lineas = resultados.map((r) => `${r.ok ? "✅" : "❌"} <b>${esc(r.nombre)}</b>\n     ${r.ok ? `responde en ${seg(r.ms)}${r.detalle ? ` · ${esc(r.detalle)}` : ""}` : `${esc(r.detalle)} · ${seg(r.ms)}`}`);
  await c.nuevo([
    cabecera("🛠", "Diagnóstico", "Conexión del servidor con cada fuente"),
    "",
    ...lineas.flatMap((l) => [l, ""]),
    `🔮 <b>Horóscopos guardados hoy</b>\n     ${guardados} de ${SIGNOS.length}`,
    "",
    "<i>Si alguna fuente falla desde aquí, esa sección fallará en tu bot.</i>",
  ].join("\n"), [[BTN_MENU]]);
}

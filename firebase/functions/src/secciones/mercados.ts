import { fechaIso } from "../fechas";
import { cabecera, cacheado, conReintentos, num0, pct } from "../util";
import { resumenNoticias } from "./noticias";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

export interface Grafico { precio: number; ultimaCotizacion: number; desfase: number; cierres: { fecha: string; cierre: number }[]; cierreAnterior: number }
export interface Cotizacion { precio: number; anterior: number; fecha?: string }

const FUTUROS: [string, string][] = [
  ["S&P 500 fut.", "ES=F"], ["Nasdaq 100 fut.", "NQ=F"], ["Dow Jones fut.", "YM=F"], ["VIX", "^VIX"], ["Petróleo WTI", "CL=F"], ["Oro", "GC=F"],
  ["EUR/USD", "EURUSD=X"], ["Bono EEUU 10a (%)", "^TNX"], ["Bitcoin", "BTC-USD"],
];
const INDICES: [string, string][] = [
  ["S&P 500", "^GSPC"], ["Nasdaq", "^IXIC"], ["Dow Jones", "^DJI"], ["Russell 2000", "^RUT"], ["IBEX 35", "^IBEX"], ["Euro Stoxx 50", "^STOXX50E"], ["DAX", "^GDAXI"], ["Nikkei 225", "^N225"],
];

/** Interpreta la respuesta del endpoint chart de Yahoo Finance (velas diarias). */
export function parsearGrafico(json: any): Grafico {
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error("respuesta de Yahoo sin datos");
  const meta = r.meta ?? {};
  const desfase = meta.gmtoffset ?? 0;
  const cierres: { fecha: string; cierre: number }[] = [];
  const ts: number[] = r.timestamp ?? [];
  const cl: (number | null)[] = r.indicators?.quote?.[0]?.close ?? [];
  ts.forEach((t, i) => { const c = cl[i]; if (c !== null && c !== undefined) cierres.push({ fecha: new Date((t + desfase) * 1000).toISOString().slice(0, 10), cierre: c }); });
  return { precio: meta.regularMarketPrice, ultimaCotizacion: meta.regularMarketTime ?? ts[ts.length - 1] ?? 0, desfase, cierres, cierreAnterior: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice };
}

/** Precio actual frente al cierre de la sesión anterior (chartPreviousClose con range largo no es el cierre de ayer). */
export function cotizacionActual(g: Grafico): Cotizacion {
  const diaPrecio = new Date((g.ultimaCotizacion + g.desfase) * 1000).toISOString().slice(0, 10);
  const prev = [...g.cierres].reverse().find((c) => c.fecha < diaPrecio)?.cierre ?? g.cierreAnterior;
  return { precio: g.precio, anterior: prev };
}

/** Última sesión completada (descarta la vela de hoy si sigue abierta o no ha cerrado). */
export function ultimaSesion(g: Grafico, hoy: string): Cotizacion | null {
  const cerradas = g.cierres.filter((c) => c.fecha < hoy);
  if (cerradas.length < 2) return null;
  const ult = cerradas[cerradas.length - 1];
  return { precio: ult.cierre, anterior: cerradas[cerradas.length - 2].cierre, fecha: ult.fecha };
}

const variacion = (c: Cotizacion) => (c.anterior === 0 ? 0 : ((c.precio - c.anterior) / c.anterior) * 100);
const flecha = (p: number) => (p > 0.05 ? "🟢" : p < -0.05 ? "🔴" : "⚪");
const cifra = (v: number) => (Math.abs(v) >= 1000 ? num0(v) : Math.abs(v) < 10 ? v.toFixed(4).replace(".", ",") : v.toFixed(2).replace(".", ","));

export function lineaCotizacion(nombre: string, c: Cotizacion): string {
  const p = variacion(c);
  return `${flecha(p)} ${nombre} <b>${cifra(c.precio)}</b> (${pct(p)})${c.fecha ? ` <i>· ${c.fecha}</i>` : ""}`;
}

async function pedir(ctx: Contexto, simbolo: string): Promise<Grafico> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?range=10d&interval=1d`;
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0 AgendaPersonalBot/1.0" } }), 2, 800);
  return parsearGrafico(r.data);
}

export async function contenidoMercados(ctx: Contexto): Promise<Contenido> {
  const hoy = fechaIso(ctx.ahora, "Europe/Madrid"); // las cotizaciones son las mismas para todos: una sola consulta cada 20 minutos
  const clave = `mercados:${hoy}:${Math.floor(ctx.ahora.getTime() / (20 * 60_000))}`;
  const bloque = await cacheado(ctx.almacen, clave, 20 * 60_000, ctx.ahora, async () => {
    const [fut, ind] = await Promise.all([
      Promise.allSettled(FUTUROS.map(async ([n, s]) => lineaCotizacion(n, cotizacionActual(await pedir(ctx, s))))),
      Promise.allSettled(INDICES.map(async ([n, s]) => { const q = ultimaSesion(await pedir(ctx, s), hoy); if (!q) throw new Error("sin sesión"); return lineaCotizacion(n, q); })),
    ]);
    const ok = (r: PromiseSettledResult<string>[]) => r.flatMap((x) => (x.status === "fulfilled" ? [x.value] : []));
    return { fut: ok(fut), ind: ok(ind) };
  });
  if (bloque.fut.length === 0 && bloque.ind.length === 0) throw new Error("no se pudo obtener ninguna cotización");
  const partes: string[] = [cabecera("📈", "Mercados")];
  if (bloque.fut.length) partes.push(`🇺🇸 <b>Premercado y activos refugio</b>\n${bloque.fut.join("\n")}`);
  if (bloque.ind.length) partes.push(`🔔 <b>Cierre de la última sesión</b>\n${bloque.ind.join("\n")}`);
  let noticias = "";
  try {
    noticias = await resumenNoticias(ctx, "", [
      { titulo: "📰 <b>Noticias de premercado</b>", consulta: "premercado Wall Street futuros when:1d" },
      { titulo: "🗞 <b>Crónica de mercados</b>", consulta: '"Wall Street" cierre sesión Ibex when:2d' },
    ], 3);
  } catch { /* las cotizaciones valen por sí solas */ }
  return { html: [...partes, noticias.trim()].filter(Boolean).join("\n\n"), teclado: [NAV_MENU] };
}

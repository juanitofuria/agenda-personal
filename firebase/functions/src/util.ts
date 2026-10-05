import { Almacen } from "./almacen";

const NF1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const NF0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
/** 475,7 (coma decimal, sin ",0" sobrante). */
export const num1 = (v: number) => NF1.format(v);
export const num0 = (v: number) => NF0.format(v);
export const grados = (v: number) => `${Math.round(v)}º`;
const NF2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (v: number) => `${v >= 0 ? "+" : "−"}${NF2.format(Math.abs(v))} %`;

const BARRAS = "▁▂▃▄▅▆▇█";
/** Gráfica de una línea con bloques: ▁▂▃▅▇█… (una barra por valor, escalada entre el mínimo y el máximo). */
export function sparkline(valores: number[]): string {
  if (valores.length === 0) return "";
  const min = Math.min(...valores), max = Math.max(...valores);
  if (max === min) return BARRAS[3].repeat(valores.length);
  return valores.map((v) => BARRAS[Math.min(7, Math.floor(((v - min) / (max - min)) * 8))]).join("");
}

export const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** Línea fina que separa la cabecera del contenido en los mensajes. */
export const SEPARADOR = "▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
/** Cabecera de un mensaje: título en negrita, subtítulo en cursiva y una línea de separación. `titulo` y `subtitulo` ya van escapados. */
export const cabecera = (emoji: string, titulo: string, subtitulo?: string) =>
  `${emoji} <b>${titulo}</b>${subtitulo ? `\n<i>${subtitulo}</i>` : ""}\n${SEPARADOR}`;

/** Bloque de un mensaje: emoji y título en negrita, y debajo sus líneas. */
export const bloque = (emoji: string, titulo: string, ...lineas: string[]) => `${emoji} <b>${titulo}</b>${lineas.length ? `\n${lineas.join("\n")}` : ""}`;

export interface HttpGet {
  get(url: string, opciones?: { timeout?: number; headers?: Record<string, string> }): Promise<{ data: unknown }>;
}

/** Ejecuta [fn] y guarda el resultado en caché (la misma consulta para muchos usuarios se hace una sola vez). */
export async function cacheado<T>(almacen: Almacen, clave: string, ttlMs: number, ahora: Date, fn: () => Promise<T>): Promise<T> {
  const previo = await almacen.cacheGet(clave, ahora).catch(() => null);
  if (previo) { try { return JSON.parse(previo) as T; } catch { /* caché corrupta: se vuelve a pedir */ } }
  const valor = await fn();
  await almacen.cacheSet(clave, JSON.stringify(valor), ttlMs, ahora).catch(() => undefined);
  return valor;
}

/** Falla si [p] no termina en [ms]: una fuente lenta no debe colgar toda la sección. */
export function conPlazo<T>(p: Promise<T>, ms: number, mensaje = "tardó demasiado en responder"): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const plazo = new Promise<never>((_, rechazar) => { t = setTimeout(() => rechazar(new Error(mensaje)), ms); });
  return Promise.race([p, plazo]).finally(() => clearTimeout(t));
}

/** Reintenta fallos transitorios (red) unas pocas veces. */
export async function conReintentos<T>(fn: () => Promise<T>, intentos = 3, esperaMs = 1000): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try { return await fn(); } catch (e) { ultimo = e; if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1))); }
  }
  throw ultimo;
}

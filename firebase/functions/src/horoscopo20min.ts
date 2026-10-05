import { ErrorApi, Http, RespuestaApi, Signo } from "./horoscopo";

/**
 * Horóscopo pedido directamente a 20minutos.es (la misma fuente que usa horoscopefree, sin el servicio intermedio).
 * La página de cada signo trae un archivo de unos 9 días: cada fecha va en un `<p class="date">` y su texto en el `<div>` siguiente,
 * dentro del segundo bloque `.prediction`. Se lee con búsquedas de texto, sin analizar todo el HTML, para gastar muy poca CPU.
 */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** Un texto que parezca un horóscopo y no un resto de página. */
const MIN_TEXTO = 50;

export const urlSigno20min = (signo: Signo) => `https://www.20minutos.es/horoscopo/${signo.id}/`;

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function limpiar(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") { try { return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)); } catch { return m; } }
      return ENTIDADES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

export interface Entrada20min { fecha: string; texto: string }

/** Todas las entradas fechadas de la página, de la más reciente a la más antigua. */
export function leerPagina20min(html: string): Entrada20min[] {
  const bloques = [...html.matchAll(/class="[^"]*\bprediction\b[^"]*"/g)];
  if (bloques.length < 2) return []; // el segundo bloque `.prediction` es el del archivo fechado
  const resto = html.slice(bloques[1].index!);
  const entradas: Entrada20min[] = [];
  for (const m of resto.matchAll(/<p[^>]*class="[^"]*\bdate\b[^"]*"[^>]*>([\s\S]*?)<\/p>\s*<div[^>]*>([\s\S]*?)<\/div>/g)) {
    const f = /(\d{1,2})\s+([a-záéíóú]+)\s+de\s+(\d{4})/i.exec(limpiar(m[1]));
    const mes = f ? MESES.indexOf(f[2].toLowerCase()) : -1;
    if (!f || mes < 0) continue;
    const texto = limpiar(m[2]);
    if (texto.length < MIN_TEXTO) continue;
    entradas.push({ fecha: `${f[3]}-${String(mes + 1).padStart(2, "0")}-${f[1].padStart(2, "0")}`, texto });
  }
  return entradas;
}

/**
 * Horóscopo de [fecha] para [signo]. Si la página aún no tiene el de ese día se devuelve el más reciente, con su propia fecha
 * (el bot avisa de que no es el de hoy). Lanza ErrorApi si la página no responde o no se entiende.
 */
export async function obtenerSigno20min(http: Http, signo: Signo, fecha: string): Promise<RespuestaApi> {
  const url = urlSigno20min(signo);
  let html: unknown;
  try {
    html = (await http.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9", Accept: "text/html" },
    })).data;
  } catch (e) {
    const estado = (e as { response?: { status?: number } }).response?.status;
    throw new ErrorApi(estado ? `20minutos: HTTP ${estado}` : `20minutos: ${(e as Error).message}`, estado);
  }
  if (typeof html !== "string") throw new ErrorApi("20minutos: respuesta no válida", 502, "PARSE");
  const entradas = leerPagina20min(html);
  if (entradas.length === 0) throw new ErrorApi("20minutos: no he encontrado el horóscopo en la página", 502, "PARSE");
  const elegida = entradas.find((e) => e.fecha === fecha) ?? entradas.reduce((a, b) => (b.fecha > a.fecha ? b : a));
  return { sign: signo.ingles, date: elegida.fecha, language: "es", text: elegida.texto, source: url, cached: false };
}

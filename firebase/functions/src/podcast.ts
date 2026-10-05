import { urlSegura, Signo } from "./horoscopo";
import { sinTildes, HttpGet } from "./util";

/**
 * Lectura mínima de un feed RSS de podcast: solo el episodio más reciente (el feed completo puede tener miles de episodios, por lo que no se
 * analiza entero). Sirve para saber qué trae cada episodio: título, fecha, longitud de las notas y el audio.
 */
export interface Episodio { titulo: string; fecha: string; notas: string; enlace: string; audioUrl: string; audioBytes: number; audioTipo: string }

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decodificar = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === "#") { try { return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)); } catch { return m; } }
  return ENTIDADES[e.toLowerCase()] ?? m;
});
const sinHtml = (s: string) => decodificar(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function etiqueta(bloque: string, nombre: string): string {
  const m = new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, "i").exec(bloque);
  return m ? m[1] : "";
}

/** Episodios del principio del feed (hasta [max]), del más reciente al más antiguo según el orden del feed. */
export function leerEpisodios(xml: string, max = 1): Episodio[] {
  const res: Episodio[] = [];
  let pos = 0;
  while (res.length < max) {
    const ini = xml.indexOf("<item", pos);
    if (ini < 0) break;
    const fin = xml.indexOf("</item>", ini);
    if (fin < 0) break;
    pos = fin + 7;
    const it = xml.slice(ini, fin);
    const enc = /<enclosure\b([^>]*)>/i.exec(it)?.[1] ?? "";
    const atributo = (n: string) => new RegExp(`${n}="([^"]*)"`, "i").exec(enc)?.[1] ?? "";
    // Las notas pueden venir en <content:encoded>, <itunes:summary> o <description>: se toma la más larga.
    const notas = ["content:encoded", "itunes:summary", "description"].map((n) => sinHtml(etiqueta(it, n))).sort((a, b) => b.length - a.length)[0] ?? "";
    res.push({
      titulo: sinHtml(etiqueta(it, "title")), fecha: sinHtml(etiqueta(it, "pubDate")), notas, enlace: sinHtml(etiqueta(it, "link")),
      audioUrl: decodificar(atributo("url")), audioBytes: Number(atributo("length")) || 0, audioTipo: atributo("type"),
    });
  }
  return res;
}

/** Feed del podcast «El Horóscopo Diario» (un episodio por signo y día). */
export const FEED_PODCAST = "https://feeds.megaphone.fm/ASAHO6840420465";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "HORÓSCOPO DIARIO DE PISCIS (Lunes 5 de Octubre de 2026)" → "2026-10-05" (null si no lleva fecha). */
export function fechaDeTitulo(titulo: string): string | null {
  const m = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i.exec(titulo);
  const mes = m ? MESES.indexOf(sinTildes(m[2])) : -1;
  return m && mes >= 0 ? `${m[3]}-${String(mes + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

export interface EpisodioSigno { titulo: string; fecha: string; url: string }

/**
 * Episodio del podcast «Horóscopo diario de <signo>» de la fecha pedida o, si aún no está, el más reciente de ese signo.
 * Solo se lee el principio del feed (los episodios nuevos van primero). `url` es la página del episodio o, si no la hay, el audio.
 */
export async function episodioDeSigno(http: HttpGet, feed: string, signo: Signo, hoy: string): Promise<EpisodioSigno | null> {
  const xml = String((await http.get(feed, { timeout: 8000, maxBytes: 150_000, headers: { "User-Agent": "Mozilla/5.0 AgendaPersonalBot/1.0" } })).data);
  const clave = `horoscopo diario de ${sinTildes(signo.nombre)}`;
  const candidatos = leerEpisodios(xml, 80).flatMap((e) => {
    const fecha = fechaDeTitulo(e.titulo);
    const url = urlSegura(e.enlace) || urlSegura(e.audioUrl);
    return fecha && url && sinTildes(e.titulo).includes(clave) ? [{ titulo: e.titulo, fecha, url }] : [];
  });
  return candidatos.find((c) => c.fecha === hoy) ?? candidatos.reduce<EpisodioSigno | null>((a, c) => (!a || c.fecha > a.fecha ? c : a), null);
}

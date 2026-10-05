/**
 * Lectura mínima de un feed RSS de podcast: solo el episodio más reciente (el feed completo puede tener miles de episodios, por lo que no se
 * analiza entero). Sirve para saber qué trae cada episodio: título, fecha, longitud de las notas y el audio.
 */
export interface Episodio { titulo: string; fecha: string; notas: string; audioUrl: string; audioBytes: number; audioTipo: string }

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
      titulo: sinHtml(etiqueta(it, "title")), fecha: sinHtml(etiqueta(it, "pubDate")), notas,
      audioUrl: decodificar(atributo("url")), audioBytes: Number(atributo("length")) || 0, audioTipo: atributo("type"),
    });
  }
  return res;
}

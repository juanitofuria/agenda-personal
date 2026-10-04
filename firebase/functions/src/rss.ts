import { XMLParser } from "fast-xml-parser";
import { esc, escAttr } from "./canal";

export interface Noticia { titulo: string; fuente: string; enlace: string; fecha: number }

const parser = new XMLParser({ ignoreAttributes: true, textNodeName: "#text", processEntities: true });

const texto = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return texto((v as Record<string, unknown>)["#text"]);
  return String(v).trim();
};

/** Lee un RSS 2.0 (Google News) y devuelve las noticias; los títulos "Titular - Medio" se separan. */
export function leerRss(xml: string): Noticia[] {
  let doc: any;
  try { doc = parser.parse(xml); } catch { return []; }
  const items = doc?.rss?.channel?.item;
  const lista: any[] = Array.isArray(items) ? items : items ? [items] : [];
  return lista.flatMap((it) => {
    let titulo = texto(it.title);
    if (!titulo) return [];
    let fuente = texto(it.source);
    const i = titulo.lastIndexOf(" - ");
    if (i > 0 && (!fuente || titulo.endsWith(` - ${fuente}`))) { if (!fuente) fuente = titulo.slice(i + 3); titulo = titulo.slice(0, i); }
    const fecha = Date.parse(texto(it.pubDate));
    return [{ titulo, fuente, enlace: texto(it.link), fecha: Number.isNaN(fecha) ? 0 : fecha }];
  });
}

export const urlGoogleNews = (consulta: string, idioma = "es", pais = "ES") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=${idioma}&gl=${pais}&ceid=${pais}:${idioma}`;

/** Solo se enlazan URLs http(s). */
export function enlaceSeguro(url: string): string {
  try { const u = new URL(url); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : ""; } catch { return ""; }
}

/** "• <a href>Titular</a> <i>(Medio)</i>" */
export function lineaNoticia(n: Noticia): string {
  const url = enlaceSeguro(n.enlace);
  const titulo = url ? `<a href="${escAttr(url)}">${esc(n.titulo)}</a>` : esc(n.titulo);
  return `• ${titulo}${n.fuente ? ` <i>(${esc(n.fuente)})</i>` : ""}`;
}

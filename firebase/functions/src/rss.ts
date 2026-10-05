import { esc, escAttr } from "./canal";

export interface Noticia { titulo: string; fuente: string; enlace: string; fecha: number }

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };

/** &amp; &lt; &#39; &#x27;… → carácter. Lo desconocido se deja tal cual. */
function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

/** Texto de la primera etiqueta `<nombre …>texto</nombre>` del bloque (admite CDATA); "" si no está. */
function etiqueta(bloque: string, nombre: string): string {
  let desde = 0;
  for (;;) {
    const ini = bloque.indexOf(`<${nombre}`, desde);
    if (ini < 0) return "";
    const c = bloque[ini + nombre.length + 1];
    if (c !== ">" && c !== " " && c !== "/" && c !== "\n" && c !== "\t" && c !== "\r") { desde = ini + 1; continue; } // otra etiqueta que empieza igual
    const finApertura = bloque.indexOf(">", ini);
    if (finApertura < 0) return "";
    if (bloque[finApertura - 1] === "/") return ""; // <nombre/>
    const cierre = bloque.indexOf(`</${nombre}>`, finApertura);
    if (cierre < 0) return "";
    const crudo = bloque.slice(finApertura + 1, cierre).trim();
    const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(crudo);
    return (cdata ? cdata[1] : decodificar(crudo)).trim();
  }
}

/**
 * Lee un RSS 2.0 (Google News) y devuelve las noticias; los títulos "Titular - Medio" se separan.
 * No usa un analizador XML completo: recorre los `<item>` y extrae solo lo necesario. Un RSS de 100 noticias costaba ~10–50 ms de CPU
 * con la librería; aquí es una fracción, lo que importa con el límite de 10 ms por ejecución de Cloudflare (plan gratuito).
 */
export function leerRss(xml: string): Noticia[] {
  const noticias: Noticia[] = [];
  let pos = 0;
  for (;;) {
    const ini = xml.indexOf("<item", pos);
    if (ini < 0) break;
    const c = xml[ini + 5];
    if (c !== ">" && c !== " " && c !== "\n") { pos = ini + 5; continue; }
    const fin = xml.indexOf("</item>", ini);
    if (fin < 0) break;
    pos = fin + 7;
    const it = xml.slice(ini, fin);
    let titulo = etiqueta(it, "title");
    if (!titulo) continue;
    let fuente = etiqueta(it, "source") || etiqueta(it, "News:Source"); // Google: <source>; Bing: <News:Source>
    const i = titulo.lastIndexOf(" - ");
    if (i > 0 && (!fuente || titulo.endsWith(` - ${fuente}`))) { if (!fuente) fuente = titulo.slice(i + 3); titulo = titulo.slice(0, i); }
    const fecha = Date.parse(etiqueta(it, "pubDate"));
    noticias.push({ titulo, fuente, enlace: enlaceReal(etiqueta(it, "link")), fecha: Number.isNaN(fecha) ? 0 : fecha });
  }
  return noticias;
}

/** Los enlaces de Bing News pasan por un redirector (bing.com/news/apiclick…?url=<la noticia>): se enlaza la noticia directamente. */
function enlaceReal(enlace: string): string {
  try {
    const u = new URL(enlace);
    if (/(^|\.)bing\.com$/.test(u.hostname)) { const destino = u.searchParams.get("url"); if (destino) return destino; }
  } catch { /* se deja tal cual */ }
  return enlace;
}

export const urlGoogleNews = (consulta: string, idioma = "es", pais = "ES") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=${idioma}&gl=${pais}&ceid=${pais}:${idioma}`;

/** Bing News en RSS. Bing no entiende operadores de Google como `when:1d`, así que se quitan. */
export const urlBingNews = (consulta: string) =>
  `https://www.bing.com/news/search?q=${encodeURIComponent(consulta.replace(/\bwhen:\S+/g, "").replace(/\s+/g, " ").trim())}&format=rss&setlang=es-ES&cc=ES`;

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

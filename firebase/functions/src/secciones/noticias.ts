import { esc } from "../canal";
import { Noticia, leerRss, lineaNoticia, urlBingNews, urlGoogleNews } from "../rss";
import { cabecera, cacheado, conReintentos } from "../util";
import { Contenido, Contexto, GrupoNoticias, NAV_MENU } from "./tipos";

/** Cabeceras de navegador: sin ellas algunos buscadores tardan o rechazan las peticiones desde servidores. */
const CABECERAS = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9", Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" };

async function pedirRss(ctx: Contexto, url: string): Promise<Noticia[]> {
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 6000, headers: CABECERAS }), 2, 300);
  const noticias = leerRss(String(r.data));
  if (noticias.length === 0) throw new Error("sin noticias en la respuesta");
  return noticias;
}

/** Espera que Google News solo se pide si Bing no ha contestado en este tiempo (o ha fallado). */
const ESPERA_RESPALDO_MS = 1500;

/**
 * Noticias de una búsqueda (cacheado 30 min para todos los usuarios). Se pide primero a Bing News; si tarda más de 1,5 s o falla, se pide
 * también a Google News y vale la primera que responda. Así, si una está bloqueada o lenta desde el servidor, la otra salva la sección,
 * sin gastar peticiones en la de respaldo cuando la principal responde bien.
 */
export async function noticiasDe(ctx: Contexto, consulta: string): Promise<Noticia[]> {
  return cacheado(ctx.almacen, `rss:${consulta}`, 30 * 60_000, ctx.ahora, async () => {
    const bing = pedirRss(ctx, urlBingNews(consulta));
    const estadoBing = bing.then(() => "ok" as const, () => "fallo" as const);
    const google = (async () => {
      const e = await Promise.race([estadoBing, new Promise<"lento">((r) => setTimeout(() => r("lento"), ESPERA_RESPALDO_MS))]);
      if (e === "ok") throw new Error("no hizo falta"); // Bing ya contestó bien
      return pedirRss(ctx, urlGoogleNews(consulta));
    })();
    try {
      const lista = await Promise.any([bing, google]);
      return lista.sort((a, b) => b.fecha - a.fecha).slice(0, 12);
    } catch (e) {
      const motivos = (e as AggregateError).errors?.map((x: Error) => x.message).filter((m: string) => m !== "no hizo falta").join(" · ") ?? (e as Error).message;
      throw new Error(`Bing y Google sin respuesta (${motivos})`.slice(0, 160));
    }
  });
}

export interface SeccionNoticias { titulo: string; consulta: string }

const sinEtiquetas = (t: string) => t.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

/** Pinta varias consultas como secciones sin repetir noticias. Falla si no se pudo obtener ninguna. Devuelve el texto y las noticias estructuradas. */
export async function armarNoticias(ctx: Contexto, cabecera: string, secciones: SeccionNoticias[], porSeccion = 4): Promise<{ html: string; grupos: GrupoNoticias[] }> {
  const vistas = new Set<string>();
  const bloques: string[] = [];
  const grupos: GrupoNoticias[] = [];
  let ok = 0;
  let motivo = "";
  // Se piden todas a la vez; luego se recorren en orden para que la deduplicación sea la misma de siempre.
  const respuestas = await Promise.allSettled(secciones.map((s) => noticiasDe(ctx, s.consulta)));
  secciones.forEach((s, i) => {
    const r = respuestas[i];
    if (r.status === "rejected") { motivo ||= String((r.reason as Error)?.message ?? r.reason); bloques.push(`${s.titulo}\n⚠️ <i>No disponible ahora.</i>`); return; }
    const items = r.value.filter((n) => { const k = n.titulo.toLowerCase().slice(0, 60); if (vistas.has(k)) return false; vistas.add(k); return true; }).slice(0, porSeccion);
    ok++;
    const t = s.titulo ? `${s.titulo}\n` : "";
    bloques.push(items.length ? `${t}${items.map(lineaNoticia).join("\n")}` : `${t}<i>Sin novedades.</i>`);
    if (items.length) grupos.push({ titulo: sinEtiquetas(s.titulo), noticias: items.map((n) => ({ titulo: n.titulo, fuente: n.fuente, enlace: n.enlace, fecha: n.fecha, ...(n.imagen ? { imagen: n.imagen } : {}) })) });
  });
  if (ok === 0) throw new Error(motivo || "no se pudo obtener ninguna noticia");
  return { html: [cabecera, ...bloques].join("\n\n"), grupos };
}

export async function resumenNoticias(ctx: Contexto, cabecera: string, secciones: SeccionNoticias[], porSeccion = 4): Promise<string> {
  return (await armarNoticias(ctx, cabecera, secciones, porSeccion)).html;
}

export async function contenidoNoticias(ctx: Contexto): Promise<Contenido> {
  const secciones: SeccionNoticias[] = [
    { titulo: "💶 <b>Economía</b>", consulta: "economía España when:1d" },
    { titulo: "🏛 <b>Política</b>", consulta: "política nacional España when:1d" },
  ];
  const c = ctx.usuario.ciudad;
  if (c) {
    const prov = c.provincia && c.provincia.toLowerCase() !== c.nombre.toLowerCase() ? ` "${c.provincia}"` : "";
    secciones.push(
      { titulo: `🏛 <b>Ayuntamiento de ${esc(c.nombre)}</b>`, consulta: `("Ayuntamiento de ${c.nombre}" OR "alcalde de ${c.nombre}" OR "alcaldesa de ${c.nombre}") España${prov} when:7d` },
      { titulo: `📍 <b>${esc(c.nombre)}</b>`, consulta: `"${c.nombre}" España${prov} when:7d` },
    );
  }
  const r = await armarNoticias(ctx, cabecera("📰", "Noticias del día"), secciones);
  return { html: r.html, grupos: r.grupos, teclado: [NAV_MENU] };
}

export async function contenidoTema(ctx: Contexto, temaId: string): Promise<Contenido> {
  const t = ctx.usuario.temas.find((x) => x.id === temaId);
  if (!t) return { html: "No encuentro ese tema.", teclado: [NAV_MENU] };
  const r = await armarNoticias(ctx, cabecera(esc(t.emoji), esc(t.titulo)), [{ titulo: "", consulta: `${t.consulta} when:2d` }], 7);
  return { html: r.html, grupos: r.grupos, teclado: [NAV_MENU] };
}

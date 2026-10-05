import { esc } from "../canal";
import { Noticia, leerRss, lineaNoticia, urlBingNews, urlGoogleNews } from "../rss";
import { cabecera, cacheado, conReintentos } from "../util";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

/** Cabeceras de navegador: sin ellas algunos buscadores tardan o rechazan las peticiones desde servidores. */
const CABECERAS = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9", Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" };

async function pedirRss(ctx: Contexto, url: string): Promise<Noticia[]> {
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 6000, headers: CABECERAS }), 2, 300);
  const noticias = leerRss(String(r.data));
  if (noticias.length === 0) throw new Error("sin noticias en la respuesta");
  return noticias;
}

/**
 * Noticias de una búsqueda (cacheado 30 min para todos los usuarios). Se piden a la vez a Google News y a Bing News y vale la primera que
 * responda: si una está bloqueada o lenta desde el servidor, la otra salva la sección.
 */
export async function noticiasDe(ctx: Contexto, consulta: string): Promise<Noticia[]> {
  return cacheado(ctx.almacen, `rss:${consulta}`, 30 * 60_000, ctx.ahora, async () => {
    try {
      const lista = await Promise.any([pedirRss(ctx, urlGoogleNews(consulta)), pedirRss(ctx, urlBingNews(consulta))]);
      return lista.sort((a, b) => b.fecha - a.fecha).slice(0, 12);
    } catch (e) {
      const motivos = (e as AggregateError).errors?.map((x: Error) => x.message).join(" · ") ?? (e as Error).message;
      throw new Error(`Google y Bing sin respuesta (${motivos})`.slice(0, 160));
    }
  });
}

export interface SeccionNoticias { titulo: string; consulta: string }

/** Pinta varias consultas como secciones sin repetir noticias. Falla si no se pudo obtener ninguna. */
export async function resumenNoticias(ctx: Contexto, cabecera: string, secciones: SeccionNoticias[], porSeccion = 4): Promise<string> {
  const vistas = new Set<string>();
  const bloques: string[] = [];
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
  });
  if (ok === 0) throw new Error(motivo || "no se pudo obtener ninguna noticia");
  return [cabecera, ...bloques].join("\n\n");
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
  return { html: await resumenNoticias(ctx, cabecera("📰", "Noticias del día"), secciones), teclado: [NAV_MENU] };
}

export async function contenidoTema(ctx: Contexto, temaId: string): Promise<Contenido> {
  const t = ctx.usuario.temas.find((x) => x.id === temaId);
  if (!t) return { html: "No encuentro ese tema.", teclado: [NAV_MENU] };
  return { html: await resumenNoticias(ctx, cabecera(esc(t.emoji), esc(t.titulo)), [{ titulo: "", consulta: `${t.consulta} when:2d` }], 7), teclado: [NAV_MENU] };
}

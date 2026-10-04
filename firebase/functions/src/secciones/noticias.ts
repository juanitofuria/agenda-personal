import { esc } from "../canal";
import { Noticia, leerRss, lineaNoticia, urlGoogleNews } from "../rss";
import { cabecera, cacheado, conReintentos } from "../util";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

/** Pide un RSS de Google News y devuelve las noticias más recientes (cacheado 30 min para todos los usuarios). */
export async function noticiasDe(ctx: Contexto, consulta: string): Promise<Noticia[]> {
  return cacheado(ctx.almacen, `rss:${consulta}`, 30 * 60_000, ctx.ahora, async () => {
    const r = await conReintentos(() => ctx.http.get(urlGoogleNews(consulta), { timeout: 20000 }));
    return leerRss(String(r.data)).sort((a, b) => b.fecha - a.fecha).slice(0, 12);
  });
}

export interface SeccionNoticias { titulo: string; consulta: string }

/** Pinta varias consultas como secciones sin repetir noticias. Falla si no se pudo obtener ninguna. */
export async function resumenNoticias(ctx: Contexto, cabecera: string, secciones: SeccionNoticias[], porSeccion = 4): Promise<string> {
  const vistas = new Set<string>();
  const bloques: string[] = [];
  let ok = 0;
  for (const s of secciones) {
    try {
      const items = (await noticiasDe(ctx, s.consulta)).filter((n) => { const k = n.titulo.toLowerCase().slice(0, 60); if (vistas.has(k)) return false; vistas.add(k); return true; }).slice(0, porSeccion);
      ok++;
      const t = s.titulo ? `${s.titulo}\n` : "";
      bloques.push(items.length ? `${t}${items.map(lineaNoticia).join("\n")}` : `${t}<i>Sin novedades.</i>`);
    } catch {
      bloques.push(`${s.titulo}\n⚠️ <i>No disponible ahora.</i>`);
    }
  }
  if (ok === 0) throw new Error("no se pudo obtener ninguna noticia");
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

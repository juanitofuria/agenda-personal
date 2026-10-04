import { contenidoAgenda } from "./agenda";
import { contenidoHoroscopo } from "./horoscopo";
import { contenidoMercados } from "./mercados";
import { contenidoNoticias, contenidoTema } from "./noticias";
import { contenidoHoraAHora, contenidoLuna, contenidoTiempo } from "./tiempo";
import { Contenido, Contexto } from "./tipos";

export { Contenido, Contexto } from "./tipos";

/**
 * Genera el contenido de una sección. `id` es "tiempo", "noticias", "agenda", "horoscopo", "mercados" o "tema:<id>".
 * Subvistas: "tiempo:horas" y "tiempo:luna".
 */
export async function construirContenido(id: string, ctx: Contexto): Promise<Contenido> {
  switch (id) {
    case "tiempo": return contenidoTiempo(ctx);
    case "tiempo:horas": return contenidoHoraAHora(ctx);
    case "tiempo:luna": return contenidoLuna(ctx);
    case "noticias": return contenidoNoticias(ctx);
    case "agenda": return contenidoAgenda(ctx);
    case "horoscopo": return contenidoHoroscopo(ctx);
    case "mercados": return contenidoMercados(ctx);
    default:
      if (id.startsWith("tema:")) return contenidoTema(ctx, id.slice(5));
      throw new Error(`sección desconocida: ${id}`);
  }
}

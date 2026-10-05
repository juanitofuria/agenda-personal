import { esc, escAttr } from "../canal";
import { fechaIso } from "../fechas";
import { construirDoc, obtenerHoroscopo, urlSegura } from "../horoscopo";
import { signoDe } from "../signos";
import { episodioDeSigno } from "../podcast";
import { MAX_ENTRADA_SENCILLO, validarSencillo } from "../simplificar";
import { cabecera, cacheado, conPlazo } from "../util";
import { Contenido, Contexto, NAV_MENU } from "./tipos";

/** Horóscopo del signo del usuario, leído de `horoscopos/{signo}` (lo escribe cada día la función de actualización). */
export async function contenidoHoroscopo(ctx: Contexto): Promise<Contenido> {
  const nac = ctx.usuario.nacimiento;
  if (!nac) {
    return { html: "🔮 <b>Horóscopo</b>\nPara darte tu horóscopo necesito tu fecha de nacimiento.", teclado: [[{ texto: "🎂 Indicar mi fecha de nacimiento", datos: "p:nacimiento" }], NAV_MENU] };
  }
  const signo = signoDe(nac);
  let doc = await ctx.almacen.getHoroscopo(signo.id);
  // Si aún no está el de hoy (la tarea diaria no ha podido traerlo) se pide ahora mismo y se guarda para los demás.
  const hoyFecha = fechaIso(ctx.ahora, ctx.usuario.zona);
  if ((!doc || doc.fecha !== hoyFecha) && ctx.horoscopoCfg) {
    try {
      const resp = await obtenerHoroscopo(ctx.http, ctx.horoscopoCfg, signo, hoyFecha, 2, 300);
      const nuevo = construirDoc(signo, hoyFecha, resp, ctx.horoscopoCfg, ctx.ahora);
      if (nuevo && (!doc || nuevo.fecha >= doc.fecha)) { doc = nuevo; await ctx.almacen.guardarHoroscopo(signo.id, nuevo).catch(() => undefined); }
    } catch { /* se usa lo que haya guardado */ }
  }
  if (!doc || !doc.prediccion?.trim()) {
    return { html: `🔮 <b>Horóscopo · ${signo.simbolo} ${signo.nombre}</b>\nTodavía no hay horóscopo publicado para hoy. Lo intentaré de nuevo más tarde.`, teclado: [[{ texto: "🔄 Reintentar", datos: "sev:horoscopo" }], NAV_MENU] };
  }
  const hoy = fechaIso(ctx.ahora, ctx.usuario.zona);
  const desactualizado = doc.fecha !== hoy;
  const url = doc.fuenteUrl ? urlSegura(doc.fuenteUrl) : "";
  const original = doc;

  // Texto sencillo (si hay IA) y episodio del podcast, a la vez. Si algo falla se muestra el original y no pasa nada.
  const [sencillo, episodio] = await Promise.all([
    (async () => {
      if (original.sencillo) return original.sencillo;
      if (!ctx.simplificar) return null;
      try {
        const s = validarSencillo(original.prediccion, await conPlazo(ctx.simplificar(original.prediccion.slice(0, MAX_ENTRADA_SENCILLO)), 10_000));
        if (s) await ctx.almacen.guardarHoroscopo(signo.id, { ...original, sencillo: s }).catch(() => undefined); // se guarda: lo piden otros usuarios del mismo signo
        return s;
      } catch { return null; }
    })(),
    (async () => {
      if (!ctx.podcastFeed) return null;
      const feed = ctx.podcastFeed;
      try { return await cacheado(ctx.almacen, `podcast:${signo.id}:${hoy}`, 30 * 60_000, ctx.ahora, () => conPlazo(episodioDeSigno(ctx.http, feed, signo, hoy), 7000)); } catch { return null; }
    })(),
  ]);

  const enlaceFuente = url ? `<a href="${escAttr(url)}">${esc(original.fuente || "20minutos.es")}</a>` : esc(original.fuente || "20minutos.es");
  const pie = sencillo
    ? `✍️ <i>Basado en el horóscopo de ${enlaceFuente}, explicado con palabras sencillas.</i>`
    : `<i>Fuente:</i> ${enlaceFuente}\n<i>Contenido informativo y de entretenimiento; los derechos pertenecen a su editor.</i>`;
  const html = [
    cabecera("🔮", `Horóscopo · ${signo.simbolo} ${signo.nombre}`),
    desactualizado ? `⚠️ <i>Aún no se ha publicado el de hoy: este es el del ${doc.fecha}.</i>` : "",
    esc((sencillo ?? original.prediccion).trim()),
  ].filter(Boolean).join("\n\n") + "\n\n" + pie;
  const botones = episodio ? [[{ texto: episodio.fecha === hoy ? "🎧 Escuchar el podcast de hoy" : `🎧 Escuchar el último podcast (${episodio.fecha.slice(8)}/${episodio.fecha.slice(5, 7)})`, url: episodio.url }]] : [];
  return { html, teclado: [...botones, NAV_MENU] };
}

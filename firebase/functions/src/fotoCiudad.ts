import { Almacen } from "./almacen";
import { HttpGet } from "./util";

/**
 * Foto real de una ciudad para la cabecera del tiempo: la imagen principal de su artículo de Wikipedia (Wikimedia Commons, de libre uso),
 * saltando escudos, banderas, mapas y logotipos. Se guarda 30 días (3 si no hay foto). Sin servicios de pago ni claves.
 */
const CABECERAS = { "User-Agent": "AgendaPersonal/1.0 (bot personal de agenda; contacto: admin@agenda.invalid)", Accept: "application/json" };
const NO_FOTO = /escudo|bandera|flag|coat[_ ]of|mapa|map[_ .-]|locator|logo|sello|firma|plano|situaci[oó]n|ubicaci[oó]n|location|blason|seal|icon|\.svg|\.png|\.gif|\.webm|\.ogv/i;
const API = "https://es.wikipedia.org/api/rest_v1/page";
const TREINTA_DIAS = 30 * 24 * 3600_000, TRES_DIAS = 3 * 24 * 3600_000;

const ampliar = (src: string): string => {
  const u = src.startsWith("//") ? `https:${src}` : src;
  return /^https:\/\/upload\.wikimedia\.org\//.test(u) ? u.replace(/\/\d+px-/, "/800px-") : "";
};

async function buscar(http: HttpGet, titulo: string): Promise<string> {
  const t = encodeURIComponent(titulo.replace(/ /g, "_"));
  const resumen = ((await http.get(`${API}/summary/${t}`, { timeout: 5000, headers: CABECERAS })).data ?? {}) as any;
  if (!resumen || resumen.type !== "standard") return ""; // no existe o es una página de desambiguación
  const lista = ((await http.get(`${API}/media-list/${t}`, { timeout: 5000, headers: CABECERAS, maxBytes: 200_000 }).catch(() => ({ data: {} }))).data ?? {}) as any;
  // Primero intentamos la miniatura principal: suele ser la fotografía representativa de la ciudad.
  const mini = String(resumen.thumbnail?.source ?? "");
  if (mini && !NO_FOTO.test(decodeURIComponent(mini.split("/").pop() ?? "")) && /\.jpe?g/i.test(mini)) return ampliar(mini);

  // Si no hay miniatura, elegimos entre las fotos de la página la que tenga un nombre más claramente urbano.
  const tituloCiudad = titulo.toLowerCase();
  const candidatas = ((lista.items ?? []) as any[])
    .filter((it) => it.type === "image" && /\.jpe?g$|\.webp$/i.test(String(it.title ?? "")) && !NO_FOTO.test(String(it.title ?? "")))
    .map((it) => {
      const titulo = String(it.title ?? "").toLowerCase();
      const src = ampliar(String(it.srcset?.[0]?.src ?? ""));
      if (!src) return null;
      let puntos = 0;
      if (titulo.includes(tituloCiudad)) puntos += 8;
      if (/city|ciudad|centro|centre|plaza|square|calle|street|avenida|avenue|puente|bridge|castillo|castle|iglesia|church|catedral|cathedral|ayuntamiento|town hall|monument|monumento|panoram/.test(titulo)) puntos += 5;
      if (/mountain|montana|montaña|paisaje|landscape|nature|naturaleza|forest|bosque/.test(titulo)) puntos -= 4;
      return { src, puntos };
    }).filter(Boolean) as { src: string; puntos: number }[];
  candidatas.sort((a, b) => b.puntos - a.puntos);
  if (candidatas[0]) return candidatas[0].src;
  return "";
}

export async function fotoCiudad(http: HttpGet, almacen: Almacen, ahora: Date, nombre: string, provincia: string): Promise<string> {
  const clave = `foto:${nombre}|${provincia}`.toLowerCase();
  const guardada = await almacen.cacheGet(clave, ahora).catch(() => null);
  if (guardada !== null) return guardada;
  let url = "";
  const titulos = [...new Set([nombre, provincia && provincia.toLowerCase() !== nombre.toLowerCase() ? `${nombre} (${provincia})` : ""].filter(Boolean))];
  for (const t of titulos) { try { url = await buscar(http, t); } catch { /* se prueba el siguiente */ } if (url) break; }
  await almacen.cacheSet(clave, url, url ? TREINTA_DIAS : TRES_DIAS, ahora).catch(() => undefined);
  return url;
}

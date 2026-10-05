/** Utilidades de prueba: canal y HTTP falsos, y datos de ejemplo con la forma de las APIs reales. */
import { AlmacenMemoria } from "./almacen";
import { Deps } from "./bot/ctx";
import { manejarEntrada } from "./bot/bot";
import { Boton, Canal, Entrada, Teclado } from "./canal";
import { ErrorTelegram } from "./telegram";
import { HttpGet } from "./util";

export interface Enviado { chatId: string; html: string; teclado?: Teclado; editado?: number; id: number; foto?: string }

/** Límites de Telegram para botones inline: callback_data de 1 a 64 bytes, como mucho 100 botones y texto no vacío. */
export function validarTeclado(t?: Teclado): string[] {
  const fallos: string[] = [];
  const botones = (t ?? []).flat();
  if (botones.length > 100) fallos.push(`demasiados botones (${botones.length})`);
  for (const b of botones) {
    if (!b.texto.trim()) fallos.push("botón sin texto");
    if (b.webApp && !/^https:\/\//.test(b.webApp)) fallos.push(`la mini app necesita una dirección https: «${b.webApp}»`);
    else if (!b.url && !b.webApp && (!b.datos || Buffer.byteLength(b.datos) < 1 || Buffer.byteLength(b.datos) > 64)) fallos.push(`callback_data fuera de 1–64 bytes: «${b.datos}» (${b.datos ? Buffer.byteLength(b.datos) : 0})`);
  }
  return fallos;
}

export class CanalFalso implements Canal {
  mensajes: Enviado[] = [];
  /** Incumplimientos de los límites de Telegram detectados al enviar. */
  violaciones: string[] = [];
  callbacks: string[] = [];
  nombreUsuario = async () => "agenda_test_bot";
  borrados: { chatId: string; mensajeId: number }[] = [];
  async enviarFoto(chatId: string, urlFoto: string, html: string, teclado?: Teclado) {
    this.violaciones.push(...validarTeclado(teclado));
    if (html.length > 1000) this.violaciones.push(`pie de foto de ${html.length} caracteres (máx. 1024)`);
    const e = this.falla?.(chatId); if (e) throw e;
    this.mensajes.push({ chatId, html, teclado, foto: urlFoto, id: ++this.n });
  }
  async borrar(chatId: string, mensajeId: number) { this.borrados.push({ chatId, mensajeId }); }
  falla?: (chatId: string) => Error | undefined;
  private n = 100;
  async enviar(chatId: string, html: string, teclado?: Teclado) {
    this.violaciones.push(...validarTeclado(teclado));
    const e = this.falla?.(chatId); if (e) throw e;
    this.mensajes.push({ chatId, html, teclado, id: ++this.n });
  }
  async editar(chatId: string, mensajeId: number, html: string, teclado?: Teclado) {
    this.violaciones.push(...validarTeclado(teclado));
    const e = this.falla?.(chatId); if (e) throw e;
    this.mensajes.push({ chatId, html, teclado, editado: mensajeId, id: mensajeId });
  }
  async responderCallback(id: string) { this.callbacks.push(id); }
  ultimo(chatId?: string): Enviado { const l = this.mensajes.filter((m) => !chatId || m.chatId === chatId); return l[l.length - 1]; }
  textos(chatId?: string) { return this.mensajes.filter((m) => !chatId || m.chatId === chatId).map((m) => m.html); }
  botones(chatId?: string): Boton[] { return (this.ultimo(chatId)?.teclado ?? []).flat(); }
  limpiar() { this.mensajes = []; }
}

export class HttpFalso implements HttpGet {
  rutas: { patron: string | RegExp; respuesta: unknown | (() => unknown) }[] = [];
  llamadas: string[] = [];
  añadir(patron: string | RegExp, respuesta: unknown | (() => unknown)) { this.rutas.unshift({ patron, respuesta }); return this; }
  async get(url: string) {
    this.llamadas.push(url);
    const r = this.rutas.find((x) => (typeof x.patron === "string" ? url.includes(x.patron) : x.patron.test(url)));
    if (!r) throw new Error(`HTTP no previsto en el test: ${url}`);
    const v = typeof r.respuesta === "function" ? (r.respuesta as () => unknown)() : r.respuesta;
    if (v instanceof Error) throw v;
    return { data: v };
  }
}

export interface Banco {
  almacen: AlmacenMemoria; canal: CanalFalso; http: HttpFalso; deps: Deps;
  reloj: { ahora: Date };
  escribir(chatId: string, texto: string, nombre?: string): Promise<void>;
  pulsar(chatId: string, datos: string): Promise<void>;
  /** Pulsa el botón del último mensaje cuyo texto contiene [texto]. */
  pulsarTexto(chatId: string, texto: string): Promise<void>;
}

export function crearBanco(ahora = new Date("2026-10-04T08:00:00Z")): Banco {
  const almacen = new AlmacenMemoria(), canal = new CanalFalso(), http = new HttpFalso();
  const reloj = { ahora };
  const deps: Deps = { almacen, canal, http, ahora: () => reloj.ahora };
  let upd = 0;
  // Cada interacción comprueba que el bot respeta los límites de Telegram.
  const comprobar = () => { if (canal.violaciones.length) throw new Error(`El bot incumple los límites de Telegram: ${canal.violaciones.join("; ")}`); };
  const b: Banco = {
    almacen, canal, http, deps, reloj,
    async escribir(chatId, texto, nombre = "Ana") { await manejarEntrada(deps, { chatId, nombre, updateId: ++upd, texto } satisfies Entrada); comprobar(); },
    async pulsar(chatId, datos) {
      const ult = canal.ultimo(chatId);
      await manejarEntrada(deps, { chatId, nombre: "Ana", updateId: ++upd, callback: { id: `cb${upd}`, datos, mensajeId: ult?.id ?? 1 } });
      comprobar();
    },
    async pulsarTexto(chatId, texto) {
      const bt = canal.botones(chatId).find((x) => x.texto.includes(texto));
      if (!bt?.datos) throw new Error(`no hay botón «${texto}». Botones: ${canal.botones(chatId).map((x) => x.texto).join(" | ")}`);
      await b.pulsar(chatId, bt.datos);
    },
  };
  return b;
}

export const bloqueado = () => new ErrorTelegram("Forbidden: bot was blocked by the user", 403);

// ---------- Datos de ejemplo con la forma de las respuestas reales ----------

/** Open-Meteo forecast (2 días, hora local de la zona) para el día [hoy] yyyy-MM-dd. */
export function previsionFalsa(hoy: string, mañana: string): unknown {
  const times: string[] = [], campos: Record<string, number[]> = { t: [], c: [], p: [], r: [], w: [], h: [], uv: [], g: [], d: [] };
  for (const dia of [hoy, mañana]) for (let h = 0; h < 24; h++) {
    times.push(`${dia}T${String(h).padStart(2, "0")}:00`);
    campos.t.push(Math.round(20 + 8 * Math.sin(((h - 5) / 18) * Math.PI) * 10) / 10);
    campos.c.push(h >= 17 && h <= 21 ? 80 : h < 10 ? 2 : 3);
    campos.p.push(h >= 17 && h <= 21 ? 70 : 5); campos.r.push(h >= 18 && h <= 20 ? 1.2 : 0);
    campos.w.push(4 + (h % 7)); campos.h.push(80 - (h % 24)); campos.uv.push(Math.max(0, Math.round(5 * Math.sin(((h - 7) / 12) * Math.PI) * 10) / 10)); campos.g.push(10 + (h % 9)); campos.d.push(225);
  }
  return {
    hourly: { time: times, temperature_2m: campos.t, weather_code: campos.c, precipitation_probability: campos.p, precipitation: campos.r, wind_speed_10m: campos.w, relative_humidity_2m: campos.h, uv_index: campos.uv, wind_gusts_10m: campos.g, wind_direction_10m: campos.d },
    daily: {
      time: [hoy, mañana], temperature_2m_max: [28.4, 27], temperature_2m_min: [19.2, 18], weather_code: [3, 2],
      sunrise: [`${hoy}T08:12`, `${mañana}T08:13`], sunset: [`${hoy}T19:42`, `${mañana}T19:40`], uv_index_max: [5.4, 5], shortwave_radiation_sum: [17.8, 17],
      wind_speed_10m_max: [24, 20], wind_gusts_10m_max: [41, 30], wind_direction_10m_dominant: [225, 200],
    },
  };
}

export const historicoFalso = (dias = 276) => ({ daily: { precipitation_sum: Array.from({ length: dias }, (_, i) => (i === dias - 1 ? 0.5 : 1.7)) } });

export const geocodingFalso = (nombre = "Montoro") => ({
  results: [
    { name: nombre, admin1: "Andalucía", admin2: "Provincia de Córdoba", country: "España", latitude: 38.02409, longitude: -4.38, timezone: "Europe/Madrid" },
    { name: nombre, admin1: "Estado de Aguascalientes", admin2: "Aguascalientes", country: "México", latitude: 21.75, longitude: -102.3, timezone: "America/Mexico_City" },
  ],
});

/** RSS de Google News con [n] noticias sobre [tema]. */
export function rssFalso(tema: string, n = 5): string {
  const items = Array.from({ length: n }, (_, i) =>
    `<item><title>${tema} noticia ${i + 1} &amp; más - Diario ${i + 1}</title><link>https://news.google.com/rss/articles/${tema.replace(/\W/g, "")}${i}</link><pubDate>Sun, 04 Oct 2026 0${i}:00:00 GMT</pubDate><source url="https://d.example">Diario ${i + 1}</source></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>x</title>${items}</channel></rss>`;
}

/** Yahoo Finance chart: velas diarias hasta [ultimoDia] con cierre [cierre] y el anterior [previo]. */
export function graficoFalso(opts: { precio: number; previo: number; ultimaFecha: string; chartPrev?: number; gmtoffset?: number }): unknown {
  const fin = Date.parse(`${opts.ultimaFecha}T14:30:00Z`) / 1000;
  const ts = [fin - 86400 * 3, fin - 86400 * 2, fin - 86400, fin].map((t) => Math.round(t));
  return { chart: { result: [{ meta: { regularMarketPrice: opts.precio, regularMarketTime: fin, gmtoffset: opts.gmtoffset ?? 0, chartPreviousClose: opts.chartPrev ?? 7000 },
    timestamp: ts, indicators: { quote: [{ close: [opts.previo - 20, opts.previo - 10, opts.previo, opts.precio] }] } }] } };
}

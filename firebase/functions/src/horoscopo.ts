/**
 * Lógica pura del horóscopo diario (sin Firebase), para poder probarla con dobles.
 *
 * Fuente: horoscopefree (https://github.com/vitorebatista/horoscopefree, MIT), una API gratuita sin clave que
 * obtiene el horóscopo de un editor por idioma (en español, de 20minutos.es):
 *
 *   GET {base}/horoscope/{idioma}/{signo}/{fecha}   (signo en inglés y minúsculas; fecha yyyy-MM-dd o today, en UTC)
 *   200 -> { sign, date, language, text, source, cached }
 *   4xx/5xx -> { error: "VALIDATION" | "NOT_FOUND" | "NETWORK" | "PARSE", message }
 *
 * Condición de uso de la API: mostrar la URL `source` junto al texto y respetar los términos del editor original.
 */

export interface Signo {
  id: string;     // identificador del documento en Firestore (español, sin tildes)
  ingles: string; // nombre que espera horoscopefree
  nombre: string; // nombre en español
}

export const SIGNOS: Signo[] = [
  { id: "aries", ingles: "aries", nombre: "Aries" },
  { id: "tauro", ingles: "taurus", nombre: "Tauro" },
  { id: "geminis", ingles: "gemini", nombre: "Géminis" },
  { id: "cancer", ingles: "cancer", nombre: "Cáncer" },
  { id: "leo", ingles: "leo", nombre: "Leo" },
  { id: "virgo", ingles: "virgo", nombre: "Virgo" },
  { id: "libra", ingles: "libra", nombre: "Libra" },
  { id: "escorpio", ingles: "scorpio", nombre: "Escorpio" },
  { id: "sagitario", ingles: "sagittarius", nombre: "Sagitario" },
  { id: "capricornio", ingles: "capricorn", nombre: "Capricornio" },
  { id: "acuario", ingles: "aquarius", nombre: "Acuario" },
  { id: "piscis", ingles: "pisces", nombre: "Piscis" },
];

/** Respuesta correcta de horoscopefree. */
export interface RespuestaApi {
  sign?: string;
  date?: string;
  language?: string;
  text?: string;
  source?: string;
  cached?: boolean;
}

/** Documento `horoscopos/{id}`: es lo que lee la app Android (campos en español). */
export interface HoroscopoDoc {
  signo: string;
  fecha: string;      // yyyy-MM-dd
  prediccion: string;
  idioma: string;     // "es"
  fuente: string;     // nombre legible de la fuente, p. ej. "20minutos.es"
  fuenteUrl: string;  // URL de la página original (hay que mostrarla junto al texto)
  actualizadoEn: string;
}

export interface Config {
  baseUrl: string; // https://horoscopefree.fly.dev, o tu propia instancia
  idioma: string;  // "es"
}

export interface Http {
  get(url: string, opciones?: { timeout?: number }): Promise<{ data: unknown }>;
}

/** Error de la API con el código HTTP y el código `error` de horoscopefree (si lo hay). */
export class ErrorApi extends Error {
  constructor(mensaje: string, readonly estado?: number, readonly codigo?: string) { super(mensaje); }
  /** Transitorio = merece la pena reintentar (red, timeout, 5xx). VALIDATION y NOT_FOUND son errores nuestros. */
  get transitorio(): boolean { return this.estado === undefined || this.estado >= 500; }
}

/** Convierte un error de axios (o similar) en ErrorApi con el mensaje de la API. */
export function comoErrorApi(e: unknown): ErrorApi {
  if (e instanceof ErrorApi) return e;
  const r = (e as { response?: { status?: number; data?: { error?: string; message?: string } } }).response;
  const base = (e as Error).message ?? String(e);
  if (!r) return new ErrorApi(base); // sin respuesta: red o timeout
  const codigo = r.data?.error;
  return new ErrorApi(`HTTP ${r.status}${codigo ? ` ${codigo}` : ""}: ${r.data?.message ?? base}`, r.status, codigo);
}

/** Fecha yyyy-MM-dd en la zona horaria indicada (la de los usuarios, no la del servidor). */
export function fechaEnZona(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

/** "https://www.20minutos.es/horoscopo/aries/" -> "20minutos.es"; si no es una URL se devuelve tal cual. */
export function nombreFuente(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/** Solo se aceptan URLs http(s): el texto se muestra tal cual y el enlace se abrirá en el navegador de los usuarios. */
export function urlSegura(url: unknown): string {
  if (typeof url !== "string") return "";
  try { const u = new URL(url); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : ""; } catch { return ""; }
}

export async function reintentar<T>(fn: () => Promise<T>, intentos: number, esperaMs: number): Promise<T> {
  let ultimo: ErrorApi | undefined;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = comoErrorApi(e);
      if (!ultimo.transitorio) throw ultimo; // reintentar un 400/404 no lo arregla
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo ?? new ErrorApi("sin intentos");
}

export function urlHoroscopo(cfg: Config, signo: Signo, fecha: string): string {
  return `${cfg.baseUrl.replace(/\/+$/, "")}/horoscope/${encodeURIComponent(cfg.idioma)}/${signo.ingles}/${fecha}`;
}

/** Pide el horóscopo de un signo para una fecha. Lanza ErrorApi si la API falla o la respuesta no es utilizable. */
export async function obtenerSigno(http: Http, cfg: Config, signo: Signo, fecha: string, intentos = 3, esperaMs = 2000): Promise<RespuestaApi> {
  const r = await reintentar(() => http.get(urlHoroscopo(cfg, signo, fecha), { timeout: 30000 }), intentos, esperaMs);
  const d = r.data as RespuestaApi | null;
  if (typeof d !== "object" || d === null) throw new ErrorApi(`respuesta no válida de la API para ${signo.id}`, 502, "PARSE");
  return d;
}

export function construirDoc(signo: Signo, fechaPedida: string, d: RespuestaApi, cfg: Config, ahora: Date = new Date()): HoroscopoDoc | null {
  const texto = (d.text ?? "").trim();
  if (!texto) return null; // nunca se guarda un documento vacío: pisaría el último bueno
  const fuenteUrl = urlSegura(d.source);
  return {
    signo: signo.id,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "") ? (d.date as string) : fechaPedida,
    prediccion: texto,
    idioma: d.language || cfg.idioma,
    fuente: fuenteUrl ? nombreFuente(fuenteUrl) : "",
    fuenteUrl,
    actualizadoEn: ahora.toISOString(),
  };
}

export interface Dependencias {
  http: Http;
  config: Config;
  zona: string;
  ahora: Date;
  guardar: (id: string, doc: HoroscopoDoc) => Promise<void>;
  /** Fecha del documento ya guardado: evita pedir lo que ya está al día y pisar con algo más antiguo. */
  fechaGuardada?: (id: string) => Promise<string | undefined>;
  log?: (mensaje: string) => void;
  intentos?: number;
  esperaMs?: number;
}

export interface Resultado { actualizados: string[]; alDia: string[]; omitidos: string[]; fallidos: string[] }

/**
 * Actualiza los 12 signos con el horóscopo de hoy (fecha de la zona de los usuarios).
 * Un fallo en uno no impide actualizar los demás, y los que ya están al día no vuelven a pedirse (la función se ejecuta
 * varias veces al día por si el editor tarda en publicar).
 */
export async function actualizarTodos(dep: Dependencias): Promise<Resultado> {
  const log = dep.log ?? (() => undefined);
  const hoy = fechaEnZona(dep.ahora, dep.zona);
  const res: Resultado = { actualizados: [], alDia: [], omitidos: [], fallidos: [] };
  log(`Actualizando horóscopo para ${hoy}`);
  for (const signo of SIGNOS) {
    try {
      const previa = await dep.fechaGuardada?.(signo.id);
      if (previa === hoy) { res.alDia.push(signo.id); continue; }
      const respuesta = await obtenerSigno(dep.http, dep.config, signo, hoy, dep.intentos ?? 3, dep.esperaMs ?? 2000);
      const doc = construirDoc(signo, hoy, respuesta, dep.config, dep.ahora);
      if (!doc) { res.fallidos.push(signo.id); log(`✗ ${signo.id}: la API no devolvió texto`); continue; }
      if (previa && previa > doc.fecha) { res.omitidos.push(signo.id); log(`= ${signo.id}: ya hay uno más reciente (${previa})`); continue; }
      await dep.guardar(signo.id, doc);
      res.actualizados.push(signo.id);
      log(`✓ ${signo.id} (${doc.fecha}, ${doc.fuente})`);
    } catch (e) {
      res.fallidos.push(signo.id);
      log(`✗ ${signo.id}: ${comoErrorApi(e).message}`);
    }
  }
  return res;
}

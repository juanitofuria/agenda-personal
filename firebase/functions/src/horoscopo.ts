/**
 * Lógica pura del horóscopo diario (sin Firebase), para poder probarla con dobles.
 *
 * Fuente: Aztro (https://github.com/sameerkumar18/aztro), una API gratuita sin clave que se consulta con POST:
 *   POST {base}/?sign=aries&day=today  ->  { current_date, compatibility, lucky_time, lucky_number, color, date_range, mood, description }
 * Los signos van en inglés y el texto viene en inglés, así que se traduce al español si hay traductor.
 */

export interface Signo {
  id: string;     // identificador del documento en Firestore (español, sin tildes)
  aztro: string;  // nombre que usa Aztro
  nombre: string; // nombre en español
}

export const SIGNOS: Signo[] = [
  { id: "aries", aztro: "aries", nombre: "Aries" },
  { id: "tauro", aztro: "taurus", nombre: "Tauro" },
  { id: "geminis", aztro: "gemini", nombre: "Géminis" },
  { id: "cancer", aztro: "cancer", nombre: "Cáncer" },
  { id: "leo", aztro: "leo", nombre: "Leo" },
  { id: "virgo", aztro: "virgo", nombre: "Virgo" },
  { id: "libra", aztro: "libra", nombre: "Libra" },
  { id: "escorpio", aztro: "scorpio", nombre: "Escorpio" },
  { id: "sagitario", aztro: "sagittarius", nombre: "Sagitario" },
  { id: "capricornio", aztro: "capricorn", nombre: "Capricornio" },
  { id: "acuario", aztro: "aquarius", nombre: "Acuario" },
  { id: "piscis", aztro: "pisces", nombre: "Piscis" },
];

export interface AztroRespuesta {
  current_date?: string;
  compatibility?: string;
  lucky_time?: string;
  lucky_number?: string | number;
  color?: string;
  date_range?: string;
  mood?: string;
  description?: string;
}

/** Documento `horoscopos/{id}`: es lo que lee la app Android (campos en español). */
export interface HoroscopoDoc {
  signo: string;
  fecha: string; // yyyy-MM-dd
  prediccion: string;
  idioma: "es" | "en";
  animo: string;
  color: string;
  numeroSuerte: string;
  horaSuerte: string;
  compatibilidad: string;
  rangoFechas: string;
  prediccionOriginal: string;
  fuente: string;
  actualizadoEn: string;
}

export interface Config {
  baseUrl: string;      // p. ej. https://aztro.sameerkumar.website (o tu propia instancia de Aztro)
  pathPlantilla: string; // p. ej. /?sign={signo}&day={dia}
  cabeceras?: Record<string, string>;
}

export interface Http {
  post(url: string, opciones?: { timeout?: number; headers?: Record<string, string> }): Promise<{ data: unknown }>;
}

export type Traductor = (textos: string[]) => Promise<string[]>;

export const FUENTE = "Aztro (astrology.kudosmedia.net)";

/** Fecha yyyy-MM-dd en la zona horaria indicada (la de los usuarios, no la del servidor). */
export function fechaEnZona(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

const MESES: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** "October 4, 2026" -> "2026-10-04"; null si no se reconoce. */
export function parseFechaAztro(texto: string | undefined): string | null {
  const m = /^\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*$/.exec(texto ?? "");
  const mes = m ? MESES[m[1].toLowerCase()] : undefined;
  if (!m || !mes) return null;
  return `${m[3]}-${String(mes).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** "2pm" -> "14:00", "12am" -> "00:00"; si no se reconoce se deja tal cual. */
export function formatearHora(texto: string | undefined): string {
  const t = (texto ?? "").trim();
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(t);
  if (!m) return t;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

export function compatibilidadEs(texto: string | undefined): string {
  const t = (texto ?? "").trim().toLowerCase();
  return SIGNOS.find((s) => s.aztro === t)?.nombre ?? (texto ?? "").trim();
}

export async function reintentar<T>(fn: () => Promise<T>, intentos: number, esperaMs: number): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo;
}

function url(cfg: Config, signo: Signo, dia: "today" | "tomorrow" | "yesterday"): string {
  return cfg.baseUrl.replace(/\/+$/, "") + cfg.pathPlantilla.replace("{signo}", signo.aztro).replace("{dia}", dia);
}

async function pedir(http: Http, cfg: Config, signo: Signo, dia: "today" | "tomorrow" | "yesterday", intentos: number, esperaMs: number): Promise<AztroRespuesta> {
  const r = await reintentar(() => http.post(url(cfg, signo, dia), { timeout: 15000, headers: cfg.cabeceras }), intentos, esperaMs);
  if (typeof r.data !== "object" || r.data === null) throw new Error(`respuesta no válida de la API para ${signo.id}`);
  return r.data as AztroRespuesta;
}

/**
 * Pide el horóscopo del día. Aztro calcula "today" en su propia zona horaria, que puede no coincidir con la de los usuarios:
 * si la fecha devuelta no es la de hoy se prueba con "tomorrow"; si tampoco coincide se guarda con la fecha que trae.
 */
export async function obtenerSigno(
  http: Http, cfg: Config, signo: Signo, hoy: string, intentos = 3, esperaMs = 1500,
): Promise<{ data: AztroRespuesta; fecha: string }> {
  const dia0 = await pedir(http, cfg, signo, "today", intentos, esperaMs);
  const f0 = parseFechaAztro(dia0.current_date);
  if (f0 === hoy || f0 === null) return { data: dia0, fecha: f0 ?? hoy };
  if (f0 < hoy) {
    try {
      const dia1 = await pedir(http, cfg, signo, "tomorrow", intentos, esperaMs);
      if (parseFechaAztro(dia1.current_date) === hoy) return { data: dia1, fecha: hoy };
    } catch { /* se queda con la respuesta de "today" */ }
  }
  return { data: dia0, fecha: f0 };
}

export async function construirDoc(
  signo: Signo, fecha: string, d: AztroRespuesta, traductor?: Traductor, ahora: Date = new Date(),
): Promise<HoroscopoDoc | null> {
  const original = (d.description ?? "").trim();
  if (!original) return null; // nunca se guarda un documento vacío: pisaría el último bueno

  let prediccion = original;
  let animo = (d.mood ?? "").trim();
  let color = (d.color ?? "").trim();
  let idioma: "es" | "en" = "en";
  if (traductor) {
    try {
      const [p, a, c] = await traductor([original, animo || " ", color || " "]);
      if (p && p.trim()) { prediccion = p.trim(); animo = animo ? (a ?? animo).trim() : ""; color = color ? (c ?? color).trim() : ""; idioma = "es"; }
    } catch { /* sin traducción se publica el original en inglés */ }
  }
  return {
    signo: signo.id, fecha, prediccion, idioma, animo, color,
    numeroSuerte: d.lucky_number === undefined ? "" : String(d.lucky_number),
    horaSuerte: formatearHora(d.lucky_time),
    compatibilidad: compatibilidadEs(d.compatibility),
    rangoFechas: (d.date_range ?? "").trim(),
    prediccionOriginal: original,
    fuente: FUENTE,
    actualizadoEn: ahora.toISOString(),
  };
}

export interface Dependencias {
  http: Http;
  config: Config;
  zona: string;
  ahora: Date;
  guardar: (id: string, doc: HoroscopoDoc) => Promise<void>;
  /** Fecha del documento ya guardado (para no pisarlo con uno más antiguo). */
  fechaGuardada?: (id: string) => Promise<string | undefined>;
  traductor?: Traductor;
  log?: (mensaje: string) => void;
  intentos?: number;
  esperaMs?: number;
}

export interface Resultado { actualizados: string[]; omitidos: string[]; fallidos: string[] }

/** Actualiza los 12 signos. Un fallo en uno no impide actualizar los demás. */
export async function actualizarTodos(dep: Dependencias): Promise<Resultado> {
  const log = dep.log ?? (() => undefined);
  const hoy = fechaEnZona(dep.ahora, dep.zona);
  const res: Resultado = { actualizados: [], omitidos: [], fallidos: [] };
  log(`Actualizando horóscopo para ${hoy}`);
  for (const signo of SIGNOS) {
    try {
      const { data, fecha } = await obtenerSigno(dep.http, dep.config, signo, hoy, dep.intentos ?? 3, dep.esperaMs ?? 1500);
      const doc = await construirDoc(signo, fecha, data, dep.traductor, dep.ahora);
      if (!doc) { res.fallidos.push(signo.id); log(`✗ ${signo.id}: la API no devolvió texto`); continue; }
      const previa = await dep.fechaGuardada?.(signo.id);
      if (previa && previa > doc.fecha) { res.omitidos.push(signo.id); log(`= ${signo.id}: ya hay uno más reciente (${previa})`); continue; }
      await dep.guardar(signo.id, doc);
      res.actualizados.push(signo.id);
      log(`✓ ${signo.id} (${doc.fecha}, ${doc.idioma})`);
    } catch (e) {
      res.fallidos.push(signo.id);
      log(`✗ ${signo.id}: ${(e as Error).message}`);
    }
  }
  return res;
}

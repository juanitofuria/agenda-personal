/**
 * Fechas y horas con zona horaria, y lectura de fechas escritas en español ("mañana 18:30", "15/10 9h", "en 2 horas"…).
 * Todo se calcula con Intl (sin librerías), de forma que el horario de verano no desplace los avisos.
 */

export interface Partes { y: number; m: number; d: number; h: number; mi: number; dow: number /* 0=domingo */ }

/** Crear un Intl.DateTimeFormat es lo más caro de estas funciones (y se llama muchas veces): se reutiliza uno por zona. */
const FORMATOS = new Map<string, Intl.DateTimeFormat>();
function formatoPartes(zona: string): Intl.DateTimeFormat {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short",
    });
    FORMATOS.set(zona, f);
  }
  return f;
}

/** Componentes de un instante en una zona horaria. */
export function partesEnZona(fecha: Date, zona: string): Partes {
  const f = formatoPartes(zona).formatToParts(fecha);
  const g = (t: string) => f.find((p) => p.type === t)!.value;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  return { y: +g("year"), m: +g("month"), d: +g("day"), h: +g("hour"), mi: +g("minute"), dow };
}

/** Instante UTC correspondiente a una fecha y hora locales de la zona (resuelve el cambio de hora). */
export function localAUtc(y: number, m: number, d: number, h: number, mi: number, zona: string): Date {
  const nominal = Date.UTC(y, m - 1, d, h, mi);
  let utc = nominal;
  for (let i = 0; i < 3; i++) {
    const p = partesEnZona(new Date(utc), zona);
    const visto = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    const desfase = visto - utc; // offset de la zona en ese instante
    const siguiente = nominal - desfase;
    if (siguiente === utc) break;
    utc = siguiente;
  }
  return new Date(utc);
}

/** yyyy-MM-dd en la zona. */
export function fechaIso(fecha: Date, zona: string): string {
  const p = partesEnZona(fecha, zona);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function sumarDias(y: number, m: number, d: number, dias: number): { y: number; m: number; d: number } {
  const t = new Date(Date.UTC(y, m - 1, d + dias));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** "07:30" -> [7, 30]; null si no es una hora válida. */
export function parseHoraHHMM(texto: string): [number, number] | null {
  const m = /^\s*(\d{1,2})[:.hH](\d{2})\s*$/.exec(texto) ?? /^\s*(\d{1,2})\s*[hH]?\s*$/.exec(texto);
  if (!m) return null;
  const h = +m[1]; const mi = m[2] === undefined ? 0 : +m[2];
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59 ? [h, mi] : null;
}

export function formatoHHMM(h: number, mi: number): string { return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`; }

/** Próxima vez que, en la zona, sean las [hhmm]: hoy si aún no ha pasado, si no mañana. */
export function proximaOcurrencia(hhmm: string, zona: string, desde: Date): Date {
  const [h, mi] = parseHoraHHMM(hhmm) ?? [8, 0];
  const p = partesEnZona(desde, zona);
  const hoy = localAUtc(p.y, p.m, p.d, h, mi, zona);
  if (hoy.getTime() > desde.getTime()) return hoy;
  const n = sumarDias(p.y, p.m, p.d, 1);
  return localAUtc(n.y, n.m, n.d, h, mi, zona);
}

export type Repeticion = "ninguna" | "diaria" | "semanal" | "laborables" | "anual";

/** Siguiente repetición conservando la hora local. */
export function siguienteRepeticion(fecha: Date, rep: Repeticion, zona: string): Date | null {
  if (rep === "ninguna") return null;
  const p = partesEnZona(fecha, zona);
  if (rep === "anual") return localAUtc(p.y + 1, p.m, p.m === 2 && p.d === 29 ? 28 : p.d, p.h, p.mi, zona); // el 29 de febrero pasa al 28 en los años sin él
  let dias = 1;
  if (rep === "semanal") dias = 7;
  if (rep === "laborables") { const sig = (p.dow + 1) % 7; dias = sig === 6 ? 3 : sig === 0 ? 2 : 1; }
  const n = sumarDias(p.y, p.m, p.d, dias);
  return localAUtc(n.y, n.m, n.d, p.h, p.mi, zona);
}

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "mar 15 oct · 18:30" */
export function formatearFechaHora(fecha: Date, zona: string, ahora?: Date): string {
  const p = partesEnZona(fecha, zona);
  const hora = formatoHHMM(p.h, p.mi);
  if (ahora) {
    const a = partesEnZona(ahora, zona);
    const dif = Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
    if (dif === 0) return `hoy · ${hora}`;
    if (dif === 1) return `mañana · ${hora}`;
  }
  return `${DIAS_CORTOS[p.dow]} ${p.d} ${MESES_CORTOS[p.m - 1]} · ${hora}`;
}

export interface FechaLeida { utc: Date; horaPorDefecto: boolean; pasada: boolean }

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * Interpreta una fecha y hora escritas en español. Admite:
 *  - relativas: "en 30 min", "en 2 horas", "en 3 días"
 *  - día: "hoy", "mañana", "pasado mañana", "lunes", "15/10", "15/10/2026", "15 de octubre"
 *  - hora: "18:30", "18.30", "18h", "a las 9", "9 pm", "9:30 de la tarde"
 * Sin hora se usa las 09:00 (y se indica con `horaPorDefecto`). Sin día se toma hoy, o mañana si la hora ya pasó.
 */
export function parseFechaHora(texto: string, ahora: Date, zona: string): FechaLeida | null {
  let t = sinTildes(texto).replace(/\s+/g, " ");
  if (!t) return null;

  // Relativas.
  const rel = /^en (\d{1,3}) ?(min|minuto|minutos|h|hora|horas|d|dia|dias|semana|semanas)$/.exec(t);
  if (rel) {
    const n = +rel[1]; const u = rel[2];
    const ms = u.startsWith("min") ? n * 60_000 : u.startsWith("h") ? n * 3_600_000 : u.startsWith("s") ? n * 7 * 86_400_000 : n * 86_400_000;
    const utc = new Date(ahora.getTime() + ms);
    return { utc, horaPorDefecto: false, pasada: false };
  }

  // Hora (se extrae del texto y se quita para analizar el día).
  let hora: [number, number] | null = null;
  // 1) hh:mm o hh.mm o 18h explícitos
  let m = /\b(\d{1,2})[:.](\d{2})\b ?(am|pm|de la manana|de la tarde|de la noche)?/.exec(t) ?? /\b(\d{1,2}) ?h\b ?(am|pm)?/.exec(t);
  // 2) "a las 9" / "9 pm" / "6 de la tarde"
  if (!m) {
    m = /\b(?:a las|a la|sobre las) (\d{1,2})\b ?(am|pm|de la manana|de la tarde|de la noche)?/.exec(t)
      ?? /\b(\d{1,2}) ?(am|pm|de la manana|de la tarde|de la noche)\b/.exec(t);
  }
  if (m) {
    let h = +m[1]; const mi = m[2] !== undefined && /^\d{2}$/.test(m[2]) ? +m[2] : 0;
    const suf = m[m.length - 1] && /am|pm|manana|tarde|noche/.test(m[m.length - 1] ?? "") ? m[m.length - 1] : undefined;
    if (suf && (suf === "pm" || suf.includes("tarde") || suf.includes("noche")) && h < 12) h += 12;
    if (suf && (suf === "am" || suf.includes("manana")) && h === 12) h = 0;
    if (h > 23 || mi > 59) return null;
    hora = [h, mi];
    t = t.replace(m[0], " ").replace(/\s+/g, " ").trim();
  }

  const p = partesEnZona(ahora, zona);
  let dia: { y: number; m: number; d: number } | null = null;

  const fecha = /(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/.exec(t);
  const largo = new RegExp(`(\\d{1,2}) (?:de )?(${MESES.join("|")})(?: (?:de )?(\\d{4}))?`).exec(t);
  if (fecha) {
    const d = +fecha[1]; const mo = +fecha[2]; let y = fecha[3] ? +fecha[3] : p.y; if (y < 100) y += 2000;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    dia = { y, m: mo, d };
    if (!fecha[3] && localAUtc(y, mo, d, 23, 59, zona) < ahora) dia = { y: y + 1, m: mo, d }; // sin año y ya pasó: el año que viene
  } else if (largo) {
    const d = +largo[1]; const mo = MESES.indexOf(largo[2]) + 1; let y = largo[3] ? +largo[3] : p.y;
    dia = { y, m: mo, d };
    if (!largo[3] && localAUtc(y, mo, d, 23, 59, zona) < ahora) dia = { y: y + 1, m: mo, d };
  } else if (/\bayer\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, -1);
  else if (/\bpasado manana\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, 2);
  else if (/\bmanana\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, 1);
  else if (/\bhoy\b/.test(t)) dia = { y: p.y, m: p.m, d: p.d };
  else {
    const wd = DIAS_SEMANA.findIndex((n) => new RegExp(`\\b${n}\\b`).test(t));
    if (wd >= 0) {
      let dias = (wd - p.dow + 7) % 7;
      if (dias === 0 && hora && localAUtc(p.y, p.m, p.d, hora[0], hora[1], zona) <= ahora) dias = 7;
      dia = sumarDias(p.y, p.m, p.d, dias);
    } else if (t.replace(/\b(a las|a la|sobre las|sobre la|de|el|la|del)\b/g, "").trim() !== "" && hora === null) {
      return null; // texto que no se entiende
    } else if (t.replace(/\b(a las|a la|sobre las|sobre la|de|el|la|del)\b/g, "").trim() !== "") {
      return null;
    }
  }
  if (!dia && !hora) return null;

  const horaPorDefecto = hora === null;
  const [h, mi] = hora ?? [9, 0];
  if (!dia) { // solo hora: hoy si falta, si no mañana
    let utc = localAUtc(p.y, p.m, p.d, h, mi, zona);
    if (utc <= ahora) { const n = sumarDias(p.y, p.m, p.d, 1); utc = localAUtc(n.y, n.m, n.d, h, mi, zona); }
    return { utc, horaPorDefecto, pasada: false };
  }
  const utc = localAUtc(dia.y, dia.m, dia.d, h, mi, zona);
  return { utc, horaPorDefecto, pasada: utc.getTime() <= ahora.getTime() };
}

/** Fecha de nacimiento "dd/mm/aaaa" (también con - o .). Devuelve yyyy-MM-dd o null si no es válida o es futura. */
export function parseNacimiento(texto: string, hoy: Date = new Date()): string | null {
  const m = /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\s*$/.exec(texto);
  if (!m) return null;
  const d = +m[1]; const mo = +m[2]; const y = +m[3];
  const f = new Date(Date.UTC(y, mo - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== mo - 1 || f.getUTCDate() !== d) return null; // 31/02/1990…
  if (f.getTime() > hoy.getTime() || y < 1900) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

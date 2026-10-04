import { localAUtc, partesEnZona } from "./fechas";

/**
 * Fases de la Luna calculadas sin red con el algoritmo de Jean Meeus ("Astronomical Algorithms", cap. 49):
 * instante de cada luna nueva y llena con error de pocos minutos. La fase de un día se obtiene de su posición entre dos
 * lunas nuevas reales y la llena intermedia.
 */
const SINODICO = 29.530588861;
const EPOCA_JD = 2451550.09766; // luna nueva de enero de 2000
const DELTA_T_DIAS = 69 / 86400; // TT − UT aproximado

const rad = (d: number) => (d * Math.PI) / 180;
const sin = Math.sin;

/** Instante (día juliano, UT) de la luna nueva o llena número n. */
function eventoJd(n: number, llena: boolean): number {
  const k = n + (llena ? 0.5 : 0);
  const t = k / 1236.85, t2 = t * t, t3 = t2 * t, t4 = t3 * t;
  let jde = EPOCA_JD + SINODICO * k + 0.00015437 * t2 - 0.00000015 * t3 + 0.00000000073 * t4;
  const e = 1 - 0.002516 * t - 0.0000074 * t2;
  const m = rad(2.5534 + 29.1053567 * k - 0.0000014 * t2 - 0.00000011 * t3);
  const mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4);
  const f = rad(160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4);
  const om = rad(124.7746 - 1.56375588 * k + 0.0020672 * t2 + 0.00000215 * t3);
  const comun = -0.00111 * sin(mp - 2 * f) - 0.00057 * sin(mp + 2 * f) + 0.00056 * e * sin(2 * mp + m) - 0.00042 * sin(3 * mp) +
    0.00042 * e * sin(m + 2 * f) + 0.00038 * e * sin(m - 2 * f) - 0.00024 * e * sin(2 * mp - m) - 0.00017 * sin(om) - 0.00007 * sin(mp + 2 * m);
  jde += llena
    ? -0.40614 * sin(mp) + 0.17302 * e * sin(m) + 0.01614 * sin(2 * mp) + 0.01043 * sin(2 * f) + 0.00734 * e * sin(mp - m) - 0.00515 * e * sin(mp + m) + 0.00209 * e * e * sin(2 * m) + comun
    : -0.4072 * sin(mp) + 0.17241 * e * sin(m) + 0.01608 * sin(2 * mp) + 0.01039 * sin(2 * f) + 0.00739 * e * sin(mp - m) - 0.00514 * e * sin(mp + m) + 0.00208 * e * e * sin(2 * m) + comun;
  return jde - DELTA_T_DIAS;
}

const aJd = (d: Date) => d.getTime() / 86_400_000 + 2440587.5;
const deJd = (jd: number) => new Date(Math.round((jd - 2440587.5) * 86_400_000));

/** Ciclo real que contiene al instante: [luna nueva anterior, llena intermedia, luna nueva siguiente]. */
function cicloEn(jd: number): [number, number, number] {
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 2; n++) {
    const ant = eventoJd(n, false), sig = eventoJd(n + 1, false);
    if (ant <= jd && jd < sig) return [ant, eventoJd(n, true), sig];
  }
  throw new Error("sin ciclo lunar");
}

/** Posición en el ciclo al mediodía local del día: 0 = nueva, 0,5 = llena, → 1 = nueva siguiente. */
function fraccion(y: number, m: number, d: number, zona: string): number {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  const [ant, llena, sig] = cicloEn(jd);
  return jd < llena ? (0.5 * (jd - ant)) / (llena - ant) : 0.5 + (0.5 * (jd - llena)) / (sig - llena);
}

export interface FaseLunar { emoji: string; nombre: string }
const FASES: FaseLunar[] = [
  { emoji: "🌑", nombre: "Luna nueva" }, { emoji: "🌒", nombre: "Luna creciente" }, { emoji: "🌓", nombre: "Cuarto creciente" }, { emoji: "🌔", nombre: "Gibosa creciente" },
  { emoji: "🌕", nombre: "Luna llena" }, { emoji: "🌖", nombre: "Gibosa menguante" }, { emoji: "🌗", nombre: "Cuarto menguante" }, { emoji: "🌘", nombre: "Luna menguante" },
];

/**
 * Fase del día. Nueva, cuartos y llena solo se asignan al día en que ocurren (el que tiene su mediodía a menos de medio día);
 * los días vecinos muestran la fase intermedia, así un calendario no repite 🌕 varios días seguidos.
 */
export function faseDelDia(y: number, m: number, d: number, zona: string): FaseLunar {
  const f = fraccion(y, m, d, zona);
  const medioDia = 0.5 / SINODICO;
  let idx = Math.floor(f * 8 + 0.5) % 8;
  if (idx % 2 === 0) {
    const centro = idx / 8;
    let dist = Math.abs(f - centro);
    if (idx === 0) dist = Math.min(dist, Math.abs(f - 1));
    if (dist > medioDia) {
      const antes = idx === 0 ? f > 0.5 : f < centro;
      idx = (antes ? idx - 1 + 8 : idx + 1) % 8;
    }
  }
  return FASES[idx];
}

/** Fracción iluminada (0–1) y edad en días. */
export function iluminacion(y: number, m: number, d: number, zona: string): number {
  return (1 - Math.cos(2 * Math.PI * fraccion(y, m, d, zona))) / 2;
}
export function edadDias(y: number, m: number, d: number, zona: string): number {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  return jd - cicloEn(jd)[0];
}

/** Instante de la próxima luna nueva (llena = false) o llena, a partir de [desde]. */
export function proximoEvento(desde: Date, llena: boolean): Date {
  const jd = aJd(desde);
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 3; n++) { const e = eventoJd(n, llena); if (e >= jd) return deJd(e); }
  throw new Error("sin evento lunar");
}

/** Día (en la zona) de la próxima luna nueva o llena. */
export function proximoDia(y: number, m: number, d: number, llena: boolean, zona: string): { y: number; m: number; d: number } {
  const p = partesEnZona(proximoEvento(localAUtc(y, m, d, 0, 0, zona), llena), zona);
  return { y: p.y, m: p.m, d: p.d };
}

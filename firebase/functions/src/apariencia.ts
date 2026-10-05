import { partesEnZona } from "./fechas";
import { Usuario } from "./modelo";

/** Sin ciudad guardada se usa el centro de España. */
const LAT_DEFECTO = 40.4, LON_DEFECTO = -3.7;
const RAD = Math.PI / 180;

export interface SolDia { amanece: Date | null; anochece: Date | null; /** true: el sol no se pone (o no sale) todo el día */ polar: "dia" | "noche" | null }

/** Amanecer y anochecer (sol a 0,833° bajo el horizonte, algoritmo NOAA) del día local `y-m-d` en esa latitud/longitud. Sin red. */
export function solDelDia(y: number, m: number, d: number, lat: number, lon: number): SolDia {
  const base = Date.UTC(y, m - 1, d);
  const doy = Math.round((base - Date.UTC(y, 0, 1)) / 864e5) + 1;
  const g = (2 * Math.PI / 365) * (doy - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const c = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(dec)) - Math.tan(lat * RAD) * Math.tan(dec);
  if (c > 1) return { amanece: null, anochece: null, polar: "noche" };
  if (c < -1) return { amanece: null, anochece: null, polar: "dia" };
  const ha = Math.acos(c) / RAD;
  const en = (min: number) => new Date(base + Math.round(min) * 60000);
  return { amanece: en(720 - 4 * (lon + ha) - eq), anochece: en(720 - 4 * (lon - ha) - eq), polar: null };
}

const coords = (u: Pick<Usuario, "ciudad">) => ({ lat: u.ciudad?.lat ?? LAT_DEFECTO, lon: u.ciudad?.lon ?? LON_DEFECTO });

export function solDeUsuario(u: Pick<Usuario, "ciudad" | "zona">, ahora: Date): SolDia {
  const p = partesEnZona(ahora, u.zona), { lat, lon } = coords(u);
  return solDelDia(p.y, p.m, p.d, lat, lon);
}

/** Modo que toca ahora: el elegido o, si es `auto`, oscuro desde el anochecer hasta el amanecer de la ciudad del usuario. */
export function modoEfectivo(u: Pick<Usuario, "modo" | "ciudad" | "zona">, ahora: Date): "claro" | "oscuro" {
  if (u.modo !== "auto") return u.modo;
  const s = solDeUsuario(u, ahora);
  if (s.polar) return s.polar === "dia" ? "claro" : "oscuro";
  return ahora < s.amanece! || ahora >= s.anochece! ? "oscuro" : "claro";
}

const hora = (f: Date, zona: string) => { const p = partesEnZona(f, zona); return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };

/** «amanece 08:12 · anochece 19:41» en la hora local del usuario. */
export function textoSol(u: Pick<Usuario, "ciudad" | "zona">, ahora: Date): string {
  const s = solDeUsuario(u, ahora);
  if (s.polar) return s.polar === "dia" ? "hoy el sol no se pone" : "hoy el sol no sale";
  return `amanece ${hora(s.amanece!, u.zona)} · anochece ${hora(s.anochece!, u.zona)}`;
}

export const textoModo = (u: Pick<Usuario, "modo">): string => (u.modo === "auto" ? "Automático · oscuro del anochecer al amanecer" : u.modo === "oscuro" ? "Oscuro" : "Claro");

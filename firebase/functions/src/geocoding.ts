import { Ciudad } from "./modelo";
import { HttpGet, conReintentos } from "./util";

export interface Lugar extends Ciudad { zona: string; etiqueta: string }

/** Busca municipios con la API de geocodificación de Open-Meteo (gratuita, sin clave). */
export async function buscarLugares(http: HttpGet, consulta: string): Promise<Lugar[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(consulta.trim())}&count=5&language=es&format=json`;
  const r = await conReintentos(() => http.get(url, { timeout: 15000 }), 2, 800);
  const res = ((r.data as any)?.results ?? []) as any[];
  return res.filter((x) => typeof x.latitude === "number" && typeof x.longitude === "number").map((x) => {
    const provincia = String(x.admin2 ?? "").replace(/^Provincia de /, "") || String(x.admin1 ?? "");
    return {
      nombre: String(x.name), provincia, lat: x.latitude, lon: x.longitude, zona: String(x.timezone ?? "Europe/Madrid"),
      etiqueta: [x.name, x.admin2, x.admin1, x.country].filter(Boolean).join(", "),
    };
  });
}

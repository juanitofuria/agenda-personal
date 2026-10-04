import { SeccionId } from "../modelo";

export interface Interes { emoji: string; titulo: string; consulta: string }

/** Temas de noticias que se pueden elegir al empezar (cada uno crea una sección con su aviso diario). */
export const TEMAS: Interes[] = [
  { emoji: "⚽", titulo: "Fútbol", consulta: "fútbol" },
  { emoji: "🏀", titulo: "Baloncesto", consulta: "baloncesto OR NBA OR ACB" },
  { emoji: "🏍", titulo: "Motociclismo", consulta: "MotoGP OR motociclismo OR Superbike" },
  { emoji: "🏎", titulo: "Fórmula 1", consulta: "Fórmula 1" },
  { emoji: "🎾", titulo: "Tenis", consulta: "tenis" },
  { emoji: "🚴", titulo: "Ciclismo", consulta: "ciclismo" },
  { emoji: "💻", titulo: "Tecnología", consulta: "tecnología novedades" },
  { emoji: "🎮", titulo: "Videojuegos", consulta: "videojuegos" },
  { emoji: "🎬", titulo: "Cine y series", consulta: "cine OR series estrenos" },
  { emoji: "🎵", titulo: "Música", consulta: "música conciertos" },
  { emoji: "🍳", titulo: "Cocina", consulta: "recetas cocina" },
  { emoji: "✈️", titulo: "Viajes", consulta: "viajes turismo" },
  { emoji: "🧘", titulo: "Salud y bienestar", consulta: "salud bienestar" },
  { emoji: "🔬", titulo: "Ciencia", consulta: "ciencia descubrimiento" },
  { emoji: "🌿", titulo: "Naturaleza", consulta: "naturaleza medio ambiente" },
  { emoji: "🚗", titulo: "Motor", consulta: "coches motor novedades" },
  { emoji: "🛡", titulo: "Ciberseguridad", consulta: "ciberseguridad" },
  { emoji: "₿", titulo: "Criptomonedas", consulta: "bitcoin criptomonedas" },
  { emoji: "📚", titulo: "Libros", consulta: "libros literatura" },
  { emoji: "🏡", titulo: "Vivienda", consulta: "vivienda alquiler precios" },
  { emoji: "🐶", titulo: "Mascotas", consulta: "mascotas" },
  { emoji: "🎨", titulo: "Cultura y arte", consulta: "cultura exposiciones" },
];

export const SECCIONES_BASICAS: SeccionId[] = ["tiempo", "noticias", "mercados", "agenda", "horoscopo"];

/** "Ajedrez, pesca deportiva" -> ["Ajedrez", "Pesca deportiva"] */
export function separarIntereses(texto: string): string[] {
  return texto.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean).map((t) => t.slice(0, 40)).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 10);
}

export const slug = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tema";

/**
 * Texto sencillo: el mismo horóscopo explicado con palabras fáciles. Es una ayuda para entenderlo mejor, NO un modo de ocultar de dónde viene:
 * el bot sigue indicando que se basa en el horóscopo original.
 */
export const INSTRUCCION_SENCILLO =
  "Eres un redactor que explica con palabras sencillas. Reescribe el texto que te doy en español claro y cercano, con frases cortas y vocabulario " +
  "de uso diario, para que lo entienda cualquier persona. Mantén las mismas ideas y el mismo tono; no añadas consejos, datos ni predicciones " +
  "nuevos ni quites ideas importantes. No menciones fuentes ni uses listas ni títulos. Responde solo con el texto reescrito, en un único párrafo.";

/** Texto máximo que se envía al modelo. */
export const MAX_ENTRADA_SENCILLO = 1500;

/**
 * Comprueba que lo que devuelve el modelo sirve: no vacío, longitud parecida al original (ni un resumen mínimo ni un texto inventado mucho más largo)
 * y en español. Devuelve el texto limpio o null.
 */
export function validarSencillo(original: string, salida: unknown): string | null {
  if (typeof salida !== "string") return null;
  const t = salida.replace(/^\s*["«]|["»]\s*$/g, "").replace(/\s+/g, " ").trim();
  const o = original.replace(/\s+/g, " ").trim();
  if (t.length < Math.max(40, o.length * 0.4) || t.length > o.length * 1.8) return null;
  if (/\b(the|and|your|you)\b/i.test(t) && !/\b(el|la|de|que|y)\b/i.test(t)) return null; // salió en inglés
  if (t === o) return null; // sin cambios: no aporta
  return t;
}

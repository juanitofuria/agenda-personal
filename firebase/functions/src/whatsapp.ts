/**
 * Mensajes de WhatsApp «en un toque»: WhatsApp no deja enviar nada sin que la persona pulse enviar, así que el aviso programado lleva un enlace
 * (wa.me) que abre WhatsApp con el contacto y el texto ya escritos.
 */

/** Teléfono solo con dígitos y prefijo de país (sin «+»). Un número español de 9 cifras recibe el 34. Devuelve null si no parece un teléfono. */
export function normalizarTelefono(texto: string): string | null {
  let d = texto.replace(/[\s().-]/g, "");
  if (d.startsWith("+")) d = d.slice(1); else if (d.startsWith("00")) d = d.slice(2);
  else if (/^[6-9]\d{8}$/.test(d)) d = "34" + d; // móvil o fijo español sin prefijo
  return /^\d{8,15}$/.test(d) ? d : null;
}

export interface MensajeWa { para: string; telefono: string; texto: string }

/** Enlace que abre WhatsApp con el mensaje escrito. Sin teléfono, WhatsApp deja elegir a quién se envía. */
export const enlaceWhatsApp = (m: Pick<MensajeWa, "telefono" | "texto">): string =>
  `https://wa.me/${m.telefono}?text=${encodeURIComponent(m.texto)}`;

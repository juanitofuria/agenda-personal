/** Canal de mensajería (Telegram hoy; WhatsApp u otro mañana): lo único que el bot necesita de él. */
export interface Boton { texto: string; datos?: string; url?: string }
export type Teclado = Boton[][];

export interface Entrada {
  chatId: string;
  nombre: string;
  /** Nombre de usuario de Telegram (@alias), si lo tiene. */
  usuario?: string;
  updateId: number;
  texto?: string;
  callback?: { id: string; datos: string; mensajeId: number };
  /** El usuario ha bloqueado o abandonado el bot. */
  bloqueado?: boolean;
}

export interface Canal {
  /** Envía un mensaje HTML (se trocea si es largo; el teclado va en el último trozo). */
  enviar(chatId: string, html: string, teclado?: Teclado): Promise<void>;
  /** Edita un mensaje anterior (si no se puede, envía uno nuevo). */
  editar(chatId: string, mensajeId: number, html: string, teclado?: Teclado): Promise<void>;
  responderCallback(callbackId: string, texto?: string): Promise<void>;
  /** Nombre de usuario del propio bot (para construir enlaces de invitación). */
  nombreUsuario?(): Promise<string | undefined>;
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

/** Trocea un texto HTML en mensajes de como mucho [max] caracteres, cortando entre párrafos o líneas (nunca dentro de una etiqueta). */
export function trocear(html: string, max = 3800): string[] {
  if (html.length <= max) return [html];
  const partes: string[] = [];
  let actual = "";
  const empujar = () => { if (actual.trim()) partes.push(actual.trimEnd()); actual = ""; };
  for (const bloque of html.split(/\n\n/)) {
    const candidato = actual ? `${actual}\n\n${bloque}` : bloque;
    if (candidato.length <= max) { actual = candidato; continue; }
    empujar();
    if (bloque.length <= max) { actual = bloque; continue; }
    for (const linea of bloque.split("\n")) {
      const c = actual ? `${actual}\n${linea}` : linea;
      if (c.length <= max) { actual = c; continue; }
      empujar();
      // Línea más larga que el máximo: se parte en trozos (mejor en un espacio) para no perder texto.
      let resto = linea;
      while (resto.length > max) {
        const corte = resto.lastIndexOf(" ", max);
        const n = corte > max / 2 ? corte : max;
        partes.push(resto.slice(0, n).trimEnd());
        resto = resto.slice(n).trimStart();
      }
      actual = resto;
    }
  }
  empujar();
  return partes;
}

import { Boton, Canal, Entrada, Teclado, trocear } from "./canal";

export interface HttpPost {
  post(url: string, cuerpo?: unknown, opciones?: { timeout?: number }): Promise<{ data: any }>;
}

/** Error de la API de Telegram (p. ej. 403 si el usuario bloqueó el bot). */
export class ErrorTelegram extends Error {
  constructor(mensaje: string, readonly codigo?: number) { super(mensaje); }
  get bloqueado() { return this.codigo === 403; }
}

function aMarkup(teclado?: Teclado) {
  if (!teclado || teclado.length === 0) return undefined;
  return {
    inline_keyboard: teclado.map((fila) => fila.map((b: Boton) => (b.url ? { text: b.texto, url: b.url } : { text: b.texto, callback_data: b.datos ?? "noop" }))),
  };
}

export class CanalTelegram implements Canal {
  constructor(private token: string, private http: HttpPost) {}

  private async llamar(metodo: string, cuerpo: Record<string, unknown>): Promise<any> {
    try {
      const r = await this.http.post(`https://api.telegram.org/bot${this.token}/${metodo}`, cuerpo, { timeout: 20000 });
      return r.data;
    } catch (e) {
      const resp = (e as { response?: { status?: number; data?: { description?: string } } }).response;
      throw new ErrorTelegram(resp?.data?.description ?? (e as Error).message, resp?.status);
    }
  }

  async enviar(chatId: string, html: string, teclado?: Teclado) {
    const partes = trocear(html);
    for (let i = 0; i < partes.length; i++) {
      await this.llamar("sendMessage", {
        chat_id: chatId, text: partes[i], parse_mode: "HTML", disable_web_page_preview: true,
        reply_markup: i === partes.length - 1 ? aMarkup(teclado) : undefined,
      });
    }
  }

  async editar(chatId: string, mensajeId: number, html: string, teclado?: Teclado) {
    if (html.length > 3900) return this.enviar(chatId, html, teclado);
    try {
      await this.llamar("editMessageText", {
        chat_id: chatId, message_id: mensajeId, text: html, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: aMarkup(teclado) ?? { inline_keyboard: [] },
      });
    } catch (e) {
      if (e instanceof ErrorTelegram && /not modified/i.test(e.message)) return; // nada que cambiar
      if (e instanceof ErrorTelegram && e.bloqueado) throw e;
      await this.enviar(chatId, html, teclado); // el mensaje original ya no se puede editar
    }
  }

  async responderCallback(callbackId: string, texto?: string) {
    try { await this.llamar("answerCallbackQuery", { callback_query_id: callbackId, text: texto }); } catch { /* no es crítico */ }
  }
}

/** Convierte una actualización de Telegram en una Entrada normalizada (null si no nos interesa). */
export function leerActualizacion(u: any): Entrada | null {
  if (!u || typeof u.update_id !== "number") return null;
  const bloqueo = u.my_chat_member;
  if (bloqueo && bloqueo.chat?.type === "private" && ["kicked", "left"].includes(bloqueo.new_chat_member?.status)) {
    return { chatId: String(bloqueo.chat.id), nombre: "", updateId: u.update_id, bloqueado: true };
  }
  if (u.callback_query) {
    const c = u.callback_query;
    const chat = c.message?.chat;
    if (!chat || chat.type !== "private" || typeof c.data !== "string") return null;
    return {
      chatId: String(chat.id), nombre: c.from?.first_name ?? "", updateId: u.update_id,
      callback: { id: String(c.id), datos: c.data, mensajeId: c.message.message_id },
    };
  }
  const m = u.message;
  if (m && m.chat?.type === "private" && typeof m.text === "string") {
    return { chatId: String(m.chat.id), nombre: m.from?.first_name ?? "", updateId: u.update_id, texto: m.text };
  }
  return null;
}

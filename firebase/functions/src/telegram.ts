import { Boton, Canal, Entrada, Teclado, trocear } from "./canal";

export interface HttpPost {
  post(url: string, cuerpo?: unknown, opciones?: { timeout?: number }): Promise<{ data: any }>;
}

/** Error de la API de Telegram (p. ej. 403 si el usuario bloqueó el bot). */
export class ErrorTelegram extends Error {
  constructor(mensaje: string, readonly codigo?: number) { super(mensaje); }
  /**
   * El usuario ha bloqueado el bot, ha borrado su cuenta o lo ha expulsado. Telegram lo dice en la descripción del 403
   * («Forbidden: bot was blocked by the user», «user is deactivated»…); un 403 sin eso (un proxy, un cortafuegos) no cuenta.
   */
  get bloqueado() { return this.codigo === 403 && /blocked|deactivated|kicked|initiate|not a member|chat not found/i.test(this.message); }
}

function aMarkup(teclado?: Teclado, colores = true) {
  if (!teclado || teclado.length === 0) return undefined;
  return {
    inline_keyboard: teclado.map((fila) => fila.map((b: Boton) => {
      const color = colores && b.color ? { style: b.color } : {};
      return b.webApp ? { text: b.texto, web_app: { url: b.webApp }, ...color } : b.url ? { text: b.texto, url: b.url, ...color } : { text: b.texto, callback_data: b.datos ?? "noop", ...color };
    })),
  };
}
const tieneColores = (t?: Teclado) => !!t?.some((f) => f.some((b) => b.color));

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

  /** Botones de colores: si la API los rechaza (versión que no los admite), se reintenta sin colores y no se vuelve a intentar. */
  private sinColores = false;
  private async conColores(teclado: Teclado | undefined, f: (markup: ReturnType<typeof aMarkup>) => Promise<any>): Promise<any> {
    if (!tieneColores(teclado) || this.sinColores) return f(aMarkup(teclado, false));
    try { return await f(aMarkup(teclado, true)); }
    catch (e) {
      if (e instanceof ErrorTelegram && e.codigo === 400) { this.sinColores = true; return f(aMarkup(teclado, false)); }
      throw e;
    }
  }

  async enviar(chatId: string, html: string, teclado?: Teclado) {
    const partes = trocear(html);
    for (let i = 0; i < partes.length; i++) {
      const ultimo = i === partes.length - 1;
      await this.conColores(ultimo ? teclado : undefined, (markup) => this.llamar("sendMessage", {
        chat_id: chatId, text: partes[i], parse_mode: "HTML", disable_web_page_preview: true, reply_markup: ultimo ? markup : undefined,
      }));
    }
  }

  async enviarFoto(chatId: string, urlFoto: string, html: string, teclado?: Teclado) {
    if (html.length > 1000) return this.enviar(chatId, html, teclado); // el pie de una foto admite 1024 caracteres
    try {
      await this.conColores(teclado, (markup) => this.llamar("sendPhoto", { chat_id: chatId, photo: urlFoto, caption: html, parse_mode: "HTML", reply_markup: markup }));
    } catch (e) {
      if (e instanceof ErrorTelegram && e.bloqueado) throw e;
      await this.enviar(chatId, html, teclado); // Telegram no ha podido bajar la imagen: al menos llega el texto
    }
  }

  async borrar(chatId: string, mensajeId: number) {
    try { await this.llamar("deleteMessage", { chat_id: chatId, message_id: mensajeId }); } catch { /* no es crítico */ }
  }

  async editar(chatId: string, mensajeId: number, html: string, teclado?: Teclado) {
    if (html.length > 3900) return this.enviar(chatId, html, teclado);
    try {
      await this.conColores(teclado, (markup) => this.llamar("editMessageText", {
        chat_id: chatId, message_id: mensajeId, text: html, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: markup ?? { inline_keyboard: [] },
      }));
    } catch (e) {
      if (e instanceof ErrorTelegram && /not modified/i.test(e.message)) return; // nada que cambiar
      if (e instanceof ErrorTelegram && e.bloqueado) throw e;
      // Si el mensaje es una foto (el menú con cabecera) no se puede convertir en texto: se borra y se envía uno nuevo.
      if (e instanceof ErrorTelegram && /no text in the message to edit/i.test(e.message)) await this.borrar(chatId, mensajeId);
      await this.enviar(chatId, html, teclado); // el mensaje original ya no se puede editar
    }
  }

  private alias?: string;
  async nombreUsuario() {
    if (!this.alias) { try { this.alias = (await this.llamar("getMe", {}))?.result?.username; } catch { /* sin enlace */ } }
    return this.alias;
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
      chatId: String(chat.id), nombre: c.from?.first_name ?? "", ...(c.from?.username ? { usuario: String(c.from.username) } : {}), updateId: u.update_id,
      callback: { id: String(c.id), datos: c.data, mensajeId: c.message.message_id },
    };
  }
  const m = u.message;
  if (m && m.chat?.type === "private" && typeof m.text === "string") {
    return { chatId: String(m.chat.id), nombre: m.from?.first_name ?? "", ...(m.from?.username ? { usuario: String(m.from.username) } : {}), updateId: u.update_id, texto: m.text };
  }
  return null;
}

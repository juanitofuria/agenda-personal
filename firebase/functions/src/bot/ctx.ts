import { Almacen } from "../almacen";
import { Canal, Entrada, Teclado } from "../canal";
import { Estado, Usuario } from "../modelo";
import { HttpGet } from "../util";

export interface Deps {
  almacen: Almacen; canal: Canal; http: HttpGet; ahora: () => Date;
  /**
   * Opcional. Si la plataforma limita el trabajo por ejecución (Cloudflare gratuito: 10 ms de CPU y 50 peticiones), puede construir y enviar
   * cada sección en una ejecución propia. Devuelve true si la delegó; false (o error) y el bot la construye él mismo.
   * `editar`: id del mensaje a sustituir (navegación dentro de una sección).
   */
  delegarSeccion?: (p: { uid: string; ref: string; editar?: number }) => Promise<boolean>;
}

/** Contexto de una interacción: quién escribe, qué ha pulsado/escrito y cómo responderle. */
export class Ctx {
  constructor(readonly deps: Deps, public u: Usuario, readonly entrada: Entrada) {}

  get ahora(): Date { return this.deps.ahora(); }
  get almacen(): Almacen { return this.deps.almacen; }
  get texto(): string { return (this.entrada.texto ?? "").trim(); }

  /** Responde editando el mensaje del botón pulsado; si el usuario escribió, envía uno nuevo. */
  async responder(html: string, teclado?: Teclado): Promise<void> {
    const cb = this.entrada.callback;
    if (cb) await this.deps.canal.editar(this.u.id, cb.mensajeId, html, teclado);
    else await this.deps.canal.enviar(this.u.id, html, teclado);
  }

  /** Envía siempre un mensaje nuevo (para no perder el menú anterior). */
  async nuevo(html: string, teclado?: Teclado): Promise<void> { await this.deps.canal.enviar(this.u.id, html, teclado); }

  async guardar(): Promise<void> { await this.almacen.guardarUsuario(this.u); }

  /** Pone al usuario a la espera de un texto en [flujo]/[paso]. */
  async esperar(flujo: string, paso: string, datos: Record<string, unknown> = {}): Promise<void> {
    this.u.estado = { flujo, paso, datos };
    await this.guardar();
  }
  async terminarFlujo(): Promise<void> { this.u.estado = null; await this.guardar(); }

  get estado(): Estado | null { return this.u.estado; }
}

export const BTN_MENU = { texto: "🏠 Menú", datos: "m:menu" };
export const BTN_CANCELAR = { texto: "❌ Cancelar", datos: "x:cancelar" };

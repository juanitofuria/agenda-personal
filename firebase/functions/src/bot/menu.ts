import { Ctx } from "./ctx";
import { menuPrincipal } from "./vistas";

/**
 * Muestra el menú principal. Con cabecera (imagen) si el bot sabe su dirección pública y el canal sabe enviar fotos; si no, solo texto.
 * Un mensaje de texto no se puede convertir en foto, así que, si se llega desde un botón, se borra el mensaje anterior y se envía el menú nuevo.
 */
export async function mostrarMenu(c: Ctx): Promise<void> {
  const m = menuPrincipal(c.u, c.esAdmin, c.deps.urlBase, c.ahora);
  const cb = c.entrada.callback;
  if (c.deps.urlBase) await c.deps.canal.botonApp?.(c.u.id, "📱 Agenda", `${c.deps.urlBase.replace(/\/+$/, "")}/app/`); // el botón de abajo también abre la app
  if (m.foto && c.deps.canal.enviarFoto) {
    if (cb) await c.deps.canal.borrar?.(c.u.id, cb.mensajeId);
    await c.deps.canal.enviarFoto(c.u.id, m.foto, m.html, m.teclado);
    return;
  }
  if (cb) await c.responder(m.html, m.teclado); else await c.nuevo(m.html, m.teclado);
}

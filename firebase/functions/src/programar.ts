import { Almacen, idProgramacion } from "./almacen";
import { momentoAviso, ORDEN_SECCIONES, Evento, Usuario } from "./modelo";
import { proximaOcurrencia, siguienteRepeticion } from "./fechas";

/** (Re)programa el envío diario de una sección o tema según su configuración. */
export async function programarSeccion(almacen: Almacen, u: Usuario, ref: string, ahora: Date): Promise<void> {
  const id = idProgramacion(u.id, "seccion", ref);
  const cfg = ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref as keyof Usuario["secciones"]];
  if (!cfg || !cfg.activa || !u.activo) { await almacen.borrarProgramacion(id); return; }
  await almacen.guardarProgramacion({ id, uid: u.id, tipo: "seccion", ref, proximo: proximaOcurrencia(cfg.hora, u.zona, ahora) });
}

/** Reprograma todas las secciones y temas del usuario (tras cambiar de ciudad/zona, o al terminar la configuración). */
export async function sincronizarSecciones(almacen: Almacen, u: Usuario, ahora: Date): Promise<void> {
  await almacen.borrarProgramacionesDe(u.id, "seccion");
  for (const s of ORDEN_SECCIONES) await programarSeccion(almacen, u, s, ahora);
  for (const t of u.temas) await programarSeccion(almacen, u, `tema:${t.id}`, ahora);
}

/** Si un evento repetitivo ya pasó, lo adelanta a su próxima ocurrencia futura. */
export function adelantarRepeticion(e: Evento, zona: string, ahora: Date): Evento {
  let f = e.fechaHora;
  if (!f || e.repeticion === "ninguna") return e;
  let guard = 0;
  while (f && momentoAviso({ ...e, fechaHora: f })!.getTime() <= ahora.getTime() && guard++ < 800) f = siguienteRepeticion(f, e.repeticion, zona);
  return f ? { ...e, fechaHora: f } : e;
}

/** (Re)programa el aviso de un evento. Sin fecha, ya avisado o ya pasado no se programa nada. */
export async function programarEvento(almacen: Almacen, e: Evento, zona: string, ahora: Date): Promise<Evento> {
  const id = idProgramacion(e.uid, "evento", e.id);
  let ev = adelantarRepeticion(e, zona, ahora);
  const aviso = momentoAviso(ev);
  if (!aviso || ev.hecho || (ev.avisado && ev.repeticion === "ninguna") || aviso.getTime() <= ahora.getTime()) {
    await almacen.borrarProgramacion(id);
    return ev;
  }
  if (ev.avisado) ev = { ...ev, avisado: false }; // repetitivo rearmado
  await almacen.guardarProgramacion({ id, uid: ev.uid, tipo: "evento", ref: ev.id, proximo: aviso });
  return ev;
}

export const idPosponer = (uid: string, eventoId: string) => idProgramacion(uid, "evento", `posponer_${eventoId}`);

export async function posponerEvento(almacen: Almacen, uid: string, eventoId: string, minutos: number, ahora: Date): Promise<Date> {
  const proximo = new Date(ahora.getTime() + minutos * 60_000);
  await almacen.guardarProgramacion({ id: idPosponer(uid, eventoId), uid, tipo: "evento", ref: eventoId, proximo, posponer: true });
  return proximo;
}

export async function cancelarEvento(almacen: Almacen, uid: string, eventoId: string): Promise<void> {
  await almacen.borrarProgramacion(idProgramacion(uid, "evento", eventoId));
  await almacen.borrarProgramacion(idPosponer(uid, eventoId));
  await almacen.borrarEvento(uid, eventoId);
}

import { Almacen } from "./almacen";
import { Canal } from "./canal";
import { mensajeAviso } from "./bot/eventos";
import { proximaOcurrencia, siguienteRepeticion } from "./fechas";
import { Evento, momentoAviso, Programacion, SeccionId, Usuario } from "./modelo";
import { construirContenido } from "./secciones";
import { ErrorTelegram } from "./telegram";
import { HttpGet } from "./util";

export interface DepsTick { almacen: Almacen; canal: Canal; http: HttpGet; ahora: () => Date; log?: (m: string) => void }

const MAX_SECCION_RETRASO = 3 * 3_600_000;  // un resumen de hace más de 3 h ya no sirve
const MAX_EVENTO_RETRASO = 24 * 3_600_000;  // un aviso de hace más de 1 día se descarta
const REINTENTO_SECCION_MS = 10 * 60_000, MAX_INTENTOS_SECCION = 3;
const REINTENTO_EVENTO_MS = 2 * 60_000, MAX_INTENTOS_EVENTO = 5;

export interface ResultadoTick { enviados: number; omitidos: number; fallidos: number }

function configSeccion(u: Usuario, ref: string): { activa: boolean; hora: string } | undefined {
  return ref.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref) : u.secciones[ref as SeccionId];
}

async function bloquear(dep: DepsTick, u: Usuario): Promise<void> {
  u.activo = false;
  await dep.almacen.guardarUsuario(u);
  await dep.almacen.borrarProgramacionesDe(u.id);
}

async function enviarSeccion(dep: DepsTick, u: Usuario, p: Programacion, ahora: Date, r: ResultadoTick): Promise<void> {
  const cfg = configSeccion(u, p.ref);
  if (!cfg || !cfg.activa) { await dep.almacen.borrarProgramacion(p.id); return; }
  const siguiente = proximaOcurrencia(cfg.hora, u.zona, ahora);
  if (!(await dep.almacen.reclamarProgramacion(p.id, p.proximo, siguiente))) { r.omitidos++; return; } // otra ejecución se ha adelantado
  if (ahora.getTime() - p.proximo.getTime() > MAX_SECCION_RETRASO) { r.omitidos++; return; }
  try {
    const cont = await construirContenido(p.ref, { usuario: u, http: dep.http, almacen: dep.almacen, ahora });
    await dep.canal.enviar(u.id, cont.html, cont.teclado);
    if (p.intentos) await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
    r.enviados++;
  } catch (e) {
    if (e instanceof ErrorTelegram && e.bloqueado) { await bloquear(dep, u); r.fallidos++; return; }
    r.fallidos++;
    dep.log?.(`✗ ${u.id} ${p.ref}: ${(e as Error).message}`);
    const n = (p.intentos ?? 0) + 1;
    // Reintento en unos minutos; pasados los intentos se espera a la siguiente ocurrencia.
    if (n <= MAX_INTENTOS_SECCION) await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_SECCION_MS), intentos: n });
    else await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
  }
}

async function enviarEvento(dep: DepsTick, u: Usuario, p: Programacion, ahora: Date, r: ResultadoTick): Promise<void> {
  const ev = await dep.almacen.getEvento(u.id, p.ref);
  if (!ev || ev.hecho) { await dep.almacen.borrarProgramacion(p.id); return; }
  const retraso = ahora.getTime() - p.proximo.getTime();

  // Se reclama antes de enviar para que dos ejecuciones simultáneas no manden el mismo aviso.
  let nuevoEvento: Evento | null = null;
  let siguiente: Date;
  if (p.posponer || ev.repeticion === "ninguna") {
    siguiente = new Date(ahora.getTime() + 24 * 3_600_000); // se borrará al terminar
  } else {
    let f = ev.fechaHora;
    let guarda = 0;
    do { f = f ? siguienteRepeticion(f, ev.repeticion, u.zona) : null; } while (f && momentoAviso({ ...ev, fechaHora: f })!.getTime() <= ahora.getTime() && guarda++ < 800);
    if (!f) { await dep.almacen.borrarProgramacion(p.id); return; }
    nuevoEvento = { ...ev, fechaHora: f, avisado: false };
    siguiente = momentoAviso(nuevoEvento)!;
  }
  if (!(await dep.almacen.reclamarProgramacion(p.id, p.proximo, siguiente))) { r.omitidos++; return; }

  if (retraso > MAX_EVENTO_RETRASO) { r.omitidos++; } else {
    try {
      const { html, teclado } = mensajeAviso(ev, u.zona, ahora, retraso > 10 * 60_000);
      await dep.canal.enviar(u.id, html, teclado);
      r.enviados++;
    } catch (e) {
      if (e instanceof ErrorTelegram && e.bloqueado) { await bloquear(dep, u); r.fallidos++; return; }
      r.fallidos++;
      dep.log?.(`✗ ${u.id} evento ${ev.id}: ${(e as Error).message}`);
      const n = (p.intentos ?? 0) + 1;
      if (n <= MAX_INTENTOS_EVENTO) { await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_EVENTO_MS), intentos: n }); return; }
    }
  }

  if (nuevoEvento) { await dep.almacen.guardarEvento(nuevoEvento); return; } // repetitivo: ya queda reprogramado
  await dep.almacen.borrarProgramacion(p.id);
  if (!p.posponer) await dep.almacen.guardarEvento({ ...ev, avisado: true });
}

/** Envía todo lo que ha vencido (se ejecuta cada minuto). */
export async function tick(dep: DepsTick, limite = 150): Promise<ResultadoTick> {
  const ahora = dep.ahora();
  const r: ResultadoTick = { enviados: 0, omitidos: 0, fallidos: 0 };
  const vencidas = await dep.almacen.programacionesVencidas(ahora, limite);
  for (const p of vencidas) {
    try {
      const u = await dep.almacen.getUsuario(p.uid);
      if (!u || !u.activo) { await dep.almacen.borrarProgramacion(p.id); continue; }
      if (p.tipo === "seccion") await enviarSeccion(dep, u, p, ahora, r); else await enviarEvento(dep, u, p, ahora, r);
    } catch (e) {
      r.fallidos++;
      dep.log?.(`✗ programación ${p.id}: ${(e as Error).message}`);
    }
  }
  return r;
}

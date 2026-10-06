import { Almacen } from "./almacen";
import { fechaIso, partesEnZona } from "./fechas";
import { ORDEN_SECCIONES, Usuario } from "./modelo";
import { Contenido, Contexto } from "./secciones/tipos";
import { textoPlano } from "./webpush";

/**
 * Los resúmenes que se han pedido (o enviado) hoy se guardan para mostrarlos en la pantalla principal de la app sin volver a prepararlos.
 * Por cada sección y día hay dos entradas en la caché: una pequeña (hora y vista previa, que va en cada actualización de la app)
 * y otra con el contenido completo (solo se lee al abrir la sección).
 */
const VIGENCIA_MS = 36 * 3600_000;
const claveP = (uid: string, fecha: string, ref: string) => `rp:${uid}:${fecha}:${ref}`;
const claveC = (uid: string, fecha: string, ref: string) => `rc:${uid}:${fecha}:${ref}`;
/** Solo las secciones completas se guardan (no sus subpantallas, como «tiempo:horas»). */
const esSeccion = (ref: string) => !ref.includes(":") || ref.startsWith("tema:");

export interface ResumenGuardado { ref: string; hora: string; previa: string }
export interface ContenidoGuardado { html: string; teclado?: Contenido["teclado"]; grupos?: Contenido["grupos"]; hora: string }

export async function guardarResumen(ctx: Contexto, ref: string, c: Contenido): Promise<void> {
  if (!esSeccion(ref)) return;
  const u = ctx.usuario, fecha = fechaIso(ctx.ahora, u.zona), hora = ctx.ahora.toISOString();
  const previa = c.grupos?.[0]?.noticias[0]?.titulo ?? textoPlano(c.html, 150);
  await ctx.almacen.cacheSet(claveP(u.id, fecha, ref), JSON.stringify({ hora, previa }), VIGENCIA_MS, ctx.ahora);
  await ctx.almacen.cacheSet(claveC(u.id, fecha, ref), JSON.stringify({ html: c.html, teclado: c.teclado, grupos: c.grupos, hora } satisfies ContenidoGuardado), VIGENCIA_MS, ctx.ahora);
}

/** Resúmenes de hoy (en la zona del usuario), en el orden de las secciones y luego los temas. */
export async function resumenesDeHoy(almacen: Almacen, u: Usuario, ahora: Date): Promise<ResumenGuardado[]> {
  const fecha = fechaIso(ahora, u.zona);
  const refs = [...ORDEN_SECCIONES.map(String), ...u.temas.map((t) => `tema:${t.id}`)];
  const r = await almacen.cacheGetVarios(refs.map((x) => claveP(u.id, fecha, x)), ahora);
  const res: ResumenGuardado[] = [];
  for (const ref of refs) {
    const v = r[claveP(u.id, fecha, ref)];
    if (!v) continue;
    try { const p = JSON.parse(v) as { hora: string; previa: string }; res.push({ ref, hora: p.hora, previa: p.previa }); } catch { /* entrada dañada: se ignora */ }
  }
  return res;
}

export async function leerResumen(almacen: Almacen, u: Usuario, ref: string, ahora: Date): Promise<ContenidoGuardado | null> {
  const v = esSeccion(ref) ? await almacen.cacheGet(claveC(u.id, fechaIso(ahora, u.zona), ref), ahora) : null;
  try { return v ? (JSON.parse(v) as ContenidoGuardado) : null; } catch { return null; }
}

export const horaLocal = (iso: string, zona: string): string => { const p = partesEnZona(new Date(iso), zona); return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`; };

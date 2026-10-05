import { Acceso, Evento, HoroscopoDoc, Invitacion, Programacion, Solicitud, Usuario } from "./modelo";

/** Persistencia. En producción es Firestore; en los tests, una versión en memoria. */
export interface Almacen {
  getUsuario(id: string): Promise<Usuario | null>;
  guardarUsuario(u: Usuario): Promise<void>;
  /** Borra al usuario con sus eventos y programaciones (derecho al olvido). */
  borrarUsuario(id: string): Promise<void>;

  listarEventos(uid: string): Promise<Evento[]>;
  getEvento(uid: string, id: string): Promise<Evento | null>;
  /** Guarda el evento; si no tiene id se le asigna uno. Devuelve el evento guardado. */
  guardarEvento(e: Omit<Evento, "id"> & { id?: string }): Promise<Evento>;
  borrarEvento(uid: string, id: string): Promise<void>;

  guardarProgramacion(p: Programacion): Promise<void>;
  borrarProgramacion(id: string): Promise<void>;
  borrarProgramacionesDe(uid: string, tipo?: Programacion["tipo"]): Promise<void>;
  programacionesVencidas(hasta: Date, limite: number): Promise<Programacion[]>;
  /** Mueve `proximo` solo si sigue valiendo `esperado` (evita que dos ejecuciones envíen lo mismo). */
  reclamarProgramacion(id: string, esperado: Date, nuevo: Date): Promise<boolean>;

  getHoroscopo(signoId: string): Promise<HoroscopoDoc | null>;
  guardarHoroscopo(signoId: string, doc: HoroscopoDoc): Promise<void>;

  // Control de acceso (solo se usa si hay administrador configurado)
  getAcceso(id: string): Promise<Acceso | null>;
  guardarAcceso(a: Acceso): Promise<void>;
  borrarAcceso(id: string): Promise<void>;
  listarAccesos(): Promise<Acceso[]>;
  guardarInvitacion(i: Invitacion): Promise<void>;
  /** Usa una invitación si existe, no ha caducado y vale para [uid] (las que llevan `para` solo valen para esa persona). Atómico: solo una persona puede usarla. */
  consumirInvitacion(codigo: string, uid: string, ahora: Date): Promise<Invitacion | null>;
  borrarInvitacionesPara(uid: string): Promise<void>;
  getSolicitud(id: string): Promise<Solicitud | null>;
  guardarSolicitud(s: Solicitud): Promise<void>;
  borrarSolicitud(id: string): Promise<void>;
  listarSolicitudes(estado?: Solicitud["estado"]): Promise<Solicitud[]>;

  cacheGet(clave: string, ahora: Date): Promise<string | null>;
  cacheSet(clave: string, valor: string, ttlMs: number, ahora: Date): Promise<void>;
}

export function idProgramacion(uid: string, tipo: Programacion["tipo"], ref: string): string {
  return `${uid}__${tipo}__${ref}`.replace(/\//g, "_");
}

/** Almacén en memoria para los tests. */
export class AlmacenMemoria implements Almacen {
  usuarios = new Map<string, Usuario>();
  eventos = new Map<string, Evento>(); // clave uid/id
  programaciones = new Map<string, Programacion>();
  horoscopos = new Map<string, HoroscopoDoc>();
  cache = new Map<string, { valor: string; expira: number }>();
  accesos = new Map<string, Acceso>();
  invitaciones = new Map<string, Invitacion>();
  solicitudes = new Map<string, Solicitud>();
  private seq = 0;

  async getUsuario(id: string) { const u = this.usuarios.get(id); return u ? structuredClone(u) : null; }
  async guardarUsuario(u: Usuario) { this.usuarios.set(u.id, structuredClone(u)); }
  async borrarUsuario(id: string) {
    this.usuarios.delete(id);
    for (const k of [...this.eventos.keys()]) if (k.startsWith(`${id}/`)) this.eventos.delete(k);
    await this.borrarProgramacionesDe(id);
  }
  async listarEventos(uid: string) { return [...this.eventos.values()].filter((e) => e.uid === uid).map((e) => structuredClone(e)); }
  async getEvento(uid: string, id: string) { const e = this.eventos.get(`${uid}/${id}`); return e ? structuredClone(e) : null; }
  async guardarEvento(e: Omit<Evento, "id"> & { id?: string }) {
    const guardado = { ...e, id: e.id ?? `ev${++this.seq}` } as Evento;
    this.eventos.set(`${guardado.uid}/${guardado.id}`, structuredClone(guardado));
    return structuredClone(guardado);
  }
  async borrarEvento(uid: string, id: string) { this.eventos.delete(`${uid}/${id}`); }
  async guardarProgramacion(p: Programacion) { this.programaciones.set(p.id, structuredClone(p)); }
  async borrarProgramacion(id: string) { this.programaciones.delete(id); }
  async borrarProgramacionesDe(uid: string, tipo?: Programacion["tipo"]) {
    for (const [k, p] of [...this.programaciones]) if (p.uid === uid && (!tipo || p.tipo === tipo)) this.programaciones.delete(k);
  }
  async programacionesVencidas(hasta: Date, limite: number) {
    return [...this.programaciones.values()].filter((p) => p.proximo.getTime() <= hasta.getTime())
      .sort((a, b) => a.proximo.getTime() - b.proximo.getTime()).slice(0, limite).map((p) => structuredClone(p));
  }
  async reclamarProgramacion(id: string, esperado: Date, nuevo: Date) {
    const p = this.programaciones.get(id);
    if (!p || p.proximo.getTime() !== esperado.getTime()) return false;
    p.proximo = new Date(nuevo);
    return true;
  }
  async getHoroscopo(signoId: string) { return this.horoscopos.get(signoId) ?? null; }
  async guardarHoroscopo(signoId: string, doc: HoroscopoDoc) { this.horoscopos.set(signoId, structuredClone(doc)); }
  async getAcceso(id: string) { const a = this.accesos.get(id); return a ? structuredClone(a) : null; }
  async guardarAcceso(a: Acceso) { this.accesos.set(a.id, structuredClone(a)); }
  async borrarAcceso(id: string) { this.accesos.delete(id); }
  async listarAccesos() { return [...this.accesos.values()].map((a) => structuredClone(a)); }
  async guardarInvitacion(i: Invitacion) { this.invitaciones.set(i.codigo, structuredClone(i)); }
  async consumirInvitacion(codigo: string, uid: string, ahora: Date) {
    const i = this.invitaciones.get(codigo);
    if (!i || i.caduca.getTime() <= ahora.getTime() || (i.para && i.para !== uid)) return null;
    this.invitaciones.delete(codigo);
    return structuredClone(i);
  }
  async borrarInvitacionesPara(uid: string) { for (const [k, i] of [...this.invitaciones]) if (i.para === uid) this.invitaciones.delete(k); }
  async getSolicitud(id: string) { const s = this.solicitudes.get(id); return s ? structuredClone(s) : null; }
  async guardarSolicitud(s: Solicitud) { this.solicitudes.set(s.id, structuredClone(s)); }
  async borrarSolicitud(id: string) { this.solicitudes.delete(id); }
  async listarSolicitudes(estado?: Solicitud["estado"]) { return [...this.solicitudes.values()].filter((s) => !estado || s.estado === estado).sort((x, y) => x.fecha.getTime() - y.fecha.getTime()).map((s) => structuredClone(s)); }

  async cacheGet(clave: string, ahora: Date) {
    const c = this.cache.get(clave);
    return c && c.expira > ahora.getTime() ? c.valor : null;
  }
  async cacheSet(clave: string, valor: string, ttlMs: number, ahora: Date) { this.cache.set(clave, { valor, expira: ahora.getTime() + ttlMs }); }
}

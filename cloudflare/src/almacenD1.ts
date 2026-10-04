import { Almacen } from "../../firebase/functions/src/almacen";
import { Evento, HoroscopoDoc, Programacion, Usuario } from "../../firebase/functions/src/modelo";
import { Repeticion } from "../../firebase/functions/src/fechas";

/** Subconjunto de la API de D1 que usamos (así se puede probar con SQLite en los tests). */
export interface D1Sentencia {
  bind(...valores: unknown[]): D1Sentencia;
  run(): Promise<{ meta?: { changes?: number } }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
export interface D1Like {
  prepare(sql: string): D1Sentencia;
  batch(sentencias: D1Sentencia[]): Promise<unknown>;
}

const aFecha = (v: unknown): Date | null => (typeof v === "string" || typeof v === "number" ? new Date(v) : null);

export function usuarioDesdeJson(id: string, d: Record<string, any>): Usuario {
  return {
    id, nombre: d.nombre ?? "", nacimiento: d.nacimiento ?? null, zona: d.zona ?? "Europe/Madrid", ciudad: d.ciudad ?? null,
    secciones: d.secciones ?? {}, temas: d.temas ?? [], estado: d.estado ?? null, onboardingHecho: !!d.onboardingHecho,
    activo: d.activo !== false, ultimoUpdate: d.ultimoUpdate ?? 0, creadoEn: aFecha(d.creadoEn) ?? new Date(0),
  };
}

export function eventoDesdeJson(uid: string, id: string, d: Record<string, any>): Evento {
  return {
    id, uid, tipo: d.tipo, titulo: d.titulo ?? "", lugar: d.lugar ?? "", fechaHora: aFecha(d.fechaHora),
    antelacionMin: d.antelacionMin ?? 0, repeticion: (d.repeticion ?? "ninguna") as Repeticion, avisado: !!d.avisado,
    hecho: !!d.hecho, creadoEn: aFecha(d.creadoEn) ?? new Date(0),
  };
}

function programacionDesdeFila(f: { id: string; uid: string; tipo: string; proximo: number; datos: string }): Programacion {
  const d = JSON.parse(f.datos) as { ref: string; posponer?: boolean; intentos?: number };
  return { id: f.id, uid: f.uid, tipo: f.tipo as Programacion["tipo"], ref: d.ref, proximo: new Date(f.proximo), posponer: d.posponer, intentos: d.intentos };
}

const nuevoId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12); // corto: va dentro de callback_data (máx. 64 bytes)

export class AlmacenD1 implements Almacen {
  constructor(private db: D1Like) {}

  async getUsuario(id: string) {
    const f = await this.db.prepare("SELECT datos FROM usuarios WHERE id = ?").bind(id).first<{ datos: string }>();
    return f ? usuarioDesdeJson(id, JSON.parse(f.datos)) : null;
  }
  async guardarUsuario(u: Usuario) {
    const { id, ...resto } = u;
    await this.db.prepare("INSERT INTO usuarios (id, datos) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET datos = excluded.datos")
      .bind(id, JSON.stringify(resto)).run();
  }
  async borrarUsuario(id: string) {
    await this.db.batch([
      this.db.prepare("DELETE FROM eventos WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM usuarios WHERE id = ?").bind(id),
    ]);
  }

  async listarEventos(uid: string) {
    const r = await this.db.prepare("SELECT id, datos FROM eventos WHERE uid = ?").bind(uid).all<{ id: string; datos: string }>();
    return r.results.map((f) => eventoDesdeJson(uid, f.id, JSON.parse(f.datos)));
  }
  async getEvento(uid: string, id: string) {
    const f = await this.db.prepare("SELECT datos FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).first<{ datos: string }>();
    return f ? eventoDesdeJson(uid, id, JSON.parse(f.datos)) : null;
  }
  async guardarEvento(e: Omit<Evento, "id"> & { id?: string }) {
    const guardado = { ...e, id: e.id ?? nuevoId() } as Evento;
    const { id, uid, ...datos } = guardado;
    await this.db.prepare("INSERT INTO eventos (uid, id, datos) VALUES (?, ?, ?) ON CONFLICT(uid, id) DO UPDATE SET datos = excluded.datos")
      .bind(uid, id, JSON.stringify(datos)).run();
    return guardado;
  }
  async borrarEvento(uid: string, id: string) {
    await this.db.prepare("DELETE FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).run();
  }

  async guardarProgramacion(p: Programacion) {
    const datos = JSON.stringify({ ref: p.ref, posponer: p.posponer, intentos: p.intentos });
    await this.db.prepare("INSERT INTO programaciones (id, uid, tipo, proximo, datos) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET uid = excluded.uid, tipo = excluded.tipo, proximo = excluded.proximo, datos = excluded.datos")
      .bind(p.id, p.uid, p.tipo, p.proximo.getTime(), datos).run();
  }
  async borrarProgramacion(id: string) {
    await this.db.prepare("DELETE FROM programaciones WHERE id = ?").bind(id).run();
  }
  async borrarProgramacionesDe(uid: string, tipo?: Programacion["tipo"]) {
    if (tipo) await this.db.prepare("DELETE FROM programaciones WHERE uid = ? AND tipo = ?").bind(uid, tipo).run();
    else await this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(uid).run();
  }
  async programacionesVencidas(hasta: Date, limite: number) {
    const r = await this.db.prepare("SELECT id, uid, tipo, proximo, datos FROM programaciones WHERE proximo <= ? ORDER BY proximo LIMIT ?")
      .bind(hasta.getTime(), limite).all<{ id: string; uid: string; tipo: string; proximo: number; datos: string }>();
    return r.results.map(programacionDesdeFila);
  }
  /** Atómico: un único UPDATE condicionado al valor anterior. */
  async reclamarProgramacion(id: string, esperado: Date, nuevo: Date) {
    const r = await this.db.prepare("UPDATE programaciones SET proximo = ? WHERE id = ? AND proximo = ?")
      .bind(nuevo.getTime(), id, esperado.getTime()).run();
    return (r.meta?.changes ?? 0) === 1;
  }

  async getHoroscopo(signoId: string): Promise<HoroscopoDoc | null> {
    const f = await this.db.prepare("SELECT datos FROM horoscopos WHERE signo = ?").bind(signoId).first<{ datos: string }>();
    return f ? (JSON.parse(f.datos) as HoroscopoDoc) : null;
  }
  async guardarHoroscopo(signoId: string, doc: HoroscopoDoc) {
    await this.db.prepare("INSERT INTO horoscopos (signo, datos) VALUES (?, ?) ON CONFLICT(signo) DO UPDATE SET datos = excluded.datos")
      .bind(signoId, JSON.stringify(doc)).run();
  }

  async cacheGet(clave: string, ahora: Date) {
    const f = await this.db.prepare("SELECT valor FROM cache WHERE clave = ? AND expira > ?").bind(clave, ahora.getTime()).first<{ valor: string }>();
    return f?.valor ?? null;
  }
  async cacheSet(clave: string, valor: string, ttlMs: number, ahora: Date) {
    await this.db.prepare("INSERT INTO cache (clave, valor, expira) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, expira = excluded.expira")
      .bind(clave, valor, ahora.getTime() + ttlMs).run();
  }
  /** Borra la caché caducada (se llama de vez en cuando para que no crezca). */
  async limpiarCache(ahora: Date) {
    await this.db.prepare("DELETE FROM cache WHERE expira <= ?").bind(ahora.getTime()).run();
  }
}

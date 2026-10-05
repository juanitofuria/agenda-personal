import { Firestore, Timestamp } from "firebase-admin/firestore";
import { Almacen } from "./almacen";
import { Evento, HoroscopoDoc, Programacion, Usuario } from "./modelo";
import { Repeticion } from "./fechas";

const aFecha = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : null);

/** Convierte un documento de Firestore en un Usuario (con valores por defecto para campos ausentes). */
export function usuarioDesdeDoc(id: string, d: Record<string, any>): Usuario {
  return {
    id, nombre: d.nombre ?? "", nacimiento: d.nacimiento ?? null, zona: d.zona ?? "Europe/Madrid", ciudad: d.ciudad ?? null,
    secciones: d.secciones ?? {}, temas: d.temas ?? [], estado: d.estado ?? null, onboardingHecho: !!d.onboardingHecho,
    activo: d.activo !== false, ultimoUpdate: d.ultimoUpdate ?? 0, creadoEn: aFecha(d.creadoEn) ?? new Date(0),
  };
}

export function eventoDesdeDoc(uid: string, id: string, d: Record<string, any>): Evento {
  return {
    id, uid, tipo: d.tipo, titulo: d.titulo ?? "", lugar: d.lugar ?? "", fechaHora: aFecha(d.fechaHora),
    antelacionMin: d.antelacionMin ?? 0, repeticion: (d.repeticion ?? "ninguna") as Repeticion, avisado: !!d.avisado,
    hecho: !!d.hecho, creadoEn: aFecha(d.creadoEn) ?? new Date(0),
  };
}

export function programacionDesdeDoc(id: string, d: Record<string, any>): Programacion {
  return { id, uid: d.uid, tipo: d.tipo, ref: d.ref, proximo: aFecha(d.proximo) ?? new Date(0) };
}

/** Los ids de Firestore no pueden llevar "/"; la clave de caché se codifica. */
export const claveCache = (k: string) => encodeURIComponent(k).replace(/%/g, "_").slice(0, 400);

export class AlmacenFirestore implements Almacen {
  constructor(private db: Firestore) {}
  private usuarios() { return this.db.collection("usuarios"); }
  private eventos(uid: string) { return this.usuarios().doc(uid).collection("eventos"); }
  private progs() { return this.db.collection("programaciones"); }

  async getUsuario(id: string) { const s = await this.usuarios().doc(id).get(); return s.exists ? usuarioDesdeDoc(id, s.data()!) : null; }
  async guardarUsuario(u: Usuario) { const { id, ...resto } = u; await this.usuarios().doc(id).set(resto); }

  async borrarUsuario(id: string) {
    await this.db.recursiveDelete(this.usuarios().doc(id)); // incluye la subcolección de eventos
    await this.borrarProgramacionesDe(id);
  }

  async listarEventos(uid: string) { return (await this.eventos(uid).get()).docs.map((d) => eventoDesdeDoc(uid, d.id, d.data())); }
  async getEvento(uid: string, id: string) { const s = await this.eventos(uid).doc(id).get(); return s.exists ? eventoDesdeDoc(uid, id, s.data()!) : null; }
  async guardarEvento(e: Omit<Evento, "id"> & { id?: string }) {
    const ref = e.id ? this.eventos(e.uid).doc(e.id) : this.eventos(e.uid).doc();
    const guardado = { ...e, id: ref.id } as Evento;
    const { id: _id, ...datos } = guardado;
    await ref.set(datos);
    return guardado;
  }
  async borrarEvento(uid: string, id: string) { await this.eventos(uid).doc(id).delete(); }

  async guardarProgramacion(p: Programacion) { const { id, ...resto } = p; await this.progs().doc(id).set(resto); }
  async borrarProgramacion(id: string) { await this.progs().doc(id).delete(); }
  async borrarProgramacionesDe(uid: string, tipo?: Programacion["tipo"]) {
    let q = this.progs().where("uid", "==", uid);
    if (tipo) q = q.where("tipo", "==", tipo);
    const docs = (await q.get()).docs;
    for (let i = 0; i < docs.length; i += 400) {
      const lote = this.db.batch();
      docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref));
      await lote.commit();
    }
  }
  async programacionesVencidas(hasta: Date, limite: number) {
    const s = await this.progs().where("proximo", "<=", Timestamp.fromDate(hasta)).orderBy("proximo").limit(limite).get();
    return s.docs.map((d) => programacionDesdeDoc(d.id, d.data()));
  }
  async reclamarProgramacion(id: string, esperado: Date, nuevo: Date) {
    const ref = this.progs().doc(id);
    return this.db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const actual = s.exists ? aFecha(s.data()!.proximo) : null;
      if (!actual || actual.getTime() !== esperado.getTime()) return false;
      tx.update(ref, { proximo: Timestamp.fromDate(nuevo) });
      return true;
    });
  }

  async getHoroscopo(signoId: string): Promise<HoroscopoDoc | null> {
    const s = await this.db.collection("horoscopos").doc(signoId).get();
    return s.exists ? (s.data() as HoroscopoDoc) : null;
  }

  async guardarHoroscopo(signoId: string, doc: HoroscopoDoc) { await this.db.collection("horoscopos").doc(signoId).set(doc); }

  async cacheGet(clave: string, ahora: Date) {
    const s = await this.db.collection("cache").doc(claveCache(clave)).get();
    const d = s.data();
    const expira = d ? aFecha(d.expira) : null;
    return d && expira && expira.getTime() > ahora.getTime() ? (d.valor as string) : null;
  }
  async cacheSet(clave: string, valor: string, ttlMs: number, ahora: Date) {
    await this.db.collection("cache").doc(claveCache(clave)).set({ valor, expira: Timestamp.fromDate(new Date(ahora.getTime() + ttlMs)) });
  }
}

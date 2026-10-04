import { DatabaseSync } from "node:sqlite";
import { D1Like, D1Sentencia } from "./almacenD1";

/** D1 de mentira sobre SQLite en memoria (solo para los tests): misma API que usamos de D1. */
export function d1Sqlite(esquemaSql: string): D1Like & { db: DatabaseSync } {
  const db = new DatabaseSync(":memory:");
  db.exec(esquemaSql);
  const sentencia = (sql: string, valores: unknown[] = []): D1Sentencia => ({
    bind: (...v) => sentencia(sql, v),
    async run() { const r = db.prepare(sql).run(...(valores as any[])); return { meta: { changes: Number(r.changes) } }; },
    async first<T>() { return ((db.prepare(sql).get(...(valores as any[])) as T | undefined) ?? null); },
    async all<T>() { return { results: db.prepare(sql).all(...(valores as any[])) as T[] }; },
  });
  return { db, prepare: (sql) => sentencia(sql), async batch(ss) { for (const s of ss) await s.run(); return []; } };
}

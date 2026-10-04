-- Esquema de la base de datos D1. Se aplica con `npm run db:crear` (local: `npm run db:local`).
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  datos TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos (
  uid TEXT NOT NULL,
  id TEXT NOT NULL,
  datos TEXT NOT NULL,
  PRIMARY KEY (uid, id)
);

CREATE TABLE IF NOT EXISTS programaciones (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  tipo TEXT NOT NULL,
  proximo INTEGER NOT NULL,   -- milisegundos desde 1970 (UTC)
  datos TEXT NOT NULL         -- ref, posponer, intentos
);
CREATE INDEX IF NOT EXISTS idx_prog_proximo ON programaciones (proximo);
CREATE INDEX IF NOT EXISTS idx_prog_uid ON programaciones (uid, tipo);

CREATE TABLE IF NOT EXISTS horoscopos (
  signo TEXT PRIMARY KEY,
  datos TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cache (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  expira INTEGER NOT NULL
);

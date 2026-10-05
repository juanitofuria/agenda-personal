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

-- Control de acceso: quién puede usar el bot (solo si hay administrador configurado), invitaciones de un uso y solicitudes de acceso.
CREATE TABLE IF NOT EXISTS acceso (
  id TEXT PRIMARY KEY,
  rol TEXT NOT NULL,          -- admin | usuario
  nombre TEXT NOT NULL,
  desde INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS invitaciones (
  codigo TEXT PRIMARY KEY,
  caduca INTEGER NOT NULL,
  creada_por TEXT NOT NULL,
  para TEXT                   -- si lleva valor, solo vale para esa persona
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  usuario TEXT,
  fecha INTEGER NOT NULL,
  estado TEXT NOT NULL        -- pendiente | rechazada
);

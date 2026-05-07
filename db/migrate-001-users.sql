-- Migración 001 — tablas de usuarios, perfiles y solicitudes de contacto
-- Correr: podman exec -i platform-db psql -U platform_admin -d milocalhost < db/migrate-001-users.sql

CREATE TABLE IF NOT EXISTS convos.users (
  id            SERIAL PRIMARY KEY,
  authentik_sub TEXT        UNIQUE NOT NULL,
  email         TEXT,
  name          TEXT        NOT NULL,
  role          TEXT        CHECK (role IN ('client', 'psychologist')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS convos.psychologist_profiles (
  user_id           INT  PRIMARY KEY REFERENCES convos.users(id) ON DELETE CASCADE,
  specialty         TEXT NOT NULL,
  bio               TEXT,
  years_experience  INT  DEFAULT 0,
  price_per_session INT  DEFAULT 50,
  available         BOOL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS convos.contact_requests (
  id                   SERIAL PRIMARY KEY,
  client_user_id       INT  NOT NULL REFERENCES convos.users(id) ON DELETE CASCADE,
  psychologist_user_id INT  NOT NULL REFERENCES convos.users(id) ON DELETE CASCADE,
  message              TEXT,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_user_id, psychologist_user_id)
);

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA convos TO convos_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA convos TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO convos_app;

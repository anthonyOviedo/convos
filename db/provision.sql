-- Correr una vez contra platform-db:
--   podman exec -i platform-db psql -U postgres -d milocalhost < db/provision.sql

CREATE SCHEMA IF NOT EXISTS convos AUTHORIZATION CURRENT_USER;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'convos_app') THEN
    EXECUTE format('CREATE ROLE convos_app LOGIN PASSWORD %L',
      current_setting('app.convos_password', true));
  ELSE
    EXECUTE format('ALTER ROLE convos_app WITH LOGIN PASSWORD %L',
      current_setting('app.convos_password', true));
  END IF;
END
$do$;

GRANT CONNECT ON DATABASE milocalhost TO convos_app;
GRANT USAGE ON SCHEMA public TO convos_app;

GRANT USAGE, CREATE ON SCHEMA convos TO convos_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA convos TO convos_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA convos TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO convos_app;
ALTER ROLE convos_app SET search_path TO convos, public;

CREATE TABLE IF NOT EXISTS convos.greetings (
  id      SERIAL PRIMARY KEY,
  message TEXT NOT NULL
);

INSERT INTO convos.greetings (message)
SELECT 'Hola desde conVos'
WHERE NOT EXISTS (SELECT 1 FROM convos.greetings);

#!/usr/bin/env bash
# Correr UNA VEZ para provisionar el schema y el usuario de convos en platform-db.
# Requiere que el contenedor platform-db esté corriendo.
#
# Uso:
#   cd /home/tony/Desktop/convos
#   bash db/provision.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Error: no existe .env — copia .env.example y configura DATABASE_URL" >&2
  exit 1
fi

source .env

# Extraer password del DATABASE_URL (postgresql://convos_app:PASSWORD@...)
CONVOS_PASS=$(echo "$DATABASE_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')

podman exec -i platform-db psql \
  -U platform_admin \
  -d milocalhost \
  -v "convos_password=${CONVOS_PASS}" <<'SQL'
CREATE SCHEMA IF NOT EXISTS convos AUTHORIZATION CURRENT_USER;

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', 'convos_app', :'convos_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'convos_app');
\gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', 'convos_app', :'convos_password')
WHERE EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'convos_app');
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), 'convos_app');
\gexec

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

\echo 'Provisión de convos completada.'
SQL

echo "✓ Schema convos y usuario convos_app listos en platform-db"

CREATE TABLE IF NOT EXISTS convos.psychologist_availability (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES convos.users(id) ON DELETE CASCADE,
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_minutes INT DEFAULT 50,
  UNIQUE (user_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS convos.sessions (
  id                   SERIAL PRIMARY KEY,
  client_user_id       INT NOT NULL REFERENCES convos.users(id) ON DELETE CASCADE,
  psychologist_user_id INT NOT NULL REFERENCES convos.users(id) ON DELETE CASCADE,
  scheduled_at         TIMESTAMPTZ NOT NULL,
  duration_minutes     INT DEFAULT 50,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  meet_link            TEXT,
  rejection_reason     TEXT,
  client_message       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA convos TO convos_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA convos TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO convos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA convos GRANT USAGE,SELECT,UPDATE ON SEQUENCES TO convos_app;

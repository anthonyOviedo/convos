INSERT INTO convos.users (authentik_sub, email, name, role) VALUES
  ('demo-psicologo-sub', 'antoviedo9700@gmail.com', 'Dr. Demo Psicólogo', 'psychologist'),
  ('demo-cliente-sub', 'antoviedo9700@gmail.com', 'Demo Cliente', 'client')
ON CONFLICT (authentik_sub) DO NOTHING;

INSERT INTO convos.psychologist_profiles (user_id, specialty, bio, years_experience, price_per_session)
SELECT id, 'Ansiedad y Estrés', 'Especialista demo para pruebas', 5, 50
FROM convos.users WHERE authentik_sub = 'demo-psicologo-sub'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO convos.psychologist_availability (user_id, day_of_week, start_time, end_time, slot_minutes)
SELECT id, day, '09:00', '17:00', 50
FROM convos.users, generate_series(1,5) AS day
WHERE authentik_sub = 'demo-psicologo-sub'
ON CONFLICT DO NOTHING;

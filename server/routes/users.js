import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// GET /api/me — perfil completo del usuario logueado
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.*, p.specialty, p.bio, p.years_experience, p.price_per_session, p.available
     FROM convos.users u
     LEFT JOIN convos.psychologist_profiles p ON p.user_id = u.id
     WHERE u.authentik_sub = $1`,
    [req.user.sub]
  )
  res.json({ profile: rows[0] ?? null })
})

// POST /api/me — onboarding: crear o actualizar perfil
router.post('/', requireAuth, async (req, res) => {
  const { name, role, specialty, bio, years_experience, price_per_session } = req.body

  if (!name || !role) return res.status(400).json({ error: 'nombre y rol requeridos' })
  if (!['client', 'psychologist'].includes(role)) return res.status(400).json({ error: 'rol inválido' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const upsert = await client.query(
      `INSERT INTO convos.users (authentik_sub, email, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (authentik_sub) DO UPDATE
         SET name = EXCLUDED.name, role = EXCLUDED.role, email = EXCLUDED.email
       RETURNING *`,
      [req.user.sub, req.user.email ?? null, name, role]
    )
    const user = upsert.rows[0]

    if (role === 'psychologist') {
      await client.query(
        `INSERT INTO convos.psychologist_profiles (user_id, specialty, bio, years_experience, price_per_session)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE
           SET specialty = EXCLUDED.specialty, bio = EXCLUDED.bio,
               years_experience = EXCLUDED.years_experience,
               price_per_session = EXCLUDED.price_per_session,
               updated_at = NOW()`,
        [user.id, specialty ?? 'General', bio ?? null, years_experience ?? 0, price_per_session ?? 50]
      )
    }

    await client.query('COMMIT')
    res.json({ ok: true, profile: user })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[users] onboard error:', err.message)
    res.status(500).json({ error: 'Error al guardar perfil' })
  } finally {
    client.release()
  }
})

export default router

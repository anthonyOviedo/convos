import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// GET /api/psychologists — listado público de psicólogos disponibles
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email,
            p.specialty, p.bio, p.years_experience, p.price_per_session, p.available
     FROM convos.users u
     JOIN convos.psychologist_profiles p ON p.user_id = u.id
     WHERE u.role = 'psychologist' AND p.available = TRUE
     ORDER BY u.created_at DESC`
  )
  res.json({ psychologists: rows })
})

export default router

import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/:psychologist_id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, day_of_week, start_time, end_time, slot_minutes
     FROM convos.psychologist_availability
     WHERE user_id = $1
     ORDER BY day_of_week, start_time`,
    [req.params.psychologist_id]
  )
  res.json({ slots: rows })
})

router.put('/', requireAuth, async (req, res) => {
  const meRes = await pool.query(
    'SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub]
  )
  const me = meRes.rows[0]
  if (!me || me.role !== 'psychologist') return res.status(403).json({ error: 'Solo psicólogos pueden editar disponibilidad' })

  const { slots } = req.body
  if (!Array.isArray(slots)) return res.status(400).json({ error: 'slots debe ser un arreglo' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM convos.psychologist_availability WHERE user_id = $1', [me.id])
    for (const s of slots) {
      await client.query(
        `INSERT INTO convos.psychologist_availability (user_id, day_of_week, start_time, end_time, slot_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [me.id, s.day_of_week, s.start_time, s.end_time, s.slot_minutes ?? 50]
      )
    }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[availability] error:', err.message)
    res.status(500).json({ error: 'Error al guardar disponibilidad' })
  } finally {
    client.release()
  }
})

export default router

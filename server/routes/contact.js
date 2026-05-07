import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// POST /api/contact — cliente envía solicitud a un psicólogo
router.post('/', requireAuth, async (req, res) => {
  const { psychologist_user_id, message } = req.body

  const meRes = await pool.query(
    'SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub]
  )
  const me = meRes.rows[0]
  if (!me || me.role !== 'client') return res.status(403).json({ error: 'Solo clientes pueden enviar solicitudes' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO convos.contact_requests (client_user_id, psychologist_user_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (client_user_id, psychologist_user_id) DO UPDATE SET message = EXCLUDED.message, status = 'pending'
       RETURNING *`,
      [me.id, psychologist_user_id, message ?? null]
    )
    res.json({ ok: true, request: rows[0] })
  } catch (err) {
    console.error('[contact] error:', err.message)
    res.status(500).json({ error: 'Error al enviar solicitud' })
  }
})

// GET /api/contact/sent — solicitudes enviadas (cliente)
router.get('/sent', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me) return res.json({ requests: [] })

  const { rows } = await pool.query(
    `SELECT cr.*, u.name AS psychologist_name, p.specialty, p.price_per_session,
            CASE WHEN cr.status = 'accepted' THEN u.email ELSE NULL END AS psychologist_email
     FROM convos.contact_requests cr
     JOIN convos.users u ON u.id = cr.psychologist_user_id
     JOIN convos.psychologist_profiles p ON p.user_id = cr.psychologist_user_id
     WHERE cr.client_user_id = $1
     ORDER BY cr.created_at DESC`,
    [me.id]
  )
  res.json({ requests: rows })
})

// GET /api/contact/received — solicitudes recibidas (psicólogo)
router.get('/received', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me) return res.json({ requests: [] })

  const { rows } = await pool.query(
    `SELECT cr.*, u.name AS client_name, u.email AS client_email
     FROM convos.contact_requests cr
     JOIN convos.users u ON u.id = cr.client_user_id
     WHERE cr.psychologist_user_id = $1
     ORDER BY cr.created_at DESC`,
    [me.id]
  )
  res.json({ requests: rows })
})

// PATCH /api/contact/:id — aceptar o rechazar (psicólogo)
router.patch('/:id', requireAuth, async (req, res) => {
  const { status } = req.body
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'estado inválido' })

  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me || me.role !== 'psychologist') return res.status(403).json({ error: 'Solo psicólogos pueden responder' })

  const { rows } = await pool.query(
    `UPDATE convos.contact_requests SET status = $1
     WHERE id = $2 AND psychologist_user_id = $3
     RETURNING *`,
    [status, req.params.id, me.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' })
  res.json({ ok: true, request: rows[0] })
})

export default router

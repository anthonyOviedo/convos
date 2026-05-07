import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Client reads own record
router.get('/me', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub=$1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me) return res.status(403).json({ error: 'Usuario no encontrado' })
  const r = await pool.query('SELECT * FROM convos.client_records WHERE client_user_id=$1', [me.id])
  res.json({ record: r.rows[0] ?? null })
})

// Client saves/updates own record
router.put('/me', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub=$1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me || me.role !== 'client') return res.status(403).json({ error: 'Solo clientes pueden gestionar su expediente' })

  const { consentimiento, datos } = req.body
  if (!consentimiento) return res.status(400).json({ error: 'Debe aceptar el consentimiento informado' })

  const { rows } = await pool.query(
    `INSERT INTO convos.client_records (client_user_id, consentimiento, consentimiento_at, datos, updated_at)
     VALUES ($1, $2, NOW(), $3, NOW())
     ON CONFLICT (client_user_id) DO UPDATE
       SET consentimiento=$2, consentimiento_at=COALESCE(convos.client_records.consentimiento_at, NOW()),
           datos=$3, updated_at=NOW()
     RETURNING *`,
    [me.id, consentimiento, JSON.stringify(datos ?? {})]
  )
  res.json({ ok: true, record: rows[0] })
})

// Psychologist reads a client's record (only if accepted contact_request exists)
router.get('/:client_user_id', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub=$1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me || me.role !== 'psychologist') return res.status(403).json({ error: 'Solo psicólogos pueden ver expedientes' })

  const clientId = parseInt(req.params.client_user_id)

  // Verify accepted contact_request
  const check = await pool.query(
    `SELECT id FROM convos.contact_requests
     WHERE client_user_id=$1 AND psychologist_user_id=$2 AND status='accepted'`,
    [clientId, me.id]
  )
  if (!check.rows.length) return res.status(403).json({ error: 'Acceso denegado: no tiene una relación aceptada con este paciente' })

  const clientRes = await pool.query('SELECT name, email FROM convos.users WHERE id=$1', [clientId])
  const r = await pool.query('SELECT * FROM convos.client_records WHERE client_user_id=$1', [clientId])

  res.json({ record: r.rows[0] ?? null, client: clientRes.rows[0] ?? null })
})

export default router

import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { notifyNewSession, notifySessionResponse } from '../services/notify.js'
import { createMeetEvent } from '../services/googleMeet.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me) return res.json({ sessions: [] })

  const { psychologist_id } = req.query
  let rows

  if (me.role === 'psychologist') {
    const r = await pool.query(
      `SELECT s.*, c.name AS client_name, c.email AS client_email
       FROM convos.sessions s
       JOIN convos.users c ON c.id = s.client_user_id
       WHERE s.psychologist_user_id = $1
       ORDER BY s.scheduled_at DESC`,
      [me.id]
    )
    rows = r.rows
  } else {
    let q = `SELECT s.*, p.name AS psychologist_name, p.email AS psychologist_email
             FROM convos.sessions s
             JOIN convos.users p ON p.id = s.psychologist_user_id
             WHERE s.client_user_id = $1`
    const params = [me.id]
    if (psychologist_id) {
      q += ` AND s.psychologist_user_id = $2`
      params.push(psychologist_id)
    }
    q += ` ORDER BY s.scheduled_at DESC`
    const r = await pool.query(q, params)
    rows = r.rows
  }

  res.json({ sessions: rows })
})

router.post('/', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me || me.role !== 'client') return res.status(403).json({ error: 'Solo clientes pueden agendar sesiones' })

  const { psychologist_user_id, scheduled_at, client_message } = req.body
  if (!psychologist_user_id || !scheduled_at) return res.status(400).json({ error: 'Faltan datos requeridos' })

  const dt = new Date(scheduled_at)
  if (isNaN(dt.getTime())) return res.status(400).json({ error: 'Fecha inválida' })

  // Resolve day-of-week and time in Costa Rica timezone (UTC-6, no DST)
  const crParts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Costa_Rica',
    weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: false,
  }).formatToParts(dt)
  const get = type => crParts.find(p => p.type === type)?.value
  const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dayOfWeek = DOW[get('weekday')]
  const h = parseInt(get('hour')) % 24   // hour12:false can return 24 at midnight
  const timeStr = `${String(h).padStart(2,'0')}:${get('minute')}`

  const availRes = await pool.query(
    `SELECT * FROM convos.psychologist_availability
     WHERE user_id = $1 AND day_of_week = $2
       AND start_time <= $3::time AND end_time > $3::time`,
    [psychologist_user_id, dayOfWeek, timeStr]
  )
  if (!availRes.rows.length) return res.status(400).json({ error: 'Horario fuera de disponibilidad' })

  const conflictRes = await pool.query(
    `SELECT id FROM convos.sessions
     WHERE psychologist_user_id = $1
       AND scheduled_at = $2
       AND status NOT IN ('rejected','cancelled')`,
    [psychologist_user_id, scheduled_at]
  )
  if (conflictRes.rows.length) return res.status(409).json({ error: 'Ese horario ya está reservado' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO convos.sessions (client_user_id, psychologist_user_id, scheduled_at, client_message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [me.id, psychologist_user_id, scheduled_at, client_message ?? null]
    )
    const session = rows[0]

    const psychRes = await pool.query('SELECT * FROM convos.users WHERE id = $1', [psychologist_user_id])
    const psychologist = psychRes.rows[0]

    notifyNewSession({ session, client: me, psychologist }).catch(() => {})

    res.json({ ok: true, session })
  } catch (err) {
    console.error('[sessions] post error:', err.message)
    res.status(500).json({ error: 'Error al crear sesión' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  const meRes = await pool.query('SELECT * FROM convos.users WHERE authentik_sub = $1', [req.user.sub])
  const me = meRes.rows[0]
  if (!me || me.role !== 'psychologist') return res.status(403).json({ error: 'Solo psicólogos pueden responder sesiones' })

  const { status, rejection_reason } = req.body
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Estado inválido' })

  const sessionRes = await pool.query(
    `SELECT s.*, c.name AS client_name, c.email AS client_email
     FROM convos.sessions s
     JOIN convos.users c ON c.id = s.client_user_id
     WHERE s.id = $1 AND s.psychologist_user_id = $2`,
    [req.params.id, me.id]
  )
  if (!sessionRes.rows.length) return res.status(404).json({ error: 'Sesión no encontrada' })

  let meet_link = null
  if (status === 'accepted') {
    const orig = sessionRes.rows[0]
    const clientForMeet = { id: orig.client_user_id, name: orig.client_name, email: orig.client_email }
    const { meetLink } = await createMeetEvent({
      session: { scheduled_at: orig.scheduled_at, duration_minutes: orig.duration_minutes },
      client: clientForMeet,
      psychologist: me,
    })
    meet_link = meetLink
  }

  const { rows } = await pool.query(
    `UPDATE convos.sessions
     SET status = $1, meet_link = COALESCE($2, meet_link), rejection_reason = $3
     WHERE id = $4
     RETURNING *`,
    [status, meet_link, rejection_reason ?? null, req.params.id]
  )
  const session = rows[0]
  const { client_user_id, client_name, client_email } = sessionRes.rows[0]
  const client = { id: client_user_id, name: client_name, email: client_email }

  notifySessionResponse({ session, client, psychologist: me }).catch(() => {})

  res.json({ ok: true, session })
})

export default router

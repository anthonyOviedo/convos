import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const defaultSlot = () => ({ enabled: false, start_time: '09:00', end_time: '17:00', slot_minutes: 50 })

export default function AvailabilityEditor() {
  const { profile } = useAuth()
  const [slots, setSlots] = useState(Array.from({ length: 7 }, defaultSlot))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    fetch(`/api/availability/${profile.id}`)
      .then(r => r.json())
      .then(({ slots: rows }) => {
        if (!rows?.length) return
        const next = Array.from({ length: 7 }, defaultSlot)
        rows.forEach(r => {
          next[r.day_of_week] = {
            enabled: true,
            start_time: r.start_time.substring(0, 5),
            end_time: r.end_time.substring(0, 5),
            slot_minutes: r.slot_minutes,
          }
        })
        setSlots(next)
      })
      .catch(() => {})
  }, [profile?.id])

  const update = (i, field, val) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  const save = async () => {
    setSaving(true); setMsg(null)
    const payload = slots
      .map((s, i) => ({ ...s, day_of_week: i }))
      .filter(s => s.enabled)
    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setMsg({ ok: true, text: 'Disponibilidad guardada.' })
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="avail-editor">
      <div className="avail-grid">
        {slots.map((s, i) => (
          <div key={i} className={`avail-day${s.enabled ? ' avail-day--on' : ''}`}>
            <div className="avail-day__header">
              <label className="avail-day__toggle">
                <input type="checkbox" checked={s.enabled} onChange={e => update(i, 'enabled', e.target.checked)} />
                <span className="avail-day__toggle-track" />
              </label>
              <span className="avail-day__name">{DAYS[i]}</span>
            </div>
            {s.enabled && (
              <div className="avail-day__fields">
                <label className="ob-label">
                  Inicio
                  <input className="ob-input" type="time" value={s.start_time} onChange={e => update(i, 'start_time', e.target.value)} />
                </label>
                <label className="ob-label">
                  Fin
                  <input className="ob-input" type="time" value={s.end_time} onChange={e => update(i, 'end_time', e.target.value)} />
                </label>
                <div className="avail-slot-info">Bloques de 50 min</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && (
        <p style={{ marginTop: 12, fontSize: '0.88rem', fontWeight: 600, color: msg.ok ? 'var(--c-green)' : '#dc2626' }}>
          {msg.text}
        </p>
      )}
      <button className="ob-btn" style={{ marginTop: 20, maxWidth: 280 }} onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar disponibilidad'}
      </button>
    </div>
  )
}

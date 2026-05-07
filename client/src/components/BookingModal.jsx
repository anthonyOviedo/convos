import { useEffect, useState } from 'react'

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function toDateStr(d) {
  return d.toISOString().substring(0, 10)
}
function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function generateSlots(startTime, endTime, minutes) {
  const slots = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur + minutes <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += minutes
  }
  return slots
}

export default function BookingModal({ psych, onClose, onBooked }) {
  const today = new Date()
  const dates = Array.from({ length: 14 }, (_, i) => toDateStr(addDays(today, i + 1)))

  const [selectedDate, setSelectedDate] = useState(null)
  const [availSlots, setAvailSlots] = useState([])
  const [bookedTimes, setBookedTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!selectedDate) return
    const dow = new Date(selectedDate + 'T00:00:00').getDay()
    Promise.all([
      fetch(`/api/availability/${psych.id}`).then(r => r.json()),
      fetch(`/api/sessions?psychologist_id=${psych.id}`).then(r => r.json()),
    ]).then(([avRes, sesRes]) => {
      const avRow = (avRes.slots ?? []).find(s => s.day_of_week === dow)
      if (!avRow) { setAvailSlots([]); setBookedTimes([]); return }
      const slots = generateSlots(avRow.start_time.substring(0, 5), avRow.end_time.substring(0, 5), avRow.slot_minutes)
      setAvailSlots(slots)
      const booked = (sesRes.sessions ?? [])
        .filter(s => s.scheduled_at.substring(0, 10) === selectedDate && !['rejected', 'cancelled'].includes(s.status))
        .map(s => new Date(s.scheduled_at).toISOString().substring(11, 16))
      setBookedTimes(booked)
    }).catch(() => {})
    setSelectedTime(null)
  }, [selectedDate, psych.id])

  const submit = async () => {
    if (!selectedDate || !selectedTime) return
    setSending(true); setErr(null)
    const scheduled_at = new Date(`${selectedDate}T${selectedTime}:00Z`).toISOString()
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologist_user_id: psych.id, scheduled_at, client_message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      onBooked()
    } catch (e) { setErr(e.message); setSending(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Agendar sesión</h3>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 20 }}>con <strong>{psych.name}</strong></p>

        <div className="booking-dates">
          {dates.map(d => (
            <button
              key={d}
              className={`booking-date-btn${selectedDate === d ? ' booking-date-btn--active' : ''}`}
              onClick={() => setSelectedDate(d)}
            >
              {fmtDate(d)}
            </button>
          ))}
        </div>

        {selectedDate && (
          <div style={{ marginTop: 20 }}>
            {availSlots.length === 0
              ? <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem' }}>Sin disponibilidad ese día.</p>
              : (
                <div className="booking-times">
                  {availSlots.map(t => {
                    const iso = new Date(`${selectedDate}T${t}:00Z`).toISOString()
                    const isBooked = bookedTimes.includes(t)
                    return (
                      <button
                        key={t}
                        disabled={isBooked}
                        className={`booking-time-btn${selectedTime === t ? ' booking-time-btn--active' : ''}${isBooked ? ' booking-time-btn--taken' : ''}`}
                        onClick={() => !isBooked && setSelectedTime(t)}
                      >
                        {fmtTime(iso)}
                      </button>
                    )
                  })}
                </div>
              )
            }
          </div>
        )}

        {selectedTime && (
          <div style={{ marginTop: 20 }}>
            <label className="ob-label">
              Mensaje (opcional)
              <textarea className="ob-input ob-textarea" rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Algo que quieras comentar al psicólogo…" />
            </label>
          </div>
        )}

        {err && <p className="ob-error">{err}</p>}

        {selectedDate && selectedTime && (
          <button className="ob-btn" style={{ marginTop: 16 }} disabled={sending} onClick={submit}>
            {sending ? 'Agendando…' : 'Confirmar sesión'}
          </button>
        )}
      </div>
    </div>
  )
}

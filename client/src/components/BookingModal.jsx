import { useEffect, useState } from 'react'

function toDateStr(d) {
  return d.toISOString().substring(0, 10)
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

const DOW_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function CalendarPicker({ availableDates, selectedDate, onSelect }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const availSet = new Set(availableDates)

  // first day of month (0=Sun…6=Sat), convert to Mon-based (0=Mon…6=Sun)
  const firstDay = new Date(viewYear, viewMonth, 1)
  const startDow = (firstDay.getDay() + 6) % 7  // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

  const canPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="cal">
      <div className="cal__header">
        <button className="cal__nav" onClick={prevMonth} disabled={!canPrev}>‹</button>
        <span className="cal__title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="cal__nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal__grid">
        {DOW_LABELS.map(l => <div key={l} className="cal__dow">{l}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const ds = toDateStr(date)
          const isAvail = availSet.has(ds)
          const isSelected = ds === selectedDate
          const isPast = date < today && toDateStr(date) !== toDateStr(today)
          return (
            <button
              key={ds}
              disabled={!isAvail || isPast}
              onClick={() => isAvail && !isPast && onSelect(ds)}
              className={[
                'cal__day',
                isAvail && !isPast ? 'cal__day--avail' : '',
                isSelected ? 'cal__day--selected' : '',
                isPast ? 'cal__day--past' : '',
              ].join(' ').trim()}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BookingModal({ psych, onClose, onBooked }) {
  const today = new Date()
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i + 1); return toDateStr(d)
  })

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
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Agendar sesión</h3>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.88rem', marginBottom: 20 }}>con <strong>{psych.name}</strong></p>

        <CalendarPicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />

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

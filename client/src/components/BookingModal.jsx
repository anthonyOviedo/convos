import { useEffect, useState } from 'react'

// Returns YYYY-MM-DD using LOCAL date parts (never UTC, avoids midnight shift)
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
// Slot times come from the DB as "HH:MM" already in CR time — just format directly
function fmtTime(crTime) {
  const [h, m] = crTime.split(':').map(Number)
  const ampm = h < 12 ? 'a. m.' : 'p. m.'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
// Convert a stored UTC ISO timestamp → "HH:MM" in Costa Rica time
function utcToCRTime(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const get = t => parts.find(p => p.type === t).value
  return `${get('hour')}:${get('minute')}`
}
// Convert a stored UTC ISO timestamp → "YYYY-MM-DD" in Costa Rica time
function utcToCRDate(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(iso))
  const get = t => parts.find(p => p.type === t).value
  return `${get('year')}-${get('month')}-${get('day')}`
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

  const [psychAvail, setPsychAvail] = useState([])   // availability rows from API
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [availSlots, setAvailSlots] = useState([])
  const [bookedTimes, setBookedTimes] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState(null)

  // Load psychologist availability once on mount
  useEffect(() => {
    fetch(`/api/availability/${psych.id}`)
      .then(r => r.json())
      .then(({ slots }) => {
        setPsychAvail(slots ?? [])
        // Build the set of available days-of-week
        const availDows = new Set((slots ?? []).map(s => s.day_of_week))
        // Filter next 60 days to only those whose dow is in the set
        const dates = []
        for (let i = 1; i <= 60 && dates.length < 30; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() + i)
          if (availDows.has(d.getDay())) dates.push(toDateStr(d))
        }
        setAvailableDates(dates)
      })
      .catch(() => {})
  }, [psych.id])

  // When a date is selected, compute time slots and already-booked times
  useEffect(() => {
    if (!selectedDate) return
    const dow = new Date(selectedDate + 'T00:00:00').getDay()
    const avRow = psychAvail.find(s => s.day_of_week === dow)
    if (!avRow) { setAvailSlots([]); setBookedTimes([]); setSelectedTime(null); return }

    const slots = generateSlots(avRow.start_time.substring(0, 5), avRow.end_time.substring(0, 5), avRow.slot_minutes)
    setAvailSlots(slots)

    fetch(`/api/sessions?psychologist_id=${psych.id}`)
      .then(r => r.json())
      .then(({ sessions }) => {
        const booked = (sessions ?? [])
          .filter(s => !['rejected', 'cancelled'].includes(s.status) && utcToCRDate(s.scheduled_at) === selectedDate)
          .map(s => utcToCRTime(s.scheduled_at))
        setBookedTimes(booked)
      })
      .catch(() => {})
    setSelectedTime(null)
  }, [selectedDate, psychAvail, psych.id])

  const submit = async () => {
    if (!selectedDate || !selectedTime) return
    setSending(true); setErr(null)
    // -06:00 = Costa Rica (no DST)
    const scheduled_at = new Date(`${selectedDate}T${selectedTime}:00-06:00`).toISOString()
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
                    const isBooked = bookedTimes.includes(t)
                    return (
                      <button
                        key={t}
                        disabled={isBooked}
                        className={`booking-time-btn${selectedTime === t ? ' booking-time-btn--active' : ''}${isBooked ? ' booking-time-btn--taken' : ''}`}
                        onClick={() => !isBooked && setSelectedTime(t)}
                      >
                        {fmtTime(t)}
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

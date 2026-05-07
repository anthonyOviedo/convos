import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import BookingModal from '../components/BookingModal.jsx'

const STATUS_LABEL = { pending: 'Pendiente', accepted: 'Aceptada ✓', rejected: 'Rechazada' }
const STATUS_COLOR = { pending: '#d97706', accepted: '#059669', rejected: '#dc2626' }
const SESSION_STATUS_LABEL = { pending: 'Pendiente', accepted: 'Confirmada', rejected: 'Rechazada', cancelled: 'Cancelada' }
const SESSION_STATUS_COLOR = { pending: '#d97706', accepted: '#059669', rejected: '#dc2626', cancelled: '#94a3b8' }

function Avatar({ name, size = 44 }) {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'
  const colors = ['#7c3aed', '#0369a1', '#059669', '#d97706', '#e11d48']
  const bg = colors[name?.charCodeAt(0) % colors.length ?? 0]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function fmtDt(iso) {
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function ContactModal({ psych, onClose, onSent }) {
  const [msg, setMsg]         = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr]         = useState(null)

  const send = async () => {
    setSending(true); setErr(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ psychologist_user_id: psych.id, message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      onSent()
    } catch (e) { setErr(e.message); setSending(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Avatar name={psych.name} size={52} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{psych.name}</div>
            <div style={{ color: 'var(--c-accent)', fontSize: '0.85rem', fontWeight: 600 }}>{psych.specialty}</div>
          </div>
        </div>
        <label className="ob-label">Mensaje (opcional)
          <textarea className="ob-input ob-textarea" rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Hola ${psych.name.split(' ')[0]}, me gustaría…`} />
        </label>
        {err && <p className="ob-error">{err}</p>}
        <button className="ob-btn" style={{ marginTop: 8 }} disabled={sending} onClick={send}>
          {sending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  const { profile, logout } = useAuth()
  const [psychs, setPsychs]       = useState([])
  const [requests, setRequests]   = useState([])
  const [sessions, setSessions]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [booking, setBooking]     = useState(null)
  const [tab, setTab]             = useState('psicologos')
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    const [pRes, rRes, sRes] = await Promise.all([
      fetch('/api/psychologists').then(r => r.json()),
      fetch('/api/contact/sent').then(r => r.json()),
      fetch('/api/sessions').then(r => r.json()),
    ])
    setPsychs(pRes.psychologists ?? [])
    setRequests(rRes.requests ?? [])
    setSessions(sRes.sessions ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const requestedMap = Object.fromEntries(requests.map(r => [r.psychologist_user_id, r]))

  if (loading) return <div className="dash-loading">Cargando…</div>

  return (
    <div className="dash">
      <div className="dash__sidebar">
        <div className="dash__user">
          <Avatar name={profile?.name} size={48} />
          <div>
            <div className="dash__user-name">{profile?.name}</div>
            <div className="dash__user-role">Paciente</div>
          </div>
        </div>
        <nav className="dash__nav">
          <button className={`dash__nav-item${tab === 'psicologos' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('psicologos')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Psicólogos
          </button>
          <button className={`dash__nav-item${tab === 'solicitudes' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('solicitudes')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Mis solicitudes
            {requests.length > 0 && <span className="dash__badge">{requests.length}</span>}
          </button>
          <button className={`dash__nav-item${tab === 'sessions' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('sessions')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Mis sesiones
            {sessions.filter(s => s.status === 'accepted').length > 0 && (
              <span className="dash__badge">{sessions.filter(s => s.status === 'accepted').length}</span>
            )}
          </button>
        </nav>
        <button className="dash__logout" onClick={logout}>Cerrar sesión</button>
      </div>

      <main className="dash__main">
        {tab === 'psicologos' && (
          <section className="dash__section" id="psicologos">
            <h2 className="dash__section-title">Psicólogos disponibles</h2>
            {psychs.length === 0
              ? <p style={{ color: 'var(--c-muted)' }}>Aún no hay psicólogos registrados.</p>
              : (
                <div className="therapists-grid">
                  {psychs.map(p => {
                    const req = requestedMap[p.id]
                    return (
                      <div className="therapist-card" key={p.id}>
                        <Avatar name={p.name} size={64} />
                        <div style={{ marginTop: 14 }}>
                          <div className="therapist-card__name">{p.name}</div>
                          <div className="therapist-card__spec">{p.specialty}</div>
                          <div className="therapist-card__meta">
                            <span>{p.years_experience} años de experiencia</span>
                            <span>· ${p.price_per_session}/sesión</span>
                          </div>
                          {p.bio && <p style={{ fontSize: '0.85rem', color: 'var(--c-muted)', lineHeight: 1.6, margin: '10px 0 16px' }}>{p.bio}</p>}
                          {req ? (
                            <div>
                              <div className="request-status-pill" style={{ background: STATUS_COLOR[req.status] + '18', color: STATUS_COLOR[req.status] }}>
                                {STATUS_LABEL[req.status]}
                                {req.status === 'accepted' && req.psychologist_email && (
                                  <> — <a href={`mailto:${req.psychologist_email}`} style={{ color: 'inherit', fontWeight: 700 }}>{req.psychologist_email}</a></>
                                )}
                              </div>
                              {req.status === 'accepted' && (
                                <button className="therapist-card__btn" style={{ marginTop: 10, background: 'var(--c-accent)' }} onClick={() => setBooking(p)}>
                                  Agendar sesión
                                </button>
                              )}
                            </div>
                          ) : (
                            <button className="therapist-card__btn" onClick={() => setSelected(p)}>
                              Contactar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </section>
        )}

        {tab === 'solicitudes' && (
          <section className="dash__section" id="solicitudes">
            <h2 className="dash__section-title">Mis solicitudes</h2>
            {requests.length === 0
              ? <div className="dash-empty"><p>Aún no has enviado solicitudes.</p></div>
              : (
                <div className="requests-list">
                  {requests.map(r => (
                    <div className="request-card" key={r.id}>
                      <Avatar name={r.psychologist_name} size={40} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{r.psychologist_name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>{r.specialty}</div>
                        {r.status === 'accepted' && r.psychologist_email && (
                          <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                            <a href={`mailto:${r.psychologist_email}`} style={{ color: 'var(--c-primary)', fontWeight: 600 }}>{r.psychologist_email}</a>
                          </div>
                        )}
                      </div>
                      <span className="request-status" style={{ color: STATUS_COLOR[r.status] }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </section>
        )}

        {tab === 'sessions' && (
          <section className="dash__section">
            <h2 className="dash__section-title">Mis sesiones</h2>
            {sessions.length === 0
              ? (
                <div className="dash-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-light)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p>Aún no tienes sesiones agendadas.</p>
                </div>
              ) : (
                <div className="requests-list">
                  {sessions.map(s => (
                    <div className="request-card request-card--lg" key={s.id}>
                      <Avatar name={s.psychologist_name} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{s.psychologist_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>{fmtDt(s.scheduled_at)}</div>
                        {s.status === 'accepted' && s.meet_link && (
                          <a href={s.meet_link} target="_blank" rel="noreferrer" className="session-meet-btn" style={{ marginTop: 10, display: 'inline-block' }}>
                            Unirse a la sesión
                          </a>
                        )}
                        {s.status === 'rejected' && s.rejection_reason && (
                          <p style={{ marginTop: 6, fontSize: '0.85rem', color: '#dc2626' }}>Motivo: {s.rejection_reason}</p>
                        )}
                      </div>
                      <span className="request-status" style={{ color: SESSION_STATUS_COLOR[s.status] ?? '#64748b' }}>
                        {SESSION_STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </section>
        )}
      </main>

      {selected && (
        <ContactModal
          psych={selected}
          onClose={() => setSelected(null)}
          onSent={() => { setSelected(null); load() }}
        />
      )}

      {booking && (
        <BookingModal
          psych={booking}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); load(); setTab('sessions') }}
        />
      )}
    </div>
  )
}

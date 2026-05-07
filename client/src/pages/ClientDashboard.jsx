import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

const STATUS_LABEL = { pending: 'Pendiente', accepted: 'Aceptada ✓', rejected: 'Rechazada' }
const STATUS_COLOR = { pending: '#d97706', accepted: '#059669', rejected: '#dc2626' }

function Avatar({ name, color, size = 44 }) {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?'
  const colors = ['#7c3aed', '#0369a1', '#059669', '#d97706', '#e11d48']
  const bg = color ?? colors[name?.charCodeAt(0) % colors.length ?? 0]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function ContactModal({ psych, onClose, onSent }) {
  const [msg, setMsg]     = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr]     = useState(null)

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
  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    const [pRes, rRes] = await Promise.all([
      fetch('/api/psychologists').then(r => r.json()),
      fetch('/api/contact/sent').then(r => r.json()),
    ])
    setPsychs(pRes.psychologists ?? [])
    setRequests(rRes.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const requestedIds = new Set(requests.map(r => r.psychologist_user_id))

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
          <a href="#psicologos" className="dash__nav-item dash__nav-item--active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Psicólogos
          </a>
          <a href="#solicitudes" className="dash__nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Mis solicitudes
            {requests.length > 0 && <span className="dash__badge">{requests.length}</span>}
          </a>
        </nav>
        <button className="dash__logout" onClick={logout}>Cerrar sesión</button>
      </div>

      <main className="dash__main">
        {/* Solicitudes enviadas */}
        {requests.length > 0 && (
          <section className="dash__section" id="solicitudes">
            <h2 className="dash__section-title">Mis solicitudes</h2>
            <div className="requests-list">
              {requests.map(r => (
                <div className="request-card" key={r.id}>
                  <Avatar name={r.psychologist_name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.psychologist_name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>{r.specialty}</div>
                    {r.status === 'accepted' && r.psychologist_email && (
                      <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                        📧 <a href={`mailto:${r.psychologist_email}`} style={{ color: 'var(--c-primary)', fontWeight: 600 }}>{r.psychologist_email}</a>
                      </div>
                    )}
                  </div>
                  <span className="request-status" style={{ color: STATUS_COLOR[r.status] }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Psicólogos disponibles */}
        <section className="dash__section" id="psicologos">
          <h2 className="dash__section-title">Psicólogos disponibles</h2>
          {psychs.length === 0
            ? <p style={{ color: 'var(--c-muted)' }}>Aún no hay psicólogos registrados.</p>
            : (
              <div className="therapists-grid">
                {psychs.map(p => {
                  const req = requests.find(r => r.psychologist_user_id === p.id)
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
                          <div className="request-status-pill" style={{ background: STATUS_COLOR[req.status] + '18', color: STATUS_COLOR[req.status] }}>
                            {STATUS_LABEL[req.status]}
                            {req.status === 'accepted' && req.psychologist_email && (
                              <> — <a href={`mailto:${req.psychologist_email}`} style={{ color: 'inherit', fontWeight: 700 }}>{req.psychologist_email}</a></>
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
      </main>

      {selected && (
        <ContactModal
          psych={selected}
          onClose={() => setSelected(null)}
          onSent={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}

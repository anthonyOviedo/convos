import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import AvailabilityEditor from '../components/AvailabilityEditor.jsx'
import RecordViewer from '../components/RecordViewer.jsx'

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

function fmtDt(iso) {
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function SessionCard({ s, onRespond, onViewRecord }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <div className="request-card request-card--lg">
      <Avatar name={s.client_name} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{s.client_name}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>{fmtDt(s.scheduled_at)}</div>
        {s.client_message && (
          <p style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--c-text)', background: 'var(--c-bg)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
            "{s.client_message}"
          </p>
        )}
        {s.status === 'accepted' && s.meet_link && (
          <a href={s.meet_link} target="_blank" rel="noreferrer" className="session-meet-btn" style={{ marginTop: 10, display: 'inline-block' }}>
            Unirse a la sesión
          </a>
        )}
        {rejectOpen && (
          <div style={{ marginTop: 10 }}>
            <textarea
              className="ob-input ob-textarea"
              rows={2}
              placeholder="Motivo del rechazo (opcional)…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="dash-action-btn dash-action-btn--reject" onClick={() => { onRespond(s.id, 'rejected', reason); setRejectOpen(false) }}>
                Confirmar rechazo
              </button>
              <button className="dash-action-btn" style={{ background: 'var(--c-bg)', color: 'var(--c-muted)' }} onClick={() => setRejectOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <span className="request-status" style={{ color: STATUS_COLOR[s.status] ?? '#64748b' }}>
          {STATUS_LABEL[s.status] ?? s.status}
        </span>
        {s.status === 'pending' && !rejectOpen && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dash-action-btn dash-action-btn--accept" onClick={() => onRespond(s.id, 'accepted')}>
              Aceptar
            </button>
            <button className="dash-action-btn dash-action-btn--reject" onClick={() => setRejectOpen(true)}>
              Rechazar
            </button>
          </div>
        )}
        <button
          className="dash-action-btn"
          style={{ background: 'rgba(3,105,161,0.1)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => onViewRecord(s.client_user_id, s.client_name)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Ver expediente
        </button>
      </div>
    </div>
  )
}

export default function PsychologistDashboard() {
  const { profile, logout } = useAuth()
  const [requests, setRequests] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [viewingRecord, setViewingRecord] = useState(null)

  const load = async () => {
    const [rRes, sRes] = await Promise.all([
      fetch('/api/contact/received').then(r => r.json()),
      fetch('/api/sessions').then(r => r.json()),
    ])
    setRequests(rRes.requests ?? [])
    setSessions(sRes.sessions ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const respond = async (id, status) => {
    await fetch(`/api/contact/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const respondSession = async (id, status, rejection_reason) => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason }),
    })
    load()
  }

  const filtered = requests.filter(r =>
    tab === 'all' ? true : tab === 'pending' || tab === 'accepted' ? r.status === tab : true
  )

  const pending = requests.filter(r => r.status === 'pending').length
  const pendingSessions = sessions.filter(s => s.status === 'pending').length

  if (loading) return <div className="dash-loading">Cargando…</div>

  return (
    <div className="dash">
      <div className="dash__sidebar">
        <div className="dash__user">
          <Avatar name={profile?.name} size={48} />
          <div>
            <div className="dash__user-name">{profile?.name}</div>
            <div className="dash__user-role">Psicólogo</div>
          </div>
        </div>

        {profile && (
          <div className="dash__profile-card">
            <div className="dash__profile-spec">{profile.specialty}</div>
            <div className="dash__profile-meta">{profile.years_experience} años · ${profile.price_per_session}/ses.</div>
          </div>
        )}

        <nav className="dash__nav">
          <button className={`dash__nav-item${tab === 'pending' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('pending')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Pendientes
            {pending > 0 && <span className="dash__badge">{pending}</span>}
          </button>
          <button className={`dash__nav-item${tab === 'accepted' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('accepted')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Aceptadas
          </button>
          <button className={`dash__nav-item${tab === 'all' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('all')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Todas
          </button>
          <button className={`dash__nav-item${tab === 'sessions' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('sessions')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Sesiones
            {pendingSessions > 0 && <span className="dash__badge">{pendingSessions}</span>}
          </button>
          <button className={`dash__nav-item${tab === 'availability' ? ' dash__nav-item--active' : ''}`} onClick={() => setTab('availability')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Disponibilidad
          </button>
        </nav>

        <button className="dash__logout" onClick={logout}>Cerrar sesión</button>
      </div>

      <main className="dash__main">
        {(tab === 'pending' || tab === 'accepted' || tab === 'all') && (
          <section className="dash__section">
            <h2 className="dash__section-title">
              {tab === 'pending' && 'Solicitudes pendientes'}
              {tab === 'accepted' && 'Pacientes aceptados'}
              {tab === 'all' && 'Todas las solicitudes'}
            </h2>
            {filtered.length === 0 ? (
              <div className="dash-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-light)" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No hay solicitudes {tab === 'pending' ? 'pendientes' : tab === 'accepted' ? 'aceptadas' : ''}.</p>
              </div>
            ) : (
              <div className="requests-list">
                {filtered.map(r => (
                  <div className="request-card request-card--lg" key={r.id}>
                    <Avatar name={r.client_name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{r.client_name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>
                        <a href={`mailto:${r.client_email}`} style={{ color: 'var(--c-primary)' }}>{r.client_email}</a>
                      </div>
                      {r.message && (
                        <p style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--c-text)', background: 'var(--c-bg)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                          "{r.message}"
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span className="request-status" style={{ color: STATUS_COLOR[r.status] }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="dash-action-btn dash-action-btn--accept" onClick={() => respond(r.id, 'accepted')}>
                            Aceptar
                          </button>
                          <button className="dash-action-btn dash-action-btn--reject" onClick={() => respond(r.id, 'rejected')}>
                            Rechazar
                          </button>
                        </div>
                      )}
                      {r.status === 'accepted' && (
                        <button
                          className="dash-action-btn"
                          style={{ background: 'rgba(3,105,161,0.1)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => setViewingRecord({ clientUserId: r.client_user_id, clientName: r.client_name })}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Ver expediente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'sessions' && (
          <section className="dash__section">
            <h2 className="dash__section-title">Sesiones agendadas</h2>
            {sessions.length === 0 ? (
              <div className="dash-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-light)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>Aún no hay sesiones agendadas.</p>
              </div>
            ) : (
              <div className="requests-list">
                {sessions.map(s => (
                  <SessionCard
                    key={s.id}
                    s={s}
                    onRespond={respondSession}
                    onViewRecord={(clientUserId, clientName) => setViewingRecord({ clientUserId, clientName })}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'availability' && (
          <section className="dash__section">
            <h2 className="dash__section-title">Mi disponibilidad semanal</h2>
            <AvailabilityEditor />
          </section>
        )}
      </main>

      {viewingRecord && (
        <RecordViewer
          clientUserId={viewingRecord.clientUserId}
          clientName={viewingRecord.clientName}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  )
}

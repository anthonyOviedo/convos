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

export default function PsychologistDashboard() {
  const { profile, logout } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('pending')

  const load = async () => {
    const res  = await fetch('/api/contact/received')
    const data = await res.json()
    setRequests(data.requests ?? [])
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

  const filtered = requests.filter(r =>
    tab === 'all' ? true : r.status === tab
  )

  const pending = requests.filter(r => r.status === 'pending').length

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
        </nav>

        <button className="dash__logout" onClick={logout}>Cerrar sesión</button>
      </div>

      <main className="dash__main">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

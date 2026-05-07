import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext.jsx'

const S = {
  page: { fontFamily: 'system-ui, sans-serif', maxWidth: 520, margin: '80px auto', padding: '0 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
  btn: {
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#4f46e5', color: '#fff', fontSize: '0.95rem', fontWeight: 500,
  },
  logoutBtn: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
    cursor: 'pointer', background: '#fff', color: '#64748b', fontSize: '0.875rem',
  },
  greeting: { fontSize: '1.2rem', color: '#334155', marginBottom: 8 },
  meta: { fontSize: '0.8rem', color: '#94a3b8' },
  user: { fontSize: '0.9rem', color: '#64748b' },
  loginBox: { textAlign: 'center', marginTop: 60 },
  loginDesc: { color: '#64748b', marginBottom: 24 },
}

function Main() {
  const { user, logout } = useAuth()
  const [greeting, setGreeting] = useState(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/hello')
      .then(r => r.json())
      .then(setGreeting)
      .catch(() => {})
  }, [user])

  if (user === undefined) {
    return <div style={S.page}><p style={{ color: '#94a3b8' }}>Cargando…</p></div>
  }

  if (!user) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>conVos</h1>
        </div>
        <div style={S.loginBox}>
          <p style={S.loginDesc}>Iniciá sesión para continuar.</p>
          <a href="/api/auth/login">
            <button style={S.btn}>Iniciar sesión con Authentik</button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>conVos</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={S.user}>{user.name || user.email}</span>
          <button style={S.logoutBtn} onClick={logout}>Cerrar sesión</button>
        </div>
      </div>
      {greeting ? (
        <>
          <p style={S.greeting}>{greeting.message}</p>
          <p style={S.meta}>desde PostgreSQL: {greeting.desde_db ? 'sí' : 'no'}</p>
        </>
      ) : (
        <p style={{ color: '#94a3b8' }}>Cargando mensaje…</p>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  )
}

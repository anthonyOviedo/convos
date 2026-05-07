import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="nav">
      <div className="nav__inner">
        <a href="/" className="nav__logo">
          con<span className="nav__logo-dot">Vos</span>
        </a>

        <ul className="nav__links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#psicologos">Psicólogos</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="nav__actions">
          {user ? (
            <div className="nav__user">
              <span>{user.name || user.email}</span>
              <button className="nav__btn-ghost" onClick={logout}>Salir</button>
            </div>
          ) : (
            <>
              <a href="/api/auth/login">
                <button className="nav__btn-ghost">Iniciar sesión</button>
              </a>
              <a href="/api/auth/login">
                <button className="nav__btn-solid">Comenzar gratis</button>
              </a>
            </>
          )}
        </div>

        <button className="nav__hamburger" onClick={() => setOpen(o => !o)} aria-label="Menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      <div className={`nav__mobile${open ? ' open' : ''}`}>
        <a href="#como-funciona" onClick={() => setOpen(false)}>Cómo funciona</a>
        <a href="#psicologos" onClick={() => setOpen(false)}>Psicólogos</a>
        <a href="#precios" onClick={() => setOpen(false)}>Precios</a>
        <a href="#faq" onClick={() => setOpen(false)}>FAQ</a>
        {user ? (
          <button className="nav__btn-ghost" style={{ width: '100%' }} onClick={logout}>Cerrar sesión</button>
        ) : (
          <>
            <a href="/api/auth/login"><button className="nav__btn-ghost" style={{ width: '100%' }}>Iniciar sesión</button></a>
            <a href="/api/auth/login"><button className="nav__btn-solid" style={{ width: '100%' }}>Comenzar gratis</button></a>
          </>
        )}
      </div>
    </nav>
  )
}

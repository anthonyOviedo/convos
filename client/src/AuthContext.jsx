import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)       // JWT claims | null
  const [profile, setProfile] = useState(undefined) // DB row    | null

  const refreshProfile = () =>
    fetch('/api/me')
      .then(r => r.json())
      .then(({ profile }) => setProfile(profile ?? null))
      .catch(() => setProfile(null))

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        setUser(user ?? null)
        if (user) return refreshProfile()
        setProfile(null)
      })
      .catch(() => { setUser(null); setProfile(null) })
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

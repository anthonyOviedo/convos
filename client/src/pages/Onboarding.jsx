import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

const SPECIALTIES = [
  'Ansiedad y Estrés', 'Depresión y Estado de Ánimo', 'Relaciones y Pareja',
  'Trauma y PTSD', 'Duelo y Pérdida', 'Autoestima e Identidad',
  'Trastornos Alimenticios', 'Adicciones', 'Infancia y Adolescencia', 'Salud Mental General',
]

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep]       = useState(1)
  const [role, setRole]       = useState(null)
  const [form, setForm]       = useState({
    name: user?.name ?? '',
    specialty: SPECIALTIES[0],
    bio: '',
    years_experience: '',
    price_per_session: '50',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role, years_experience: Number(form.years_experience) || 0, price_per_session: Number(form.price_per_session) || 50 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      await refreshProfile()
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="ob-wrap">
      <div className="ob-card">
        <div className="ob-logo">conVos</div>

        {step === 1 && (
          <>
            <h2 className="ob-title">¿Cómo vas a usar conVos?</h2>
            <p className="ob-sub">Elegí tu rol para personalizar tu experiencia.</p>
            <div className="ob-roles">
              <button className={`ob-role${role === 'client' ? ' ob-role--active' : ''}`} onClick={() => setRole('client')}>
                <span className="ob-role__icon">🙋</span>
                <span className="ob-role__name">Soy paciente</span>
                <span className="ob-role__desc">Busco un psicólogo que me acompañe</span>
              </button>
              <button className={`ob-role${role === 'psychologist' ? ' ob-role--active' : ''}`} onClick={() => setRole('psychologist')}>
                <span className="ob-role__icon">🧑‍⚕️</span>
                <span className="ob-role__name">Soy psicólogo</span>
                <span className="ob-role__desc">Ofrezco sesiones a pacientes</span>
              </button>
            </div>
            <button className="ob-btn" disabled={!role} onClick={() => setStep(2)}>
              Continuar →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button className="ob-back" onClick={() => setStep(1)}>← Volver</button>
            <h2 className="ob-title">{role === 'psychologist' ? 'Tu perfil profesional' : 'Tu perfil'}</h2>
            <p className="ob-sub">Esta información será visible para {role === 'psychologist' ? 'los pacientes' : 'los psicólogos'}.</p>

            <div className="ob-form">
              <label className="ob-label">Nombre completo
                <input className="ob-input" value={form.name} onChange={set('name')} placeholder="Tu nombre completo" required />
              </label>

              {role === 'psychologist' && (
                <>
                  <label className="ob-label">Especialidad principal
                    <select className="ob-input" value={form.specialty} onChange={set('specialty')}>
                      {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="ob-label">Descripción profesional
                    <textarea className="ob-input ob-textarea" value={form.bio} onChange={set('bio')} placeholder="Contá tu enfoque terapéutico, formación y cómo trabajás..." rows={4} />
                  </label>
                  <div className="ob-row">
                    <label className="ob-label">Años de experiencia
                      <input className="ob-input" type="number" min="0" max="50" value={form.years_experience} onChange={set('years_experience')} placeholder="Ej: 5" />
                    </label>
                    <label className="ob-label">Precio por sesión (USD)
                      <input className="ob-input" type="number" min="10" value={form.price_per_session} onChange={set('price_per_session')} placeholder="Ej: 50" />
                    </label>
                  </div>
                </>
              )}
            </div>

            {error && <p className="ob-error">{error}</p>}

            <button className="ob-btn" disabled={!form.name || saving} onClick={submit}>
              {saving ? 'Guardando…' : 'Entrar a conVos'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

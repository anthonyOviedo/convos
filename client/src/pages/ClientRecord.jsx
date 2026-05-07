import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'

function fmtDt(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'short', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function calcProgress(consentimiento, datos) {
  if (!consentimiento) return 0
  const sections = [
    'identificacion',
    'motivo_consulta',
    'historia_problema',
    'antecedentes_medicos',
    'antecedentes_psicologicos',
    'historia_familiar',
    'historia_social',
    'habitos',
    'evaluacion_riesgo',
  ]
  let filled = 0
  for (const s of sections) {
    const val = datos[s]
    if (!val) continue
    if (typeof val === 'string' && val.trim()) { filled++; continue }
    if (typeof val === 'object' && Object.values(val).some(v => v !== '' && v !== null && v !== undefined && v !== false)) {
      filled++
    }
  }
  return Math.round((filled / sections.length) * 100)
}

const EMPTY_DATOS = {
  identificacion: { birth_date: '', gender: '', civil_status: '', education_level: '', occupation: '', nationality: '', city: '' },
  motivo_consulta: '',
  historia_problema: { description: '', approx_start: '', triggers: '', prior_treatment_for_this: '' },
  antecedentes_medicos: { chronic_diseases: '', surgeries: '', allergies: '', current_medications: '' },
  antecedentes_psicologicos: { prior_treatment: false, prior_treatment_when: '', prior_diagnoses: '', psych_medications: '', prior_hospitalization: false },
  historia_familiar: { family_composition: '', mental_health_history: '', relevant_history: '' },
  historia_social: { childhood: '', education: '', work: '', relationships: '' },
  habitos: { alcohol: '', tobacco: '', other_substances: '', physical_activity: '' },
  evaluacion_riesgo: { suicidal_ideation: '', self_harm: false, self_harm_detail: '', crisis_history: '' },
}

function deepMerge(base, override) {
  const result = { ...base }
  for (const key of Object.keys(base)) {
    if (key in override) {
      if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        result[key] = deepMerge(base[key], override[key] ?? {})
      } else {
        result[key] = override[key] ?? base[key]
      }
    }
  }
  return result
}

export default function ClientRecord() {
  const { profile } = useAuth()
  const [record, setRecord] = useState(null)
  const [datos, setDatos] = useState(EMPTY_DATOS)
  const [consentimiento, setConsentimiento] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/records/me')
      .then(r => r.json())
      .then(data => {
        if (data.record) {
          setRecord(data.record)
          setConsentimiento(data.record.consentimiento)
          setDatos(deepMerge(EMPTY_DATOS, data.record.datos ?? {}))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const setNested = (section, field, value) => {
    setDatos(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value,
    }))
  }

  const save = async () => {
    if (!consentimiento) {
      setSaveMsg({ type: 'error', text: 'Debe aceptar el consentimiento informado antes de guardar.' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/records/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentimiento, datos }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      setRecord(data.record)
      setSaveMsg({ type: 'ok', text: 'Expediente guardado correctamente.' })
    } catch (e) {
      setSaveMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const sectionEnabled = consentimiento

  const progress = calcProgress(consentimiento, datos)

  if (loading) return <div className="dash-loading">Cargando expediente…</div>

  const id = datos.identificacion
  const riesgo = datos.evaluacion_riesgo
  const showAlert = riesgo.suicidal_ideation && riesgo.suicidal_ideation !== 'ninguna'

  return (
    <div style={{ maxWidth: 780 }}>
      <h2 className="dash__section-title">Mi expediente psicológico</h2>

      {record?.updated_at && (
        <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', marginBottom: 20 }}>
          Última actualización: {fmtDt(record.updated_at)}
        </p>
      )}

      {/* Progress bar */}
      <div className="record-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-muted)' }}>
          <span>Completado</span>
          <span>{progress}%</span>
        </div>
        <div className="record-progress__track">
          <div className="record-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Sección 1: Consentimiento + Identificación ── */}
      <div className="record-section">
        <h3 className="record-section__title">1. Consentimiento informado e identificación</h3>

        <div className="consent-box">
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: record?.consentimiento ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={consentimiento}
              disabled={!!record?.consentimiento}
              onChange={e => setConsentimiento(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0, accentColor: 'var(--c-primary)' }}
            />
            <span style={{ fontSize: '0.88rem', lineHeight: 1.6, color: record?.consentimiento ? 'var(--c-muted)' : 'var(--c-text)' }}>
              Acepto que mis datos personales sean tratados con fines psicológicos, conforme a la{' '}
              <strong>Ley 8968 — Protección de la Persona frente al tratamiento de sus datos personales</strong>{' '}
              de Costa Rica. Entiendo que mis datos son confidenciales y solo serán accesibles por mi psicólogo/a tratante.
            </span>
          </label>
          {record?.consentimiento_at && (
            <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', marginTop: 8, marginLeft: 30 }}>
              Consentimiento otorgado el {fmtDt(record.consentimiento_at)}
            </p>
          )}
        </div>

        <div className="record-grid" style={{ marginTop: 20, opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
          <label className="ob-label">Fecha de nacimiento
            <input type="date" className="ob-input" value={id.birth_date} onChange={e => setNested('identificacion', 'birth_date', e.target.value)} />
          </label>
          <label className="ob-label">Género
            <select className="ob-input" value={id.gender} onChange={e => setNested('identificacion', 'gender', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>Masculino</option>
              <option>Femenino</option>
              <option>No binario</option>
              <option>Prefiero no decir</option>
            </select>
          </label>
          <label className="ob-label">Estado civil
            <select className="ob-input" value={id.civil_status} onChange={e => setNested('identificacion', 'civil_status', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>Soltero/a</option>
              <option>Casado/a</option>
              <option>Divorciado/a</option>
              <option>Unión libre</option>
              <option>Viudo/a</option>
            </select>
          </label>
          <label className="ob-label">Nivel educativo
            <select className="ob-input" value={id.education_level} onChange={e => setNested('identificacion', 'education_level', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>Primaria</option>
              <option>Secundaria</option>
              <option>Técnico</option>
              <option>Universitario</option>
              <option>Posgrado</option>
            </select>
          </label>
          <label className="ob-label">Ocupación
            <input className="ob-input" value={id.occupation} onChange={e => setNested('identificacion', 'occupation', e.target.value)} placeholder="Ej. Docente, Estudiante…" />
          </label>
          <label className="ob-label">Nacionalidad
            <input className="ob-input" value={id.nationality} onChange={e => setNested('identificacion', 'nationality', e.target.value)} placeholder="Ej. Costarricense" />
          </label>
          <label className="ob-label" style={{ gridColumn: '1 / -1' }}>Ciudad / Cantón
            <input className="ob-input" value={id.city} onChange={e => setNested('identificacion', 'city', e.target.value)} placeholder="Ej. San José, Heredia…" />
          </label>
        </div>
      </div>

      {/* ── Sección 2: Motivo de consulta ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">2. Motivo de consulta</h3>
        <label className="ob-label">¿Por qué busca apoyo psicológico? (en sus propias palabras)
          <textarea
            className="ob-input ob-textarea"
            rows={4}
            value={datos.motivo_consulta}
            onChange={e => setDatos(prev => ({ ...prev, motivo_consulta: e.target.value }))}
            placeholder="Describa con sus propias palabras qué le trae a consulta…"
          />
        </label>
      </div>

      {/* ── Sección 3: Historia del problema actual ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">3. Historia del problema actual</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label">Descripción del problema
            <textarea className="ob-input ob-textarea" rows={3} value={datos.historia_problema.description} onChange={e => setNested('historia_problema', 'description', e.target.value)} placeholder="Describa el problema principal…" />
          </label>
          <label className="ob-label">Inicio aproximado
            <input className="ob-input" value={datos.historia_problema.approx_start} onChange={e => setNested('historia_problema', 'approx_start', e.target.value)} placeholder="Ej. hace 6 meses, desde 2022…" />
          </label>
          <label className="ob-label">Factores desencadenantes
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_problema.triggers} onChange={e => setNested('historia_problema', 'triggers', e.target.value)} placeholder="¿Qué situaciones o eventos parecen empeorar el problema?…" />
          </label>
          <label className="ob-label">Tratamientos previos para este problema
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_problema.prior_treatment_for_this} onChange={e => setNested('historia_problema', 'prior_treatment_for_this', e.target.value)} placeholder="¿Ha buscado ayuda antes para esto? ¿Qué hizo / qué resultados tuvo?" />
          </label>
        </div>
      </div>

      {/* ── Sección 4: Antecedentes médicos ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">4. Antecedentes médicos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label">Enfermedades crónicas
            <input className="ob-input" value={datos.antecedentes_medicos.chronic_diseases} onChange={e => setNested('antecedentes_medicos', 'chronic_diseases', e.target.value)} placeholder="Ej. Diabetes, hipertensión… / Ninguna" />
          </label>
          <label className="ob-label">Cirugías relevantes
            <input className="ob-input" value={datos.antecedentes_medicos.surgeries} onChange={e => setNested('antecedentes_medicos', 'surgeries', e.target.value)} placeholder="Ninguna / descripción…" />
          </label>
          <label className="ob-label">Alergias
            <input className="ob-input" value={datos.antecedentes_medicos.allergies} onChange={e => setNested('antecedentes_medicos', 'allergies', e.target.value)} placeholder="Ninguna / descripción…" />
          </label>
          <label className="ob-label">Medicamentos actuales
            <textarea className="ob-input ob-textarea" rows={2} value={datos.antecedentes_medicos.current_medications} onChange={e => setNested('antecedentes_medicos', 'current_medications', e.target.value)} placeholder="Nombre, dosis, frecuencia… / Ninguno" />
          </label>
        </div>
      </div>

      {/* ── Sección 5: Antecedentes psicológicos/psiquiátricos ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">5. Antecedentes psicológicos / psiquiátricos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={datos.antecedentes_psicologicos.prior_treatment} onChange={e => setNested('antecedentes_psicologicos', 'prior_treatment', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--c-primary)' }} />
            ¿Ha tenido tratamiento psicológico anteriormente?
          </label>
          {datos.antecedentes_psicologicos.prior_treatment && (
            <label className="ob-label">¿Cuándo? (período aproximado)
              <input className="ob-input" value={datos.antecedentes_psicologicos.prior_treatment_when} onChange={e => setNested('antecedentes_psicologicos', 'prior_treatment_when', e.target.value)} placeholder="Ej. 2018-2019, hace 2 años…" />
            </label>
          )}
          <label className="ob-label">Diagnósticos previos (si los conoce)
            <input className="ob-input" value={datos.antecedentes_psicologicos.prior_diagnoses} onChange={e => setNested('antecedentes_psicologicos', 'prior_diagnoses', e.target.value)} placeholder="Ej. Depresión, ansiedad… / Ninguno" />
          </label>
          <label className="ob-label">Medicamentos psiquiátricos previos o actuales
            <input className="ob-input" value={datos.antecedentes_psicologicos.psych_medications} onChange={e => setNested('antecedentes_psicologicos', 'psych_medications', e.target.value)} placeholder="Ninguno / descripción…" />
          </label>
          <label className="ob-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={datos.antecedentes_psicologicos.prior_hospitalization} onChange={e => setNested('antecedentes_psicologicos', 'prior_hospitalization', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--c-primary)' }} />
            ¿Ha tenido hospitalizaciones psiquiátricas?
          </label>
        </div>
      </div>

      {/* ── Sección 6: Historia familiar ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">6. Historia familiar</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label">Composición familiar
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_familiar.family_composition} onChange={e => setNested('historia_familiar', 'family_composition', e.target.value)} placeholder="¿Con quién vive? ¿Cómo está compuesta su familia?" />
          </label>
          <label className="ob-label">Salud mental en la familia
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_familiar.mental_health_history} onChange={e => setNested('historia_familiar', 'mental_health_history', e.target.value)} placeholder="¿Algún familiar con diagnósticos de salud mental conocidos?" />
          </label>
          <label className="ob-label">Historia familiar relevante
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_familiar.relevant_history} onChange={e => setNested('historia_familiar', 'relevant_history', e.target.value)} placeholder="Eventos importantes en la dinámica familiar…" />
          </label>
        </div>
      </div>

      {/* ── Sección 7: Historia social ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">7. Historia social</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label">Resumen de infancia
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_social.childhood} onChange={e => setNested('historia_social', 'childhood', e.target.value)} placeholder="Aspectos relevantes de su infancia y crianza…" />
          </label>
          <label className="ob-label">Educación
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_social.education} onChange={e => setNested('historia_social', 'education', e.target.value)} placeholder="Trayectoria educativa, dificultades o logros relevantes…" />
          </label>
          <label className="ob-label">Historial laboral
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_social.work} onChange={e => setNested('historia_social', 'work', e.target.value)} placeholder="Ocupaciones, cambios importantes…" />
          </label>
          <label className="ob-label">Relaciones significativas
            <textarea className="ob-input ob-textarea" rows={2} value={datos.historia_social.relationships} onChange={e => setNested('historia_social', 'relationships', e.target.value)} placeholder="Pareja, amistades, relaciones importantes en su vida…" />
          </label>
        </div>
      </div>

      {/* ── Sección 8: Hábitos y sustancias ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">8. Hábitos y sustancias</h3>
        <div className="record-grid">
          <label className="ob-label">Consumo de alcohol
            <select className="ob-input" value={datos.habitos.alcohol} onChange={e => setNested('habitos', 'alcohol', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>nunca</option>
              <option>ocasional</option>
              <option>frecuente</option>
              <option>dependencia</option>
            </select>
          </label>
          <label className="ob-label">Consumo de tabaco
            <select className="ob-input" value={datos.habitos.tobacco} onChange={e => setNested('habitos', 'tobacco', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>nunca</option>
              <option>ocasional</option>
              <option>frecuente</option>
              <option>dependencia</option>
            </select>
          </label>
          <label className="ob-label">Otras sustancias
            <input className="ob-input" value={datos.habitos.other_substances} onChange={e => setNested('habitos', 'other_substances', e.target.value)} placeholder="Ninguna / descripción…" />
          </label>
          <label className="ob-label">Actividad física
            <input className="ob-input" value={datos.habitos.physical_activity} onChange={e => setNested('habitos', 'physical_activity', e.target.value)} placeholder="Ej. Caminar 3x/semana, ninguna…" />
          </label>
        </div>
      </div>

      {/* ── Sección 9: Evaluación de riesgo ── */}
      <div className="record-section" style={{ opacity: sectionEnabled ? 1 : 0.45, pointerEvents: sectionEnabled ? 'auto' : 'none' }}>
        <h3 className="record-section__title">9. Evaluación de riesgo</h3>

        {showAlert && (
          <div className="record-risk-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              Si está en crisis, llame al <strong>1122</strong> (CCSS — Crisis psicológica, disponible 24/7).
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="ob-label">Ideación suicida
            <select className="ob-input" value={riesgo.suicidal_ideation} onChange={e => setNested('evaluacion_riesgo', 'suicidal_ideation', e.target.value)}>
              <option value="">Seleccionar…</option>
              <option>ninguna</option>
              <option>pasiva (sin plan)</option>
              <option>activa (con plan)</option>
            </select>
          </label>
          <label className="ob-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={riesgo.self_harm} onChange={e => setNested('evaluacion_riesgo', 'self_harm', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--c-primary)' }} />
            ¿Historia de autolesiones?
          </label>
          {riesgo.self_harm && (
            <label className="ob-label">Descripción de autolesiones
              <textarea className="ob-input ob-textarea" rows={2} value={riesgo.self_harm_detail} onChange={e => setNested('evaluacion_riesgo', 'self_harm_detail', e.target.value)} placeholder="Detalles relevantes si desea compartirlos…" />
            </label>
          )}
          <label className="ob-label">Historia de crisis
            <textarea className="ob-input ob-textarea" rows={2} value={riesgo.crisis_history} onChange={e => setNested('evaluacion_riesgo', 'crisis_history', e.target.value)} placeholder="¿Ha tenido episodios de crisis agudas en el pasado?" />
          </label>
        </div>
      </div>

      {/* ── Guardar ── */}
      {saveMsg && (
        <div style={{ marginBottom: 12, padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: '0.88rem', fontWeight: 600, background: saveMsg.type === 'ok' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)', color: saveMsg.type === 'ok' ? '#059669' : '#dc2626' }}>
          {saveMsg.text}
        </div>
      )}

      <button
        className="ob-btn"
        style={{ maxWidth: 260 }}
        onClick={save}
        disabled={saving || !consentimiento}
      >
        {saving ? 'Guardando…' : 'Guardar expediente'}
      </button>
    </div>
  )
}

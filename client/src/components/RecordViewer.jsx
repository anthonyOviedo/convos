import { useEffect, useState } from 'react'

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'short', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function Field({ label, value }) {
  const display = value === true ? 'Sí' : value === false ? 'No' : (value ?? '—')
  return (
    <div className="record-field">
      <div className="record-field__label">{label}</div>
      <div className="record-field__value">{display || '—'}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="record-section record-viewer__section">
      <h3 className="record-section__title">{title}</h3>
      {children}
    </div>
  )
}

export default function RecordViewer({ clientUserId, clientName, onClose }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/records/${clientUserId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setRecord(data.record)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [clientUserId])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box record-viewer" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="record-confidential">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Expediente confidencial — Ley 8968 de Protección de la Persona frente al tratamiento de sus datos personales</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 4px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--c-text)' }}>{clientName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>Expediente psicológico</div>
          </div>
        </div>

        {loading && <p style={{ color: 'var(--c-muted)', padding: '20px 0' }}>Cargando expediente…</p>}
        {error && <p style={{ color: '#dc2626', padding: '12px 0' }}>{error}</p>}

        {!loading && !error && !record && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--c-light)" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Este paciente aún no ha completado su expediente.</p>
          </div>
        )}

        {!loading && !error && record && (() => {
          const d = record.datos ?? {}
          const id = d.identificacion ?? {}
          const hp = d.historia_problema ?? {}
          const am = d.antecedentes_medicos ?? {}
          const ap = d.antecedentes_psicologicos ?? {}
          const hf = d.historia_familiar ?? {}
          const hs = d.historia_social ?? {}
          const hab = d.habitos ?? {}
          const er = d.evaluacion_riesgo ?? {}

          return (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)', marginBottom: 16 }}>
                Última actualización: {fmtDt(record.updated_at)}
              </p>

              <Section title="1. Identificación">
                <div className="record-grid">
                  <Field label="Fecha de nacimiento" value={id.birth_date} />
                  <Field label="Género" value={id.gender} />
                  <Field label="Estado civil" value={id.civil_status} />
                  <Field label="Nivel educativo" value={id.education_level} />
                  <Field label="Ocupación" value={id.occupation} />
                  <Field label="Nacionalidad" value={id.nationality} />
                  <Field label="Ciudad / Cantón" value={id.city} />
                </div>
              </Section>

              <Section title="2. Motivo de consulta">
                <Field label="Descripción" value={d.motivo_consulta} />
              </Section>

              <Section title="3. Historia del problema actual">
                <Field label="Descripción" value={hp.description} />
                <Field label="Inicio aproximado" value={hp.approx_start} />
                <Field label="Factores desencadenantes" value={hp.triggers} />
                <Field label="Tratamientos previos para este problema" value={hp.prior_treatment_for_this} />
              </Section>

              <Section title="4. Antecedentes médicos">
                <Field label="Enfermedades crónicas" value={am.chronic_diseases} />
                <Field label="Cirugías" value={am.surgeries} />
                <Field label="Alergias" value={am.allergies} />
                <Field label="Medicamentos actuales" value={am.current_medications} />
              </Section>

              <Section title="5. Antecedentes psicológicos / psiquiátricos">
                <Field label="Tratamiento psicológico previo" value={ap.prior_treatment} />
                {ap.prior_treatment && <Field label="¿Cuándo?" value={ap.prior_treatment_when} />}
                <Field label="Diagnósticos previos" value={ap.prior_diagnoses} />
                <Field label="Medicamentos psiquiátricos" value={ap.psych_medications} />
                <Field label="Hospitalización psiquiátrica previa" value={ap.prior_hospitalization} />
              </Section>

              <Section title="6. Historia familiar">
                <Field label="Composición familiar" value={hf.family_composition} />
                <Field label="Salud mental en la familia" value={hf.mental_health_history} />
                <Field label="Historia familiar relevante" value={hf.relevant_history} />
              </Section>

              <Section title="7. Historia social">
                <Field label="Resumen de infancia" value={hs.childhood} />
                <Field label="Educación" value={hs.education} />
                <Field label="Historial laboral" value={hs.work} />
                <Field label="Relaciones significativas" value={hs.relationships} />
              </Section>

              <Section title="8. Hábitos y sustancias">
                <div className="record-grid">
                  <Field label="Alcohol" value={hab.alcohol} />
                  <Field label="Tabaco" value={hab.tobacco} />
                  <Field label="Otras sustancias" value={hab.other_substances} />
                  <Field label="Actividad física" value={hab.physical_activity} />
                </div>
              </Section>

              <Section title="9. Evaluación de riesgo">
                <Field label="Ideación suicida" value={er.suicidal_ideation} />
                <Field label="Historia de autolesiones" value={er.self_harm} />
                {er.self_harm && <Field label="Detalle autolesiones" value={er.self_harm_detail} />}
                <Field label="Historia de crisis" value={er.crisis_history} />
              </Section>
            </>
          )
        })()}
      </div>
    </div>
  )
}

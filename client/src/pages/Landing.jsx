import { useState } from 'react'

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Video: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Heart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Star: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  MessageCircle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
}

// ── Data ──────────────────────────────────────────────────────────────────────
const THERAPISTS = [
  { initials: 'MG', color: '#7c3aed', name: 'Dra. María González', spec: 'Ansiedad y Estrés', years: 8, rating: '4.9', reviews: 124, tags: ['Adultos', 'Cognitivo-conductual', 'Online'] },
  { initials: 'CM', color: '#0369a1', name: 'Dr. Carlos Méndez', spec: 'Relaciones y Pareja', years: 12, rating: '4.8', reviews: 98,  tags: ['Parejas', 'Psicoanálisis', 'Online'] },
  { initials: 'LS', color: '#059669', name: 'Dra. Laura Soto',    spec: 'Depresión y Duelo',  years: 6,  rating: '4.9', reviews: 87,  tags: ['Adultos', 'Humanista', 'Online'] },
]

const TESTIMONIALS = [
  { initials: 'AP', color: '#7c3aed', name: 'Ana P.',      label: 'Paciente hace 8 meses',  text: 'Nunca pensé que terapia online pudiera ser tan efectiva. Mi psicóloga me ayudó a entender patrones que repetía desde hace años. El proceso de matching fue muy acertado.' },
  { initials: 'RM', color: '#0369a1', name: 'Rodrigo M.',  label: 'Paciente hace 1 año',    text: 'La flexibilidad de horarios fue clave para mí. Trabajo turnos rotativos y poder elegir el horario de mi sesión hizo que realmente pudiera sostener el proceso terapéutico.' },
  { initials: 'VS', color: '#059669', name: 'Valentina S.', label: 'Paciente hace 5 meses', text: 'Al principio tenía dudas sobre la privacidad. Luego de entender cómo funciona la plataforma me quedé tranquila. Mi terapeuta es excelente y el espacio muy seguro.' },
]

const FEATURES = [
  { icon: <Icon.Video />,         color: '#eff6ff', stroke: '#0369a1', title: 'Video, chat y audio',      desc: 'Elegí el formato que más te comode para cada sesión. Podés cambiar el modo cuando quieras.' },
  { icon: <Icon.Shield />,        color: '#f0fdf4', stroke: '#059669', title: '100% confidencial',        desc: 'Tus sesiones están encriptadas. Solo vos y tu psicólogo tienen acceso al contenido.' },
  { icon: <Icon.Calendar />,      color: '#faf5ff', stroke: '#7c3aed', title: 'Horarios flexibles',       desc: 'Sesiones disponibles de lunes a domingo, mañana, tarde y noche. Agendá en segundos.' },
  { icon: <Icon.Heart />,         color: '#fff1f2', stroke: '#e11d48', title: 'Matching inteligente',     desc: 'Nuestro algoritmo analiza tus necesidades y te sugiere los profesionales más afines.' },
  { icon: <Icon.TrendingUp />,    color: '#fffbeb', stroke: '#d97706', title: 'Seguimiento de progreso',  desc: 'Registrá tu estado de ánimo entre sesiones y llevá un registro de tu evolución.' },
  { icon: <Icon.MessageCircle />, color: '#eff6ff', stroke: '#0369a1', title: 'Mensajes entre sesiones',  desc: 'Enviá mensajes a tu psicólogo entre sesiones en los planes Estándar e Intensivo.' },
]

const STEPS = [
  { icon: <Icon.Users />,    color: '#eff6ff', stroke: '#0369a1', title: 'Completá tu perfil',    desc: 'Contanos cómo te sentís, qué buscás en una terapia y tus preferencias de horario.' },
  { icon: <Icon.Heart />,    color: '#faf5ff', stroke: '#7c3aed', title: 'Te conectamos',         desc: 'Nuestro sistema te sugiere los 3 psicólogos más afines a tu perfil y necesidades.' },
  { icon: <Icon.Calendar />, color: '#f0fdf4', stroke: '#059669', title: 'Comenzá tu terapia',    desc: 'Agendá tu primera sesión de prueba gratuita y arrancá tu proceso terapéutico.' },
]

const PRICING = [
  {
    name: 'Esencial', price: '$29', period: '/mes', popular: false,
    desc: 'Para empezar tu camino terapéutico.',
    features: ['4 sesiones por mes', 'Video y audio', 'Agenda online', 'Soporte por email'],
    btn: 'ghost',
  },
  {
    name: 'Estándar', price: '$49', period: '/mes', popular: true,
    desc: 'El plan más elegido por nuestros pacientes.',
    features: ['8 sesiones por mes', 'Video, audio y chat', 'Mensajes al psicólogo', 'Seguimiento de progreso', 'Agenda prioritaria'],
    btn: 'primary',
  },
  {
    name: 'Intensivo', price: '$79', period: '/mes', popular: false,
    desc: 'Para procesos que requieren mayor acompañamiento.',
    features: ['Sesiones ilimitadas', 'Todo lo del Estándar', 'Atención de urgencia', 'Psicólogo de guardia', 'Reporte mensual'],
    btn: 'ghost',
  },
]

const FAQS = [
  { q: '¿Cómo se realizan las sesiones?',          a: 'Las sesiones se realizan de forma online mediante videollamada, llamada de audio o chat dentro de la plataforma. Podés elegir el formato que más te comode antes de cada sesión.' },
  { q: '¿Es realmente confidencial?',               a: 'Sí. Todas las sesiones y conversaciones están encriptadas de extremo a extremo. Ni el equipo de conVos tiene acceso al contenido de tus sesiones. Cumplimos con las normativas de protección de datos vigentes.' },
  { q: '¿Puedo cambiar de psicólogo?',              a: 'Por supuesto. Si sentís que no hay buena conexión con tu psicólogo, podés solicitar un cambio en cualquier momento sin costo adicional. Tu bienestar es la prioridad.' },
  { q: '¿Los psicólogos están certificados?',       a: 'Todos los psicólogos de conVos pasan por un proceso de verificación riguroso que incluye validación de título, matrícula profesional activa y entrevista de selección. Solo el 15% de los postulantes son aceptados.' },
  { q: '¿Qué pasa si necesito cancelar una sesión?', a: 'Podés cancelar o reprogramar una sesión hasta 24 horas antes sin costo. Cancelaciones con menos anticipación pueden descontarse del plan mensual. Sin contratos ni compromisos de permanencia.' },
]

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-item__q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {q}
        <span className={`faq-item__icon${open ? ' open' : ''}`}><Icon.Plus /></span>
      </button>
      <div className={`faq-item__a${open ? ' open' : ''}`}>{a}</div>
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__inner">
          <div>
            <span className="section__tag">Psicología online</span>
            <h1 className="hero__title">
              Encontrá al psicólogo<br />
              <span>ideal para vos</span>
            </h1>
            <p className="hero__sub">
              Sesiones online con psicólogos certificados. Flexible, accesible y completamente privado. Primera sesión gratis.
            </p>
            <div className="hero__actions">
              <a href="/api/auth/login">
                <button className="btn-primary">
                  Comenzar ahora <Icon.Arrow />
                </button>
              </a>
              <a href="#como-funciona">
                <button className="btn-secondary">¿Cómo funciona?</button>
              </a>
            </div>
            <div className="hero__trust">
              <span className="hero__trust-item"><span className="hero__trust-icon">✓</span> +500 psicólogos</span>
              <span className="hero__trust-item"><span className="hero__trust-icon">✓</span> +10.000 pacientes</span>
              <span className="hero__trust-item"><span className="hero__trust-icon">✓</span> 1ª sesión gratis</span>
            </div>
          </div>

          <div className="hero__visual">
            <div className="hero__card-stack">
              <div className="hero__card-back" />
              <div className="hero__card-main">
                <div className="therapist-mini">
                  <div className="therapist-mini__avatar" style={{ background: '#7c3aed' }}>MG</div>
                  <div>
                    <div className="therapist-mini__name">Dra. María González</div>
                    <div className="therapist-mini__spec">Ansiedad · Estrés · TCC</div>
                  </div>
                </div>
                <div className="stars">★★★★★</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)', margin: '12px 0', lineHeight: 1.6 }}>
                  "Especialista en manejo de ansiedad con enfoque cognitivo-conductual. 8 años de experiencia."
                </p>
                <div className="session-pill">
                  <div className="session-pill__dot" />
                  <span className="session-pill__text">Próxima sesión disponible hoy a las 18:00</span>
                </div>
                <button className="therapist-card__btn" style={{ marginTop: 16 }}>Agendar sesión de prueba</button>
              </div>
              <div className="badge-float">
                <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--c-text)' }}>100% seguro</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>Encriptado de extremo a extremo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stats-bar__inner">
          <div className="stat"><div className="stat__num">+500</div><div className="stat__label">Psicólogos certificados</div></div>
          <div className="stat"><div className="stat__num">4.9★</div><div className="stat__label">Valoración promedio</div></div>
          <div className="stat"><div className="stat__num">+10K</div><div className="stat__label">Pacientes atendidos</div></div>
          <div className="stat"><div className="stat__num">98%</div><div className="stat__label">Recomendarían la plataforma</div></div>
        </div>
      </div>

      {/* ── Cómo funciona ── */}
      <section className="section" id="como-funciona">
        <div className="container">
          <span className="section__tag">Simple y rápido</span>
          <h2 className="section__title">Comenzá en 3 pasos</h2>
          <p className="section__sub">Desde que te registrás hasta tu primera sesión, el proceso toma menos de 10 minutos.</p>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={i}>
                <div className="step__num">{i + 1}</div>
                <div className="step__icon" style={{ background: s.color, color: s.stroke }}>{s.icon}</div>
                <div className="step__title">{s.title}</div>
                <p className="step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section section--alt">
        <div className="container">
          <span className="section__tag">Todo lo que necesitás</span>
          <h2 className="section__title">Una plataforma pensada para vos</h2>
          <p className="section__sub">Cada detalle fue diseñado para que tu experiencia terapéutica sea cómoda, segura y efectiva.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-card__icon" style={{ background: f.color, color: f.stroke }}>{f.icon}</div>
                <div className="feature-card__title">{f.title}</div>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Psicólogos ── */}
      <section className="section" id="psicologos">
        <div className="container">
          <span className="section__tag">Conocé el equipo</span>
          <h2 className="section__title">Psicólogos que te acompañan</h2>
          <p className="section__sub">Todos nuestros profesionales están verificados, tienen matrícula activa y pasaron nuestro proceso de selección.</p>
          <div className="therapists-grid">
            {THERAPISTS.map((t, i) => (
              <div className="therapist-card" key={i}>
                <div className="therapist-card__avatar" style={{ background: t.color }}>{t.initials}</div>
                <div className="therapist-card__name">{t.name}</div>
                <div className="therapist-card__spec">{t.spec}</div>
                <div className="therapist-card__meta">
                  <span>⭐ {t.rating} ({t.reviews} reseñas)</span>
                  <span>· {t.years} años de experiencia</span>
                </div>
                <div className="therapist-card__tags">
                  {t.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}
                </div>
                <button className="therapist-card__btn">Ver perfil y agendar</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section section--alt">
        <div className="container">
          <span className="section__tag">Lo que dicen</span>
          <h2 className="section__title">Historias reales, cambios reales</h2>
          <p className="section__sub">Más de 10.000 personas ya iniciaron su proceso terapéutico con conVos.</p>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <p className="testimonial-card__quote">{t.text}</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__av" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__label">{t.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="section" id="precios">
        <div className="container">
          <span className="section__tag">Planes</span>
          <h2 className="section__title">Invertí en tu bienestar</h2>
          <p className="section__sub">Sin compromisos. Cancelá cuando quieras. Primera sesión siempre gratis.</p>
          <div className="pricing-grid">
            {PRICING.map((p, i) => (
              <div className={`pricing-card${p.popular ? ' pricing-card--popular' : ''}`} key={i}>
                {p.popular && <span className="popular-badge">Más popular</span>}
                <div className="pricing-card__name">{p.name}</div>
                <div className="pricing-card__price">{p.price}<span>{p.period}</span></div>
                <p className="pricing-card__desc">{p.desc}</p>
                <ul className="pricing-card__features">
                  {p.features.map(f => (
                    <li key={f}><Icon.Check /> {f}</li>
                  ))}
                </ul>
                <button className={`pricing-btn pricing-btn--${p.btn}`}>
                  {p.popular ? 'Comenzar ahora' : 'Elegir plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section section--alt" id="faq">
        <div className="container">
          <span className="section__tag">Preguntas frecuentes</span>
          <h2 className="section__title">Resolvemos tus dudas</h2>
          <div className="faq-list">
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="container">
          <h2 className="cta-banner__title">Tu bienestar puede empezar hoy</h2>
          <p className="cta-banner__sub">Primera sesión gratuita. Sin tarjeta de crédito. Sin compromisos.</p>
          <a href="/api/auth/login">
            <button className="btn-white">Encontrar mi psicólogo <Icon.Arrow /></button>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer__inner">
          <div>
            <div className="footer__logo">conVos</div>
            <p className="footer__tagline">Conectamos personas con psicólogos certificados para acompañar su proceso terapéutico de forma online.</p>
          </div>
          <div>
            <div className="footer__col-title">Plataforma</div>
            <ul className="footer__links">
              <li><a href="#como-funciona">Cómo funciona</a></li>
              <li><a href="#psicologos">Psicólogos</a></li>
              <li><a href="#precios">Precios</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Para profesionales</div>
            <ul className="footer__links">
              <li><a href="#">Unirse como psicólogo</a></li>
              <li><a href="#">Requisitos</a></li>
              <li><a href="#">Portal de psicólogos</a></li>
            </ul>
          </div>
          <div>
            <div className="footer__col-title">Legal</div>
            <ul className="footer__links">
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Términos de uso</a></li>
              <li><a href="#">Política de cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 conVos. Todos los derechos reservados.</span>
          <span>Hecho con ♥ en Costa Rica</span>
        </div>
      </footer>
    </>
  )
}

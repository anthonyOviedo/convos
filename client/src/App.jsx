import { AuthProvider, useAuth } from './AuthContext.jsx'
import { ThemeProvider } from './ThemeContext.jsx'
import Navbar from './components/Navbar.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Landing from './pages/Landing.jsx'
import Onboarding from './pages/Onboarding.jsx'
import ClientDashboard from './pages/ClientDashboard.jsx'
import PsychologistDashboard from './pages/PsychologistDashboard.jsx'

function AppRoutes() {
  const { user, profile } = useAuth()

  // Still loading auth state
  if (user === undefined || (user && profile === undefined)) {
    return <div className="dash-loading">Cargando…</div>
  }

  // Not logged in — show landing
  if (!user) {
    return (
      <>
        <Navbar />
        <Landing />
      </>
    )
  }

  // Logged in but no profile yet — onboarding
  if (!profile) {
    return <Onboarding />
  }

  // Routed to dashboard by role
  if (profile.role === 'psychologist') return <PsychologistDashboard />
  return <ClientDashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <ThemeToggle className="theme-toggle--floating" />
      </AuthProvider>
    </ThemeProvider>
  )
}

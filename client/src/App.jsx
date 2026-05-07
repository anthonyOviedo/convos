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

  if (user === undefined || (user && profile === undefined)) {
    return <div className="dash-loading">Cargando…</div>
  }

  let content
  if (!user) {
    content = <Landing />
  } else if (!profile) {
    content = <Onboarding />
  } else if (profile.role === 'psychologist') {
    content = <PsychologistDashboard />
  } else {
    content = <ClientDashboard />
  }

  return (
    <>
      <Navbar />
      {content}
    </>
  )
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

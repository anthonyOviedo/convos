import { AuthProvider } from './AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Landing from './pages/Landing.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Landing />
    </AuthProvider>
  )
}

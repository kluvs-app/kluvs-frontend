import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ClubsDashboard from './pages/ClubsDashboard'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'
import DataDeletion from './pages/DataDeletion'
import DiscordPage from './pages/DiscordPage'
import ScrollToTop from './components/ScrollToTop'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent mx-auto"></div>
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading your library...</p>
          <div className="mt-2 text-[var(--color-text-secondary)] text-sm">Checking authentication</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <ClubsDashboard />
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/delete-account" element={<DataDeletion />} />
          <Route path="/discord" element={<DiscordPage />} />
          <Route
            path="/app/*"
            element={
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
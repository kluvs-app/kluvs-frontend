import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import KluvsSpinner from './components/KluvsSpinner'
import { ThemeProvider } from './contexts/ThemeContext'
import ClubsPage from './pages/ClubsPage'
import ClubDetailPage from './pages/ClubDetailPage'
import ProfilePage from './pages/ProfilePage'
import BooksPage from './pages/BooksPage'
import LoginPage from './pages/LoginPage'
import SetNewPasswordPage from './pages/SetNewPasswordPage'
import LandingPage from './pages/LandingPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'
import DataDeletion from './pages/DataDeletion'
import DiscordPage from './pages/DiscordPage'
import JoinPage from './pages/JoinPage'
import ScrollToTop from './components/ScrollToTop'
import AppShell from './components/layout/AppShell'

export function PublicAuthRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <KluvsSpinner size={64} className="mx-auto" />
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading your library...</p>
          <div className="mt-2 text-[var(--color-text-secondary)] text-sm">Checking authentication</div>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/me" replace />
  }

  return <LoginPage />
}

export function ProtectedRoute() {
  const { user, loading, isPasswordRecovery } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <KluvsSpinner size={64} className="mx-auto" />
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading your library...</p>
          <div className="mt-2 text-[var(--color-text-secondary)] text-sm">Checking authentication</div>
        </div>
      </div>
    )
  }

  if (isPasswordRecovery) {
    return <SetNewPasswordPage />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  const isAppDomain =
    window.location.hostname.startsWith('app.') ||
    import.meta.env.VITE_FORCE_APP_DOMAIN === 'true'

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        {isAppDomain ? (
          <AuthProvider>
            <Routes>
              <Route path="/" element={<PublicAuthRoute />} />
              <Route path="/login" element={<PublicAuthRoute />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/join/:token" element={<JoinPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/me" element={<ProfilePage />} />
                  <Route path="/clubs" element={<ClubsPage />} />
                  <Route path="/clubs/new" element={<ClubsPage openNewModal />} />
                  <Route path="/clubs/:slug" element={<ClubDetailPage />} />
                  <Route path="/books" element={<BooksPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/me" replace />} />
            </Routes>
          </AuthProvider>
        ) : (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/delete-account" element={<DataDeletion />} />
            <Route path="/discord" element={<DiscordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import KluvsSpinner from './components/KluvsSpinner'
import { ThemeProvider } from './contexts/ThemeContext'
import { APP_DOMAIN_STORAGE_KEY, isRealKluvsHost } from './utils/domainNav'
import PreviewDebugBadge from './components/PreviewDebugBadge'
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

function computeIsAppDomain(): boolean {
  if (window.location.hostname.startsWith('app.')) return true
  if (import.meta.env.VITE_FORCE_APP_DOMAIN === 'true') return true

  const override = new URLSearchParams(window.location.search).get('domain')
  if (override === 'app') return true
  if (override === 'marketing') return false

  try {
    return sessionStorage.getItem(APP_DOMAIN_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

// Captures a one-time `?domain=app|marketing` entry signal (from the Dashboard button /
// marketing link on hosts with no real app.* subdomain — see utils/domainNav.ts) into
// sessionStorage, then scrubs it from the visible URL via React Router's own history API
// (rather than a raw window.history call) so useLocation()/useSearchParams() elsewhere
// stay consistent with the address bar.
function DomainOverrideCleanup() {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const override = searchParams.get('domain')
    if (!override) return

    try {
      if (override === 'app') sessionStorage.setItem(APP_DOMAIN_STORAGE_KEY, 'true')
      else sessionStorage.removeItem(APP_DOMAIN_STORAGE_KEY)
    } catch { /* ignore */ }

    const next = new URLSearchParams(searchParams)
    next.delete('domain')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function App() {
  const [isAppDomain] = useState(computeIsAppDomain)

  return (
    <ThemeProvider>
      {!isRealKluvsHost(window.location.hostname) && <PreviewDebugBadge isAppDomain={isAppDomain} />}
      <BrowserRouter>
        <DomainOverrideCleanup />
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

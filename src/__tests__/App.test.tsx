import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { PublicAuthRoute, ProtectedRoute } from '../App'
import App from '../App'
import { APP_DOMAIN_STORAGE_KEY } from '../utils/domainNav'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('../pages/SetNewPasswordPage', () => ({
  default: () => <div>Set New Password Page</div>,
}))

vi.mock('../pages/LandingPage', () => ({ default: () => <div>Landing Page</div> }))
vi.mock('../pages/PrivacyPolicy', () => ({ default: () => <div>Privacy Policy</div> }))
vi.mock('../pages/TermsOfUse', () => ({ default: () => <div>Terms of Use</div> }))
vi.mock('../pages/DataDeletion', () => ({ default: () => <div>Data Deletion</div> }))
vi.mock('../pages/DiscordPage', () => ({ default: () => <div>Discord Page</div> }))
vi.mock('../pages/ProfilePage', () => ({ default: () => <div>Profile Page</div> }))
vi.mock('../pages/ClubsPage', () => ({ default: () => <div>Clubs Page</div> }))
vi.mock('../pages/ClubDetailPage', () => ({ default: () => <div>Club Detail Page</div> }))
vi.mock('../pages/BooksPage', () => ({ default: () => <div>Books Page</div> }))
vi.mock('../components/layout/AppShell', () => ({ default: () => <div>App Shell</div> }))
vi.mock('../components/ScrollToTop', () => ({ default: () => null }))

// Silence Supabase / other module noise in tests
vi.mock('../supabase', () => ({ supabase: { auth: {}, functions: {} } }))

import { useAuth } from '../contexts/AuthContext'
const mockUseAuth = vi.mocked(useAuth)

function renderInRouter(element: React.ReactNode, initialPath = '/target') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/target" element={element} />
          <Route path="/me" element={<div>Me Page</div>} />
          <Route path="/login" element={<div>Login Page Route</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  )
}

describe('PublicAuthRoute', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows a loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isPasswordRecovery: false } as never)
    renderInRouter(<PublicAuthRoute />)
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument()
  })

  it('redirects to /me when a user is already logged in', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false, isPasswordRecovery: false } as never)
    renderInRouter(<PublicAuthRoute />)
    expect(screen.getByText('Me Page')).toBeInTheDocument()
  })

  it('renders the login page when no user is logged in', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    renderInRouter(<PublicAuthRoute />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})

describe('ProtectedRoute', () => {
  beforeEach(() => { vi.clearAllMocks() })

  function renderProtectedRoute() {
    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page Route</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    )
  }

  it('shows a loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isPasswordRecovery: false } as never)
    renderProtectedRoute()
    expect(screen.getByText(/checking authentication/i)).toBeInTheDocument()
  })

  it('renders SetNewPasswordPage during a password recovery session', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false, isPasswordRecovery: true } as never)
    renderProtectedRoute()
    expect(screen.getByText('Set New Password Page')).toBeInTheDocument()
  })

  it('redirects to /login when no user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    renderProtectedRoute()
    expect(screen.getByText('Login Page Route')).toBeInTheDocument()
  })

  it('renders protected content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false, isPasswordRecovery: false } as never)
    renderProtectedRoute()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})

describe('App', () => {
  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => {
    vi.unstubAllEnvs()
    sessionStorage.removeItem(APP_DOMAIN_STORAGE_KEY)
    window.history.pushState({}, '', '/')
  })

  it('renders the marketing tree when not on the app domain', () => {
    vi.stubEnv('VITE_FORCE_APP_DOMAIN', '')
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    render(<App />)
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
  })

  it('renders the app tree when VITE_FORCE_APP_DOMAIN is set', () => {
    vi.stubEnv('VITE_FORCE_APP_DOMAIN', 'true')
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    render(<App />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders the app tree when the ?domain=app override is present in the URL', () => {
    vi.stubEnv('VITE_FORCE_APP_DOMAIN', '')
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    window.history.pushState({}, '', '/?domain=app')

    render(<App />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders the marketing tree when the ?domain=marketing override is present', () => {
    vi.stubEnv('VITE_FORCE_APP_DOMAIN', '')
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    sessionStorage.setItem(APP_DOMAIN_STORAGE_KEY, 'true')
    window.history.pushState({}, '', '/?domain=marketing')

    render(<App />)
    expect(screen.getByText('Landing Page')).toBeInTheDocument()
  })

  it('renders the app tree from a stored override with no query param present', () => {
    vi.stubEnv('VITE_FORCE_APP_DOMAIN', '')
    mockUseAuth.mockReturnValue({ user: null, loading: false, isPasswordRecovery: false } as never)
    sessionStorage.setItem(APP_DOMAIN_STORAGE_KEY, 'true')

    render(<App />)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})

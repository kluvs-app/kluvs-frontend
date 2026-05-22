import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { PublicAuthRoute, ProtectedRoute } from '../App'

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

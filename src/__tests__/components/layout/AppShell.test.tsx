import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AppShell from '../../../components/layout/AppShell'

const mockUseAuth = vi.fn()

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../../components/layout/AppSidebar', () => ({
  default: () => <aside data-testid="app-sidebar" />,
}))

vi.mock('../../../components/layout/MobileTopBar', () => ({
  default: () => <header data-testid="mobile-top-bar" />,
}))

function renderShell(path = '/me') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/me" element={<p>Me page</p>} />
          <Route path="/clubs/*" element={<p>Clubs page</p>} />
          <Route path="/books" element={<p>Books page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isOnline: true })
  })

  it('renders the chrome around the routed page', () => {
    renderShell('/me')
    expect(screen.getByTestId('mobile-top-bar')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Me page')
  })

  it('renders the bottom tabs with links', () => {
    renderShell()
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Me' })).toHaveAttribute('href', '/me')
    expect(screen.getByRole('link', { name: 'Clubs' })).toHaveAttribute('href', '/clubs')
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/books')
  })

  it('highlights the active tab, including nested routes', () => {
    renderShell('/clubs/club-1')
    expect(screen.getByRole('link', { name: 'Clubs' })).toHaveClass('text-primary')
    expect(screen.getByRole('link', { name: 'Me' })).not.toHaveClass('text-primary')
  })

  it('hides the offline banner while online', () => {
    renderShell()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the offline banner while offline', () => {
    mockUseAuth.mockReturnValue({ isOnline: false })
    renderShell()
    expect(screen.getByRole('status')).toHaveTextContent("You're offline. Content may be out of date.")
  })
})

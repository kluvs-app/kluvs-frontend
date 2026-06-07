import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AppSidebar from '../../../components/layout/AppSidebar'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSetTheme = vi.fn()
const mockUseAuth = vi.fn()
const mockUseTheme = vi.fn()

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}))

vi.mock('../../../supabase', () => ({
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

vi.mock('../../../components/modals/SignOutModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="sign-out-modal"><button onClick={onClose}>Close</button></div> : null,
}))

vi.mock('../../../components/modals/DiscordLinkModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="discord-link-modal"><button onClick={onClose}>Close</button></div> : null,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSidebar(path = '/me') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppSidebar />
    </MemoryRouter>
  )
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({
    member: { id: 1, name: 'Jane Doe', handle: '@jane', discord_id: 'disc-123' },
    isOnline: true,
  })
  mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppSidebar', () => {

  describe('Rendering', () => {
    it('renders the Kluvs wordmarks', () => {
      renderSidebar()
      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('renders all three nav links', () => {
      renderSidebar()
      expect(screen.getByRole('link', { name: /me/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /books/i })).toBeInTheDocument()
    })

    it('renders the member name', () => {
      renderSidebar()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    it('renders the handle with @ prefix', () => {
      renderSidebar()
      expect(screen.getByText('@jane')).toBeInTheDocument()
    })

    it('prefixes handle with @ when not already present', () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', handle: 'jane', discord_id: null },
        isOnline: true,
      })
      renderSidebar()
      expect(screen.getByText('@jane')).toBeInTheDocument()
    })

    it('renders "User" fallback when member is null', () => {
      mockUseAuth.mockReturnValue({ member: null, isOnline: true })
      renderSidebar()
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('renders Sign Out button', () => {
      renderSidebar()
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    it('renders the version string', () => {
      renderSidebar()
      expect(screen.getByText(/^v\d/)).toBeInTheDocument()
    })
  })

  describe('Nav active state', () => {
    it('marks the Me link as current when on /me', () => {
      renderSidebar('/me')
      const meLink = screen.getByRole('link', { name: /^me$/i })
      expect(meLink).toHaveAttribute('aria-current', 'page')
    })

    it('marks the Clubs link as current when on /clubs', () => {
      renderSidebar('/clubs')
      const clubsLink = screen.getByRole('link', { name: /^clubs$/i })
      expect(clubsLink).toHaveAttribute('aria-current', 'page')
    })

    it('does not mark Me as current when on /clubs', () => {
      renderSidebar('/clubs')
      const meLink = screen.getByRole('link', { name: /^me$/i })
      expect(meLink).not.toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Connect Discord button', () => {
    it('is hidden when member has a discord_id', () => {
      renderSidebar()
      expect(screen.queryByRole('button', { name: /connect discord/i })).not.toBeInTheDocument()
    })

    it('is shown when member has no discord_id', () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', discord_id: null },
        isOnline: true,
      })
      renderSidebar()
      expect(screen.getByRole('button', { name: /connect discord/i })).toBeInTheDocument()
    })

    it('opens DiscordLinkModal when clicked', async () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', discord_id: null },
        isOnline: true,
      })
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /connect discord/i }))
      expect(screen.getByTestId('discord-link-modal')).toBeInTheDocument()
    })

    it('closes DiscordLinkModal when its onClose is called', async () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', discord_id: null },
        isOnline: true,
      })
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /connect discord/i }))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('discord-link-modal')).not.toBeInTheDocument()
    })
  })

  describe('Theme toggle', () => {
    it('renders with label "Dark" when theme is dark', () => {
      renderSidebar()
      expect(screen.getByRole('button', { name: /theme: dark/i })).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
    })

    it('renders with label "Light" when theme is light', () => {
      mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme })
      renderSidebar()
      expect(screen.getByRole('button', { name: /theme: light/i })).toBeInTheDocument()
      expect(screen.getByText('Light')).toBeInTheDocument()
    })

    it('calls setTheme("light") when clicked in dark mode', async () => {
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /theme: dark/i }))
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('calls setTheme("dark") when clicked in light mode', async () => {
      mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme })
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /theme: light/i }))
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })
  })

  describe('Sign Out', () => {
    it('opens SignOutModal when Sign Out is clicked', async () => {
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /sign out/i }))
      expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument()
    })

    it('closes SignOutModal when its onClose is called', async () => {
      const user = userEvent.setup()
      renderSidebar()
      await user.click(screen.getByRole('button', { name: /sign out/i }))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('sign-out-modal')).not.toBeInTheDocument()
    })
  })

  describe('Offline state', () => {
    it('applies top-9 offset when offline', () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', discord_id: null },
        isOnline: false,
      })
      const { container } = renderSidebar()
      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('top-9')
    })

    it('applies top-0 when online', () => {
      const { container } = renderSidebar()
      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('top-0')
    })
  })
})

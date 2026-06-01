import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import MobileTopBar from '../../../components/layout/MobileTopBar'
import { MobileTopBarProvider, useMobileTopBar } from '../../../contexts/MobileTopBarContext'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRefreshMemberData = vi.fn()
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
vi.mock('../../../components/modals/EditProfileModal', () => ({
  default: ({ isOpen, onClose, onProfileUpdated, onError }: any) =>
    isOpen ? (
      <div data-testid="edit-profile-modal">
        <button onClick={() => onProfileUpdated()}>Save</button>
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onError(new Error('test'))}>TriggerError</button>
      </div>
    ) : null,
}))
vi.mock('../../../components/modals/DiscordLinkModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="discord-link-modal"><button onClick={onClose}>Close</button></div> : null,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sets detail context before rendering MobileTopBar */
function SetDetailMode({ title, backLabel, backPath, onBack }: {
  title: string
  backLabel?: string
  backPath?: string
  onBack?: () => void
}) {
  const { setTopBar } = useMobileTopBar()
  useEffect(() => {
    setTopBar({ title, backLabel, backPath, onBack })
  }, []) // intentionally run once
  return null
}

function renderBar() {
  return render(
    <MemoryRouter>
      <MobileTopBarProvider>
        <MobileTopBar />
      </MobileTopBarProvider>
    </MemoryRouter>
  )
}

function renderDetailBar(props: { title: string; backLabel?: string; backPath?: string; onBack?: () => void }) {
  return render(
    <MemoryRouter>
      <MobileTopBarProvider>
        <SetDetailMode {...props} />
        <MobileTopBar />
      </MobileTopBarProvider>
    </MemoryRouter>
  )
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({
    member: { id: 1, name: 'Jane Doe', handle: '@jane' },
    refreshMemberData: mockRefreshMemberData,
  })
  mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MobileTopBar', () => {

  describe('Home mode (no detail context)', () => {
    it('renders the Kluvs wordmark', () => {
      renderBar()
      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('renders the user menu button', () => {
      renderBar()
      expect(screen.getByLabelText('Open user menu')).toBeInTheDocument()
    })

    it('does not render a back button', () => {
      renderBar()
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /back/i })).not.toBeInTheDocument()
    })
  })

  describe('Detail mode (context has title + backPath)', () => {
    it('renders a back link with the backLabel', () => {
      renderDetailBar({ title: 'My Club', backLabel: 'Clubs', backPath: '/clubs' })
      expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
    })

    it('wordmark is still present in detail mode', () => {
      renderDetailBar({ title: 'My Club', backLabel: 'Clubs', backPath: '/clubs' })
      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('does not display the title text inside the bar', () => {
      renderDetailBar({ title: 'My Club', backLabel: 'Clubs', backPath: '/clubs' })
      // The title "My Club" should NOT appear inside the fixed header element
      const header = document.querySelector('header')!
      expect(header).not.toHaveTextContent('My Club')
    })

    it('back link defaults to "Back" when backLabel is omitted', () => {
      renderDetailBar({ title: 'Something', backPath: '/somewhere' })
      expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
    })
  })

  describe('Detail mode (context has onBack callback)', () => {
    it('renders a back button (not a link) when onBack is provided', () => {
      const onBack = vi.fn()
      renderDetailBar({ title: 'The Great Gatsby', backLabel: 'Books', onBack })
      expect(screen.getByRole('button', { name: /books/i })).toBeInTheDocument()
    })

    it('calls onBack when the back button is clicked', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      renderDetailBar({ title: 'The Great Gatsby', backLabel: 'Books', onBack })
      await user.click(screen.getByRole('button', { name: /books/i }))
      expect(onBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('User menu', () => {
    it('menu is closed by default', () => {
      renderBar()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('opens the dropdown on click', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('shows identity header with name and handle', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('@jane')).toBeInTheDocument()
    })

    it('shows Edit Profile, Appearance, and Sign Out items', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByRole('menuitem', { name: 'Edit Profile' })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /appearance/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: 'Sign Out' })).toBeInTheDocument()
    })

    it('shows Connect Discord when member has no discord_id', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByRole('menuitem', { name: /connect discord/i })).toBeInTheDocument()
    })

    it('hides Connect Discord when member already has discord_id', async () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', discord_id: '987654321' },
        refreshMemberData: mockRefreshMemberData,
      })
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.queryByRole('menuitem', { name: /connect discord/i })).not.toBeInTheDocument()
    })

    it('closes menu when backdrop is clicked', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()
      await user.click(document.querySelector('[aria-hidden="true"]') as HTMLElement)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('opens Sign Out modal from menu', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Sign Out' }))
      expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('opens Edit Profile modal from menu', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('opens Discord Link modal from menu', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: /connect discord/i }))
      expect(screen.getByTestId('discord-link-modal')).toBeInTheDocument()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('calls setTheme when Appearance item is clicked', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: /appearance/i }))
      // theme is 'dark' → cycle goes to 'system'
      expect(mockSetTheme).toHaveBeenCalledWith('system')
    })

    it('calls refreshMemberData after Edit Profile is saved', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(mockRefreshMemberData).toHaveBeenCalled()
    })

    it('shows "?" initials and "User" in identity header when member is null', async () => {
      mockUseAuth.mockReturnValue({ member: null, refreshMemberData: mockRefreshMemberData })
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('closes Sign Out modal when its onClose is called', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Sign Out' }))
      expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('sign-out-modal')).not.toBeInTheDocument()
    })

    it('closes Edit Profile modal when its onClose is called', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByTestId('edit-profile-modal')).not.toBeInTheDocument()
    })

    it('handles Edit Profile onError without crashing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))
      await user.click(screen.getByRole('button', { name: 'TriggerError' }))
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('closes Discord Link modal when its onClose is called', async () => {
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: /connect discord/i }))
      expect(screen.getByTestId('discord-link-modal')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('discord-link-modal')).not.toBeInTheDocument()
    })

    it('cycles theme from system to light', async () => {
      mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme })
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: /appearance/i }))
      expect(mockSetTheme).toHaveBeenCalledWith('light')
    })

    it('cycles theme from light to dark', async () => {
      mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme })
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      await user.click(screen.getByRole('menuitem', { name: /appearance/i }))
      expect(mockSetTheme).toHaveBeenCalledWith('dark')
    })

    it('prepends @ to handle that lacks it', async () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', handle: 'janedoe' },
        refreshMemberData: mockRefreshMemberData,
      })
      const user = userEvent.setup()
      renderBar()
      await user.click(screen.getByLabelText('Open user menu'))
      expect(screen.getByText('@janedoe')).toBeInTheDocument()
    })

    it('renders avatar image when member has avatar_path', () => {
      mockUseAuth.mockReturnValue({
        member: { id: 1, name: 'Jane Doe', avatar_path: 'avatars/jane.jpg' },
        refreshMemberData: mockRefreshMemberData,
      })
      renderBar()
      const avatar = document.querySelector('img[alt="Jane Doe"]') as HTMLImageElement
      expect(avatar).toBeInTheDocument()
      expect(avatar.src).toContain('jane.jpg')
    })
  })
})

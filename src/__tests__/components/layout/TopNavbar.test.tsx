import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import TopNavbar from '../../../components/layout/TopNavbar'

const mockRefreshMemberData = vi.fn()

// Mock useAuth
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    member: {
      id: 1,
      name: 'Test User',
    },
    refreshMemberData: mockRefreshMemberData,
  }),
}))

// Mock ThemeToggle
vi.mock('../../../components/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}))

// Mock modals (TopNavbar renders SignOutModal and EditProfileModal)
vi.mock('../../../components/modals/SignOutModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="sign-out-modal" role="dialog"><button onClick={onClose}>Close</button>Sign Out Modal</div> : null,
}))
vi.mock('../../../components/modals/EditProfileModal', () => ({
  default: ({ isOpen, onProfileUpdated }: any) => isOpen ? <div data-testid="edit-profile-modal" role="dialog"><button onClick={() => onProfileUpdated()}>Close</button>Edit Profile Modal</div> : null,
}))

describe('TopNavbar', () => {
  const defaultProps = {
    isAdmin: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should display Kluvs brand name', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      expect(screen.getByText('Kluvs')).toBeInTheDocument()
    })

    it('should display user name', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render ThemeToggle', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  describe('Hamburger Menu', () => {
    it('should show hamburger when onMenuToggle is provided', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} onMenuToggle={vi.fn()} /></MemoryRouter>)

      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument()
    })

    it('should not show hamburger when onMenuToggle is not provided', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument()
    })

    it('should call onMenuToggle when hamburger is clicked', async () => {
      const onMenuToggle = vi.fn()
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} onMenuToggle={onMenuToggle} /></MemoryRouter>)

      await user.click(screen.getByLabelText('Open navigation menu'))

      expect(onMenuToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Menu', () => {
    it('should have user menu button with aria attributes', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      const menuButton = screen.getByLabelText('User menu')
      expect(menuButton).toHaveAttribute('aria-haspopup', 'true')
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should open user menu on click', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))

      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: 'Edit Profile' })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: 'Sign Out' })).toBeInTheDocument()
    })

    it('should set aria-expanded to true when menu is open', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))

      expect(screen.getByLabelText('User menu')).toHaveAttribute('aria-expanded', 'true')
    })

    it('should close menu when clicking backdrop', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      // Open menu
      await user.click(screen.getByLabelText('User menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // Click backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
      await user.click(backdrop)

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should close menu after clicking Edit Profile', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
    })

    it('should open Edit Profile modal from menu', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))

      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
    })

    it('should close menu after clicking Sign Out', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.click(screen.getByRole('menuitem', { name: 'Sign Out' }))

      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument()
    })

    it('should open Sign Out modal from menu', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Sign Out' }))

      expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument()
    })

    it('should call refreshMemberData when EditProfileModal calls onProfileUpdated', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      await user.click(screen.getByLabelText('User menu'))
      await user.click(screen.getByRole('menuitem', { name: 'Edit Profile' }))

      // Simulate onProfileUpdated being called from the modal
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)

      // Should have called refreshMemberData
      expect(mockRefreshMemberData).toHaveBeenCalled()
    })

    it('should toggle menu when clicking same button twice', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      const menuButton = screen.getByLabelText('User menu')

      // Open menu
      await user.click(menuButton)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // Close menu by clicking button again
      await user.click(menuButton)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('User Initial Avatar', () => {
    it('should display first letter of user name', () => {
      render(<MemoryRouter><TopNavbar {...defaultProps} /></MemoryRouter>)

      expect(screen.getByText('T')).toBeInTheDocument() // First letter of "Test User"
    })
  })
})

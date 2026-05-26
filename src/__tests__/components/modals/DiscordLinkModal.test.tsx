import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscordLinkModal from '../../../components/modals/DiscordLinkModal'

const mockLinkIdentity = vi.fn()

vi.mock('../../../supabase', () => ({
  supabase: {
    auth: {
      linkIdentity: (...args: any[]) => mockLinkIdentity(...args),
    },
  },
}))

describe('DiscordLinkModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLinkIdentity.mockResolvedValue({ error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Connect Discord')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      const { container } = render(<DiscordLinkModal {...defaultProps} isOpen={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should display the Sign in with Discord button', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /sign in with discord/i })).toBeInTheDocument()
    })

    it('should display the Cancel button', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should display the close button', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog attributes', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-discord-link')
    })

    it('should have a descriptive heading', () => {
      render(<DiscordLinkModal {...defaultProps} />)
      expect(screen.getByText('Sign in with Discord to link your account automatically.')).toBeInTheDocument()
    })
  })

  describe('OAuth Flow', () => {
    it('should call linkIdentity with discord provider and redirectTo on button click', async () => {
      const user = userEvent.setup()
      render(<DiscordLinkModal {...defaultProps} />)

      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      expect(mockLinkIdentity).toHaveBeenCalledWith({
        provider: 'discord',
        options: { redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL }
      })
    })

    it('should show loading state while connecting', async () => {
      const user = userEvent.setup()
      mockLinkIdentity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<DiscordLinkModal {...defaultProps} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      expect(screen.getByText('Connecting…')).toBeInTheDocument()
    })

    it('should disable button during OAuth flow', async () => {
      const user = userEvent.setup()
      mockLinkIdentity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<DiscordLinkModal {...defaultProps} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      expect(button).toBeDisabled()
    })

    it('should show error message on linkIdentity failure', async () => {
      const user = userEvent.setup()
      mockLinkIdentity.mockResolvedValue({ error: new Error('OAuth failed') })

      render(<DiscordLinkModal {...defaultProps} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('OAuth failed')).toBeInTheDocument()
      })
    })

    it('should show generic error message for unknown error format', async () => {
      const user = userEvent.setup()
      mockLinkIdentity.mockRejectedValue(null)

      render(<DiscordLinkModal {...defaultProps} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Failed to connect Discord')).toBeInTheDocument()
      })
    })

    it('should clear error when closing', async () => {
      const user = userEvent.setup()
      mockLinkIdentity.mockResolvedValue({ error: new Error('OAuth failed') })

      render(<DiscordLinkModal {...defaultProps} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('OAuth failed')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('Close Behavior', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<DiscordLinkModal {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<DiscordLinkModal {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should close on Escape key press', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<DiscordLinkModal {...defaultProps} onClose={onClose} />)

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('should not close on Escape key while loading', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      mockLinkIdentity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 200))
      )

      render(<DiscordLinkModal {...defaultProps} onClose={onClose} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      await user.keyboard('{Escape}')

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not close Cancel button while loading', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      mockLinkIdentity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 200))
      )

      render(<DiscordLinkModal {...defaultProps} onClose={onClose} />)
      const button = screen.getByRole('button', { name: /sign in with discord/i })
      await user.click(button)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      expect(cancelButton).toBeDisabled()
    })
  })
})

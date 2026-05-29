import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShareClubModal from '../../../components/modals/ShareClubModal'
import { mockClub } from '../../utils/mocks'
import type { Club } from '../../../types'

vi.mock('../../../supabase', () => {
  const mockClient = {
    functions: { invoke: vi.fn() },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
  }
})

const mockClubPrivate: Club = {
  ...mockClub,
  join_policy: 'PRIVATE',
  invite_token: null,
}

const mockClubInvite: Club = {
  ...mockClub,
  join_policy: 'INVITE_LINK',
  invite_token: 'abc-123-token',
}

describe('ShareClubModal', () => {
  let mockSupabase: any
  const mockOnClose = vi.fn()

  beforeEach(async () => {
    const supabaseModule = await import('../../../supabase')
    mockSupabase = supabaseModule.supabase as any
    vi.clearAllMocks()

    mockSupabase.functions.invoke.mockResolvedValue({
      data: { club: { ...mockClub, join_policy: 'INVITE_LINK', invite_token: 'new-token-xyz' } },
      error: null,
    })
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ShareClubModal isOpen={false} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Share Club')).toBeInTheDocument()
    })

    it('should render Who can join label', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.getByText('Who can join?')).toBeInTheDocument()
    })

    it('should render Private and Invite Link toggle buttons', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.getByRole('button', { name: 'Private' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Invite Link' })).toBeInTheDocument()
    })

    it('should show Private button as active when policy is PRIVATE', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      const privateBtn = screen.getByRole('button', { name: 'Private' })
      expect(privateBtn).toHaveClass('bg-primary')
    })

    it('should show Invite Link button as active when policy is INVITE_LINK', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      const inviteBtn = screen.getByRole('button', { name: 'Invite Link' })
      expect(inviteBtn).toHaveClass('bg-primary')
    })

    it('should show invite URL when policy is INVITE_LINK', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      expect(screen.getByText(/abc-123-token/)).toBeInTheDocument()
    })

    it('should not show invite URL when policy is PRIVATE', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.queryByText(/abc-123-token/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Copy/i })).not.toBeInTheDocument()
    })

    it('should show Copy button when invite link is active', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    })
  })

  describe('Toggle behavior', () => {
    it('should call invokeFunction with INVITE_LINK when switching to Invite Link', async () => {
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ id: mockClub.id, join_policy: 'INVITE_LINK' }),
          })
        )
      })
    })

    it('should call invokeFunction with PRIVATE when switching to Private', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { club: { ...mockClub, join_policy: 'PRIVATE', invite_token: null } },
        error: null,
      })
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      await user.click(screen.getByRole('button', { name: 'Private' }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ id: mockClub.id, join_policy: 'PRIVATE' }),
          })
        )
      })
    })

    it('should display new invite token after switching to INVITE_LINK', async () => {
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        expect(screen.getByText(/new-token-xyz/)).toBeInTheDocument()
      })
    })

    it('should not call API when clicking already-active policy', async () => {
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Private' }))
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled()
    })
  })

  describe('Copy button', () => {
    it('should copy invite URL to clipboard when Copy is clicked', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })

      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      await user.click(screen.getByRole('button', { name: 'Copy' }))
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('abc-123-token')
      )
    })

    it('should show "Copied!" feedback after clicking Copy', async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      })

      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubInvite} />)
      await user.click(screen.getByRole('button', { name: 'Copy' }))
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })
  })

  describe('Error states', () => {
    it('should not update policy state when API call fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Server error'),
      })
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        // Policy should remain PRIVATE (Private button still has bg-primary class)
        expect(screen.getByRole('button', { name: 'Private' })).toHaveClass('bg-primary')
      })
    })

    it('should show an inline error message when API call fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Server error'),
      })
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
    })

    it('should show fallback error message when API error has no message', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: {},
      })
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        expect(screen.getByText('Failed to update sharing settings')).toBeInTheDocument()
      })
    })

    it('should clear the error when the modal is closed and reopened', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Server error'),
      })
      const user = userEvent.setup()
      const { rerender } = render(
        <ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />
      )
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

      // Close then reopen
      rerender(<ShareClubModal isOpen={false} onClose={mockOnClose} club={mockClubPrivate} />)
      rerender(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)

      expect(screen.queryByText('Server error')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role with aria-modal', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('should have close button', () => {
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ShareClubModal isOpen={true} onClose={mockOnClose} club={mockClubPrivate} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})

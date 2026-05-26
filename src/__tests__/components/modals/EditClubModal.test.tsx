import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditClubModal from '../../../components/modals/EditClubModal'
import { mockAdminMember, mockRegularMember, mockClub } from '../../utils/mocks'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../supabase', () => {
  const mockClient = { functions: { invoke: vi.fn() } }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
  }
})

const mockGuilds = [
  {
    id: 'server-1',
    name: "Blingers' Books",
    channels: [
      { id: 'book-club', name: 'book-club' },
      { id: 'ch-2', name: 'general' },
    ],
  },
]

describe('EditClubModal', () => {
  let mockSupabase: any
  let mockUseAuth: any

  const mockOnClose = vi.fn()
  const mockOnClubUpdated = vi.fn()
  const mockOnDeleteClub = vi.fn()
  const mockOnError = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    club: mockClub,
    onClubUpdated: mockOnClubUpdated,
    onDeleteClub: mockOnDeleteClub,
    onError: mockOnError,
  }

  beforeEach(async () => {
    const supabaseModule = await import('../../../supabase')
    mockSupabase = supabaseModule.supabase as any
    const authModule = await import('../../../contexts/AuthContext')
    mockUseAuth = authModule.useAuth as ReturnType<typeof vi.fn>

    vi.clearAllMocks()

    // Default: admin member with Discord, guilds load successfully
    mockUseAuth.mockReturnValue({ member: mockAdminMember })
    mockSupabase.functions.invoke.mockResolvedValue({ data: mockGuilds, error: null })
  })

  // ─── Rendering ───────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders when isOpen is true', async () => {
      render(<EditClubModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit Club')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<EditClubModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('has correct dialog aria attributes', () => {
      render(<EditClubModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-edit-club')
    })
  })

  // ─── Pre-population ───────────────────────────────────────────────────────────

  describe('Form pre-population', () => {
    it('pre-populates the club name', () => {
      render(<EditClubModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('e.g., Fantasy Book Club')).toHaveValue(mockClub.name)
    })

    it('pre-populates the founded date', () => {
      render(<EditClubModal {...defaultProps} />)
      const dateInput = screen.getByDisplayValue(mockClub.founded_date!)
      expect(dateInput).toBeInTheDocument()
    })

    it('shows the founded date helper note', () => {
      render(<EditClubModal {...defaultProps} />)
      expect(screen.getByText(/automatically set when your club was created/)).toBeInTheDocument()
    })

    it('shows the Discord section for members with discord_id', async () => {
      render(<EditClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Discord')).toBeInTheDocument()
      })
    })

    it('hides the Discord section for members without discord_id', () => {
      mockUseAuth.mockReturnValue({ member: mockRegularMember })
      render(<EditClubModal {...defaultProps} />)
      expect(screen.queryByText('Discord')).not.toBeInTheDocument()
    })

    it('pre-selects the channel matching the club discord_channel', async () => {
      render(<EditClubModal {...defaultProps} />)
      await waitFor(() => {
        const channelSelect = screen.getByLabelText(/Channel/i)
        expect(channelSelect).toHaveValue(mockClub.discord_channel)
      })
    })
  })

  // ─── Close behaviour ──────────────────────────────────────────────────────────

  describe('Close behaviour', () => {
    it('calls onClose when ✕ button is clicked', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)
      await user.click(screen.getByLabelText('Close'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose on Escape key', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Name validation ──────────────────────────────────────────────────────────

  describe('Name validation', () => {
    it('disables Save when name is cleared', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('e.g., Fantasy Book Club')
      await user.clear(nameInput)
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save when name is non-empty', async () => {
      render(<EditClubModal {...defaultProps} />)
      // mockClub.name is pre-populated so Save should be enabled immediately
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
      })
    })
  })

  // ─── Discord warning ──────────────────────────────────────────────────────────

  describe('Discord change warnings', () => {
    it('shows no warning when connecting a channel for the first time', async () => {
      const user = userEvent.setup()
      const clubNoChannel = { ...mockClub, discord_channel: '' }
      render(<EditClubModal {...defaultProps} club={clubNoChannel} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-2')

      expect(screen.queryByText(/I understand/)).not.toBeInTheDocument()
    })

    it('shows rerouting warning when changing to a different channel', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-2')

      expect(screen.getByText(/moving this club to a different Discord channel/)).toBeInTheDocument()
      expect(screen.getByLabelText('I understand')).toBeInTheDocument()
    })

    it('shows disconnect warning when clearing the channel', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), '')

      expect(screen.getByText(/disconnecting this club from Discord/)).toBeInTheDocument()
      expect(screen.getByLabelText('I understand')).toBeInTheDocument()
    })

    it('disables Save when Discord changed but acknowledgment not checked', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-2')

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save after checking the acknowledgment checkbox', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-2')
      await user.click(screen.getByLabelText('I understand'))

      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

    it('clears the warning when the channel is reverted to the original', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => screen.getByLabelText(/Channel/i))
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-2')
      expect(screen.getByText(/I understand/)).toBeInTheDocument()

      await user.selectOptions(screen.getByLabelText(/Channel/i), mockClub.discord_channel)
      expect(screen.queryByText(/I understand/)).not.toBeInTheDocument()
    })
  })

  // ─── Delete club ──────────────────────────────────────────────────────────────

  describe('Delete club', () => {
    it('renders the Delete club button', () => {
      render(<EditClubModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Delete club…' })).toBeInTheDocument()
    })

    it('calls onDeleteClub when Delete club is clicked', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Delete club…' }))
      expect(mockOnDeleteClub).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Submission ───────────────────────────────────────────────────────────────

  describe('Submission', () => {
    it('calls PUT /club with updated fields on save', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())

      const nameInput = screen.getByPlaceholderText('e.g., Fantasy Book Club')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Club Name')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ name: 'Updated Club Name' }),
          })
        )
      })
    })

    it('calls onClubUpdated and onClose on successful save', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockOnClubUpdated).toHaveBeenCalledTimes(1)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('calls onError and stays open on failed save', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      // Wait for guilds fetch to complete, then override for the PUT call
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: new Error('Server error') })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Server error')
        expect(mockOnClubUpdated).not.toHaveBeenCalled()
      })
    })

    it('shows spinner and disables Save while loading', async () => {
      const user = userEvent.setup()
      render(<EditClubModal {...defaultProps} />)

      // Wait for guilds fetch to complete, then override for the PUT call
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled())
      mockSupabase.functions.invoke.mockImplementationOnce(() => new Promise(() => {}))

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(screen.getByText('Saving…')).toBeInTheDocument()
      })
    })
  })
})

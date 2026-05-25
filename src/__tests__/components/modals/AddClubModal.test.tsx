import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddClubModal from '../../../components/modals/AddClubModal'
import { mockAdminMember, mockRegularMember } from '../../utils/mocks'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../supabase', () => {
  const mockClient = {
    functions: { invoke: vi.fn() },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
  }
})

const mockGuilds1 = [
  {
    id: 'server-1',
    name: "Blingers' Books",
    channels: [
      { id: 'ch-1', name: 'general' },
      { id: 'ch-2', name: 'book-club' },
    ],
  },
]

const mockGuilds2 = [
  { id: 'server-1', name: "Blingers' Books", channels: [{ id: 'ch-1', name: 'general' }] },
  { id: 'server-2', name: 'Another Server', channels: [{ id: 'ch-3', name: 'reading' }] },
]

describe('AddClubModal', () => {
  let mockSupabase: any
  let mockUseAuth: any
  const mockOnClose = vi.fn()
  const mockOnClubCreated = vi.fn()
  const mockOnError = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onClubCreated: mockOnClubCreated,
    onError: mockOnError,
  }

  beforeEach(async () => {
    const supabaseModule = await import('../../../supabase')
    mockSupabase = supabaseModule.supabase as any
    const authModule = await import('../../../contexts/AuthContext')
    mockUseAuth = authModule.useAuth as ReturnType<typeof vi.fn>

    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({ member: mockAdminMember })

    mockSupabase.functions.invoke.mockImplementation((path: string) => {
      if (path.startsWith('discord-guilds')) {
        return Promise.resolve({ data: mockGuilds1, error: null })
      }
      return Promise.resolve({ data: { id: 'test-uuid-123' }, error: null })
    })
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AddClubModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('New Club')).toBeInTheDocument()
    })

    it('should render club name field', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByText(/Club Name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., Fantasy Book Club')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Club/i })).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should show Discord section for member with Discord connected', async () => {
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Discord')).toBeInTheDocument()
      })
    })

    it('should not show Discord section for member without Discord', () => {
      mockUseAuth.mockReturnValue({ member: mockRegularMember })
      render(<AddClubModal {...defaultProps} />)
      expect(screen.queryByText('Discord')).not.toBeInTheDocument()
    })
  })

  describe('Form Input', () => {
    it('should allow typing in club name field', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('e.g., Fantasy Book Club')
      await user.type(nameInput, 'My Book Club')
      expect(nameInput).toHaveValue('My Book Club')
    })

    it('should limit club name to 100 characters', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('e.g., Fantasy Book Club')).toHaveAttribute('maxLength', '100')
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when club name is empty', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /Create Club/i })).toBeDisabled()
    })

    it('should enable submit button when club name is filled', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      expect(screen.getByRole('button', { name: /Create Club/i })).toBeEnabled()
    })

    it('should disable submit button when club name is only whitespace', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), '   ')
      expect(screen.getByRole('button', { name: /Create Club/i })).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should submit with name and null server when no server selected', async () => {
      mockUseAuth.mockReturnValue({ member: mockRegularMember })
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ name: 'My Book Club', server_id: null }),
          })
        )
      })
    })

    it('should trim club name before submission', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), '  My Book Club  ')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ name: 'My Book Club' }),
          })
        )
      })
    })

    it('should send null for discord_channel when none selected', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ discord_channel: null }),
          })
        )
      })
    })

    it('should submit with selected channel', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByLabelText(/Channel/i)).toBeInTheDocument())
      await user.selectOptions(screen.getByLabelText(/Channel/i), 'ch-1')
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ discord_channel: 'ch-1' }),
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds1, error: null })
        return new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
      })
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      expect(screen.getByText('Creating…')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByText('Creating…')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })

    it('should call onClubCreated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockOnClubCreated).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should call onError with message on API failure', async () => {
      const user = userEvent.setup()
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds1, error: null })
        return Promise.resolve({ data: null, error: new Error('Server error') })
      })
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Server error')
      })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should call onError with generic message for unknown errors', async () => {
      const user = userEvent.setup()
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds1, error: null })
        return Promise.reject('Unknown error')
      })
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to create club')
      })
    })
  })

  describe('Modal Closing', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /Cancel/i }))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should clear form when closed and reopened', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: 'Close' }))
      rerender(<AddClubModal {...defaultProps} isOpen={false} />)
      rerender(<AddClubModal {...defaultProps} isOpen={true} />)
      expect(screen.getByPlaceholderText('e.g., Fantasy Book Club')).toHaveValue('')
    })

    it('should call onError with empty string when closing', async () => {
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(mockOnError).toHaveBeenCalledWith('')
    })

    it('should disable close buttons during submission', async () => {
      const user = userEvent.setup()
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds1, error: null })
        return new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100))
      })
      render(<AddClubModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'My Book Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
      await waitFor(() => expect(mockOnClose).toHaveBeenCalled(), { timeout: 200 })
    })
  })

  describe('Discord section', () => {
    it('should fetch guilds on open', async () => {
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          `discord-guilds?member_id=${encodeURIComponent(mockAdminMember.id)}`,
          { method: 'GET' }
        )
      })
    })

    it('should show loading indicator while fetching guilds', () => {
      mockSupabase.functions.invoke.mockImplementation(() => new Promise(() => {}))
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByText('Loading servers…')).toBeInTheDocument()
    })

    it('should show static server info for a single guild', async () => {
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(mockGuilds1[0].name)).toBeInTheDocument()
      })
      expect(screen.queryByLabelText(/^Server$/i)).not.toBeInTheDocument()
    })

    it('should auto-select single guild and show channel dropdown', async () => {
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/Channel/i)).toBeInTheDocument()
      })
    })

    it('should show server dropdown with all options for multiple guilds', async () => {
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds2, error: null })
        return Promise.resolve({ data: { id: 'test-uuid-123' }, error: null })
      })
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/^Server$/i)).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'No server' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: mockGuilds2[0].name })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: mockGuilds2[1].name })).toBeInTheDocument()
      })
    })

    it('should show channel dropdown when server is selected from multi-guild list', async () => {
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds2, error: null })
        return Promise.resolve({ data: { id: 'test-uuid-123' }, error: null })
      })
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByLabelText(/^Server$/i)).toBeInTheDocument())
      await user.selectOptions(screen.getByLabelText(/^Server$/i), 'server-1')
      await waitFor(() => {
        expect(screen.getByLabelText(/Channel/i)).toBeInTheDocument()
        expect(screen.getByRole('option', { name: '#general' })).toBeInTheDocument()
      })
    })

    it('should hide channel dropdown when "No server" is selected', async () => {
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds2, error: null })
        return Promise.resolve({ data: { id: 'test-uuid-123' }, error: null })
      })
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByLabelText(/^Server$/i)).toBeInTheDocument())
      await user.selectOptions(screen.getByLabelText(/^Server$/i), 'server-1')
      await user.selectOptions(screen.getByLabelText(/^Server$/i), '')
      expect(screen.queryByLabelText(/Channel/i)).not.toBeInTheDocument()
    })

    it('should submit with correct server_id when server is selected', async () => {
      mockSupabase.functions.invoke.mockImplementation((path: string) => {
        if (path.startsWith('discord-guilds')) return Promise.resolve({ data: mockGuilds2, error: null })
        return Promise.resolve({ data: { id: 'test-uuid-123' }, error: null })
      })
      const user = userEvent.setup()
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByLabelText(/^Server$/i)).toBeInTheDocument())
      await user.selectOptions(screen.getByLabelText(/^Server$/i), 'server-2')
      await user.type(screen.getByPlaceholderText('e.g., Fantasy Book Club'), 'Test Club')
      await user.click(screen.getByRole('button', { name: /Create Club/i }))
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            body: expect.objectContaining({ server_id: 'server-2' }),
          })
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role with aria-modal', () => {
      render(<AddClubModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby pointing to title', () => {
      render(<AddClubModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title-add-club')
    })

    it('should indicate optional channel field', async () => {
      render(<AddClubModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('(optional)')).toBeInTheDocument()
      })
    })
  })
})

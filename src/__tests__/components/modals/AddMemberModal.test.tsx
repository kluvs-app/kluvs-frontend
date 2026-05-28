import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddMemberModal from '../../../components/modals/AddMemberModal'
import { mockClub } from '../../utils/mocks'
import type { Club } from '../../../types'

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
  invokeFunction: (...args: any[]) => mockInvoke(...args),
}))

const clubWithInviteLink: Club = {
  ...mockClub,
  join_policy: 'INVITE_LINK',
  invite_token: 'abc123token',
}

describe('AddMemberModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    onMemberAdded: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: { members: [] }, error: null })
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<AddMemberModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Add Member')).not.toBeInTheDocument()
    })

    it('should render title and search input when open', () => {
      render(<AddMemberModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Add Member' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search for a member by name or handle')).toBeInTheDocument()
    })

    it('should have dialog role and aria attributes', () => {
      render(<AddMemberModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-add-member')
    })

    it('should show "Find a member" and "Invite link" section labels', () => {
      render(<AddMemberModal {...defaultProps} />)
      expect(screen.getByText('Find a member')).toBeInTheDocument()
      expect(screen.getByText('Invite link')).toBeInTheDocument()
    })
  })

  describe('Invite link section', () => {
    it('shows Private and Invite Link toggle buttons', () => {
      render(<AddMemberModal {...defaultProps} selectedClub={mockClub} />)
      expect(screen.getByRole('button', { name: 'Private' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Invite Link' })).toBeInTheDocument()
    })

    it('shows Private button as active when join_policy is PRIVATE', () => {
      render(<AddMemberModal {...defaultProps} selectedClub={mockClub} />)
      expect(screen.getByRole('button', { name: 'Private' })).toHaveClass('bg-primary')
    })

    it('shows Invite Link button as active when join_policy is INVITE_LINK', () => {
      render(<AddMemberModal {...defaultProps} selectedClub={clubWithInviteLink} />)
      expect(screen.getByRole('button', { name: 'Invite Link' })).toHaveClass('bg-primary')
    })

    it('does not show invite URL when policy is PRIVATE', () => {
      render(<AddMemberModal {...defaultProps} selectedClub={mockClub} />)
      expect(screen.queryByText(/abc123token/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
    })

    it('shows invite URL and Copy button when join_policy is INVITE_LINK', () => {
      render(<AddMemberModal {...defaultProps} selectedClub={clubWithInviteLink} />)
      expect(screen.getByText(/abc123token/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    })

    it('copies invite URL to clipboard on Copy click', async () => {
      const user = userEvent.setup()
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })
      render(<AddMemberModal {...defaultProps} selectedClub={clubWithInviteLink} />)

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('abc123token'))
    })

    it('shows "Copied!" feedback after clicking Copy', async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      })
      render(<AddMemberModal {...defaultProps} selectedClub={clubWithInviteLink} />)

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
    })
  })

  describe('Policy toggle', () => {
    const onClubUpdated = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
      mockInvoke.mockResolvedValue({ data: { members: [] }, error: null })
    })

    it('calls PUT /club when switching to Invite Link', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({
        data: { club: { ...mockClub, join_policy: 'INVITE_LINK', invite_token: 'newtoken' } },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} onClubUpdated={onClubUpdated} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ id: 'club-1', join_policy: 'INVITE_LINK' }),
          })
        )
      })
    })

    it('shows invite URL after enabling Invite Link', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({
        data: { club: { ...mockClub, join_policy: 'INVITE_LINK', invite_token: 'newtoken' } },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} onClubUpdated={onClubUpdated} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))

      await waitFor(() => {
        expect(screen.getByText(/newtoken/)).toBeInTheDocument()
      })
    })

    it('calls onClubUpdated after successful policy change', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({
        data: { club: { ...mockClub, join_policy: 'INVITE_LINK', invite_token: 'newtoken' } },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} onClubUpdated={onClubUpdated} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))

      await waitFor(() => expect(onClubUpdated).toHaveBeenCalledTimes(1))
    })

    it('calls PUT /club when switching back to Private', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({
        data: { club: { ...clubWithInviteLink, join_policy: 'PRIVATE', invite_token: null } },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} selectedClub={clubWithInviteLink} onClubUpdated={onClubUpdated} />)
      await user.click(screen.getByRole('button', { name: 'Private' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'club',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ join_policy: 'PRIVATE' }),
          })
        )
      })
    })

    it('does not call API when clicking already-active policy', async () => {
      const user = userEvent.setup()
      render(<AddMemberModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Private' }))
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('shows inline toggle error and reverts on API failure', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Server error') })

      render(<AddMemberModal {...defaultProps} onClubUpdated={onClubUpdated} />)
      await user.click(screen.getByRole('button', { name: 'Invite Link' }))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
      expect(onClubUpdated).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Private' })).toHaveClass('bg-primary')
    })
  })

  describe('Member search', () => {
    it('does not call API when input is empty', async () => {
      render(<AddMemberModal {...defaultProps} />)
      await waitFor(() => {}, { timeout: 500 })
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('calls member search endpoint with query and exclude_club_id after debounce', async () => {
      const user = userEvent.setup()
      render(<AddMemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Alice')

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          expect.stringContaining('search=Alice'),
          expect.objectContaining({ method: 'GET' })
        )
      }, { timeout: 1000 })

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.stringContaining('exclude_club_id=club-1'),
        expect.anything()
      )
    })

    it('shows "No Kluvs members found" when search returns empty', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: { members: [] }, error: null })

      render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'nobody')

      await waitFor(() => {
        expect(screen.getByText('No Kluvs members found')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('renders search results with name and handle', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({
        data: { members: [{ id: 99, name: 'Alice', handle: 'alice42', avatar_path: null }] },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Alice')

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('@alice42')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('renders result without @ handle when handle is null', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({
        data: { members: [{ id: 99, name: 'Bob', handle: null, avatar_path: null }] },
        error: null,
      })

      render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Bob')

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument()
      }, { timeout: 1000 })
      expect(screen.queryByText(/@/)).not.toBeInTheDocument()
    })

    it('shows inline error when search API fails', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Search failed') })

      render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Alice')

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Adding a member', () => {
    const searchResult = { id: 99, name: 'Alice', handle: 'alice42', avatar_path: null }

    const renderWithResult = async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValueOnce({ data: { members: [searchResult] }, error: null })
      render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Alice')
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument(), { timeout: 1000 })
      return user
    }

    it('calls PUT /member with add_to_club on result click', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })
      const user = await renderWithResult()

      mockInvoke.mockResolvedValueOnce({ data: {}, error: null })
      await user.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({
            method: 'PUT',
            body: { id: 99, add_to_club: 'club-1' },
          })
        )
      })
    })

    it('calls onMemberAdded and onClose on success', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })
      const user = await renderWithResult()

      mockInvoke.mockResolvedValueOnce({ data: {}, error: null })
      await user.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(defaultProps.onMemberAdded).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('shows "Already a member" inline error without escalating to onError', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })
      const user = await renderWithResult()

      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('already a member of this club') })
      await user.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText('Already a member')).toBeInTheDocument()
      })
      expect(defaultProps.onError).not.toHaveBeenCalled()
    })

    it('shows permission inline error on forbidden response without escalating to onError', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })
      const user = await renderWithResult()

      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('forbidden') })
      await user.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(screen.getByText("You don't have permission to add members")).toBeInTheDocument()
      })
      expect(defaultProps.onError).not.toHaveBeenCalled()
    })

    it('escalates generic API failure to onError', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })
      const user = await renderWithResult()

      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Internal server error') })
      await user.click(screen.getByText('Alice'))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Internal server error')
      })
    })

    it('disables result buttons while an add is in-flight', async () => {
      mockInvoke.mockResolvedValue({ data: {}, error: null })

      let resolveAdd!: (v: { data: object; error: null }) => void
      const pendingAdd = new Promise<{ data: object; error: null }>(
        (res) => (resolveAdd = res)
      )

      const user = await renderWithResult()

      mockInvoke.mockReturnValueOnce(pendingAdd)
      await user.click(screen.getByText('Alice'))

      const button = screen.getByText('Alice').closest('button')!
      expect(button).toBeDisabled()

      resolveAdd({ data: {}, error: null })
    })
  })

  describe('Reset on re-open', () => {
    it('clears query and results when modal is closed and reopened', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({
        data: { members: [{ id: 1, name: 'Alice', handle: null, avatar_path: null }] },
        error: null,
      })

      const { rerender } = render(<AddMemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('Search for a member by name or handle'), 'Alice')
      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument(), { timeout: 1000 })

      rerender(<AddMemberModal {...defaultProps} isOpen={false} />)
      rerender(<AddMemberModal {...defaultProps} isOpen={true} />)

      expect(screen.getByPlaceholderText('Search for a member by name or handle')).toHaveValue('')
      expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    })
  })

  describe('Close behavior', () => {
    it('calls onClose on Escape key', async () => {
      const user = userEvent.setup()
      render(<AddMemberModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })
})

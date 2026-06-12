import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditSessionModal from '../../../components/modals/EditSessionModal'
import { mockClub, mockClub2 } from '../../utils/mocks'

vi.mock('../../../components/BookSearchInput', () => ({
  default: ({ onSelect, disabled }: { onSelect: (id: number, book: object) => void; disabled?: boolean }) => (
    <div data-testid="book-search-input">
      <button
        disabled={disabled}
        onClick={() => onSelect(99, { id: 99, title: 'New Book', author: 'New Author' })}
        data-testid="mock-select-book"
      >
        Select Book
      </button>
    </div>
  ),
}))

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
  invokeFunction: (...args: unknown[]) => mockInvoke(...args),
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

describe('EditSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    onSessionUpdated: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: { session: { id: 'session-2' } }, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<EditSessionModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Edit Session' })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<EditSessionModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Edit Session')).not.toBeInTheDocument()
    })

    it('should not render when club has no active session', () => {
      render(<EditSessionModal {...defaultProps} selectedClub={mockClub2} />)
      expect(screen.queryByText('Edit Session')).not.toBeInTheDocument()
    })

    it('should prefill due date from the active session', () => {
      render(<EditSessionModal {...defaultProps} />)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      expect(dateInput.value).toBe('2024-12-31')
    })

    it('should list all club members with their reading status', () => {
      render(<EditSessionModal {...defaultProps} />)
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()

      const switches = screen.getAllByRole('switch')
      expect(switches[0]).toHaveAttribute('aria-checked', 'true')  // member 1 is_reading true
      expect(switches[1]).toHaveAttribute('aria-checked', 'false') // member 2 is_reading false
      expect(switches[2]).toHaveAttribute('aria-checked', 'false') // member 3 not in session
    })

    it('should show a "Change Book" link', () => {
      render(<EditSessionModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Change Book…' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<EditSessionModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-edit-session')
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Editing due date and members', () => {
    it('should send updated due date on save', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      const future = new Date()
      future.setDate(future.getDate() + 30)
      const futureString = future.toISOString().split('T')[0]
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.clear(dateInput)
      await user.type(dateInput, futureString)
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ id: 'session-1', due_date: futureString }),
          })
        )
      })
    })

    it('should send only changed reading members on save', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      const switches = screen.getAllByRole('switch')
      await user.click(switches[1]) // toggle member 2 from false -> true
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              id: 'session-1',
              session_members: [{ member_id: 2, is_reading: true }],
            }),
          })
        )
      })
    })

    it('should close without calling the API when nothing changed', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('should call onSessionUpdated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      const switches = screen.getAllByRole('switch')
      await user.click(switches[1])
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(defaultProps.onSessionUpdated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Update failed') })
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      const switches = screen.getAllByRole('switch')
      await user.click(switches[1])
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Update failed')
      })
    })
  })

  describe('Change Book flow', () => {
    it('should switch to the Change Book confirmation view', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Change Book…' }))

      expect(screen.getByRole('heading', { name: 'Change Book' })).toBeInTheDocument()
      expect(screen.getByText(/permanently removed/i)).toBeInTheDocument()
      expect(screen.getByTestId('book-search-input')).toBeInTheDocument()
    })

    it('should go back to the edit view', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Change Book…' }))
      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(screen.getByRole('heading', { name: 'Edit Session' })).toBeInTheDocument()
    })

    it('should disable the restart button until a book is selected', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Change Book…' }))

      expect(screen.getByRole('button', { name: /restart with new book/i })).toBeDisabled()
      await user.click(screen.getByTestId('mock-select-book'))
      expect(screen.getByRole('button', { name: /restart with new book/i })).not.toBeDisabled()
    })

    it('should delete the old session, create a new one, and carry over reading members', async () => {
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Change Book…' }))
      await user.click(screen.getByTestId('mock-select-book'))
      await user.click(screen.getByRole('button', { name: /restart with new book/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenNthCalledWith(1, 'session?id=session-1', { method: 'DELETE' })
        expect(mockInvoke).toHaveBeenNthCalledWith(2, 'session', expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ club_id: mockClub.id, book_id: 99, all_reading: false }),
        }))
        expect(mockInvoke).toHaveBeenNthCalledWith(3, 'session', expect.objectContaining({
          method: 'PUT',
          body: { id: 'session-2', session_members: [{ member_id: 1, is_reading: true }] },
        }))
      })

      await waitFor(() => {
        expect(defaultProps.onSessionUpdated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onError if deleting the old session fails', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Delete failed') })
      const user = userEvent.setup()
      render(<EditSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Change Book…' }))
      await user.click(screen.getByTestId('mock-select-book'))
      await user.click(screen.getByRole('button', { name: /restart with new book/i }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Delete failed')
      })
      expect(defaultProps.onSessionUpdated).not.toHaveBeenCalled()
    })
  })
})

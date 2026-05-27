import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditBookModal from '../../../components/modals/EditBookModal'
import { mockClub, mockClub2 } from '../../utils/mocks'

vi.mock('../../../components/BookSearchInput', () => ({
  default: ({ onSelect, initialBook, disabled }: {
    onSelect: (id: number, book: object) => void
    initialBook?: { id?: number; title: string }
    disabled?: boolean
  }) => (
    <div data-testid="book-search-input">
      {initialBook && <span data-testid="initial-book">{initialBook.title}</span>}
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
}))

describe('EditBookModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    onBookUpdated: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen with active session', () => {
      render(<EditBookModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Edit Book' })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<EditBookModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Edit Book')).not.toBeInTheDocument()
    })

    it('should not render when no active session', () => {
      render(<EditBookModal {...defaultProps} selectedClub={mockClub2} />)
      expect(screen.queryByText('Edit Book')).not.toBeInTheDocument()
    })

    it('should show BookSearchInput with current book as initialBook', () => {
      render(<EditBookModal {...defaultProps} />)
      expect(screen.getByTestId('book-search-input')).toBeInTheDocument()
      expect(screen.getByTestId('initial-book')).toHaveTextContent('The Great Gatsby')
    })

    it('should pre-populate due date from active session', () => {
      render(<EditBookModal {...defaultProps} />)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      expect(dateInput.value).toBe('2024-12-31')
    })

    it('should show club context info', () => {
      render(<EditBookModal {...defaultProps} />)
      expect(screen.getByText(mockClub.name)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<EditBookModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-edit-book')
    })

    it('should have Close aria-label on X button', () => {
      render(<EditBookModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Validation', () => {
    it('should enable submit when book is pre-populated from active session', () => {
      render(<EditBookModal {...defaultProps} />)
      // mockBook.id = 1, so selectedBookId is pre-populated
      expect(screen.getByRole('button', { name: /update book/i })).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should send book_id from pre-populated session on submit', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              id: mockClub.active_session!.id,
              book_id: mockClub.active_session!.book.id,
            }),
          })
        )
      })
    })

    it('should not send inline book object', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        const body = (mockInvoke.mock.calls[0][1] as { body: Record<string, unknown> }).body
        expect(body).not.toHaveProperty('book')
      })
    })

    it('should send new book_id when user selects a different book', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByTestId('mock-select-book'))
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            body: expect.objectContaining({ book_id: 99 }),
          })
        )
      })
    })

    it('should call onBookUpdated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(defaultProps.onBookUpdated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Update failed') })
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Update failed')
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error')
      })
    })
  })

  describe('Close Behavior', () => {
    it('should call onClose and clear errors when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Due Date', () => {
    it('should send updated due_date when user changes the date field', async () => {
      const { fireEvent } = await import('@testing-library/react')
      render(<EditBookModal {...defaultProps} />)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      fireEvent.change(dateInput, { target: { value: '2025-06-30' } })

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /update book/i }))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            body: expect.objectContaining({ due_date: '2025-06-30' }),
          })
        )
      })
    })
  })
})

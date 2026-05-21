import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewSessionModal from '../../../components/modals/NewSessionModal'
import { mockClub } from '../../utils/mocks'

vi.mock('../../../components/BookSearchInput', () => ({
  default: ({ onSelect, disabled }: { onSelect: (id: number, book: object) => void; disabled?: boolean }) => (
    <div data-testid="book-search-input">
      <button
        disabled={disabled}
        onClick={() => onSelect(42, { id: 42, title: 'Test Book', author: 'Test Author' })}
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

describe('NewSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    onSessionCreated: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Start New Session' })).toBeInTheDocument()
      expect(screen.getByText('Begin reading a new book')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<NewSessionModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Start New Session')).not.toBeInTheDocument()
    })

    it('should show book search input and due date field', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByTestId('book-search-input')).toBeInTheDocument()
      expect(document.querySelector('input[type="date"]')).toBeInTheDocument()
    })

    it('should show club context info', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByText(mockClub.name)).toBeInTheDocument()
    })

    it('should show date input with tomorrow as minimum date', () => {
      render(<NewSessionModal {...defaultProps} />)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(dateInput.min).toBe(tomorrow.toISOString().split('T')[0])
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<NewSessionModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-new-session')
    })

    it('should have Close button with aria-label', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      expect(defaultProps.onError).toHaveBeenCalledWith('')
    })
  })

  describe('Form Validation', () => {
    it('should have submit button disabled when no book or date selected', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should have submit button disabled when book selected but no date', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByTestId('mock-select-book'))
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should have submit button disabled when date set but no book selected', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should enable submit button when book and date are both set', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByTestId('mock-select-book'))
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      expect(screen.getByRole('button', { name: /start session/i })).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByTestId('mock-select-book'))
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      await user.click(screen.getByRole('button', { name: /start session/i }))
    }

    it('should send book_id (not inline book) on submit', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({ club_id: mockClub.id, book_id: 42 }),
          })
        )
      })
    })

    it('should not send inline book object', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        const body = (mockInvoke.mock.calls[0][1] as { body: Record<string, unknown> }).body
        expect(body).not.toHaveProperty('book')
      })
    })

    it('should call onSessionCreated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        expect(defaultProps.onSessionCreated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByTestId('mock-select-book'))
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      await user.click(screen.getByRole('button', { name: /start session/i }))
    }

    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Session creation failed') })
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Session creation failed')
      })
    })

    it('should handle network error gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error')
      })
    })

    it('should handle error with no message property', async () => {
      mockInvoke.mockRejectedValue(42)
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await fillAndSubmit(user)
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to create session')
      })
    })
  })

  describe('Close Behavior', () => {
    it('should clear errors and call onClose on Cancel', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('should show Creating... during submission', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByTestId('mock-select-book'))
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      await user.click(screen.getByRole('button', { name: /start session/i }))
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument()
      })
    })

    it('should disable X and Cancel buttons when loading', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)
      await user.click(screen.getByTestId('mock-select-book'))
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])
      await user.click(screen.getByRole('button', { name: /start session/i }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      })
    })
  })

  describe('Modal Structure', () => {
    it('should display correct modal title with correct id', () => {
      render(<NewSessionModal {...defaultProps} />)
      const title = screen.getByText('Start New Session')
      expect(title).toHaveAttribute('id', 'modal-title-new-session')
    })

    it('should display helper text', () => {
      render(<NewSessionModal {...defaultProps} />)
      expect(screen.getByText('When should members finish reading this book?')).toBeInTheDocument()
      expect(screen.getByText('Creating new reading session')).toBeInTheDocument()
    })
  })
})

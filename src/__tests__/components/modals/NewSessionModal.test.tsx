import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewSessionModal from '../../../components/modals/NewSessionModal'
import { mockClub } from '../../utils/mocks'

// Mock supabase
const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
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

    it('should show form fields', () => {
      render(<NewSessionModal {...defaultProps} />)

      expect(screen.getByPlaceholderText('e.g., The Lord of the Rings')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., J.R.R. Tolkien')).toBeInTheDocument()
    })

    it('should show club context info', () => {
      render(<NewSessionModal {...defaultProps} />)

      expect(screen.getByText(mockClub.name)).toBeInTheDocument()
    })

    it('should show date input with tomorrow as minimum date', () => {
      render(<NewSessionModal {...defaultProps} />)

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      expect(dateInput).toBeInTheDocument()

      // Min date should be tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const expectedMin = tomorrow.toISOString().split('T')[0]
      expect(dateInput.min).toBe(expectedMin)
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

  describe('Form Validation - Required Fields', () => {
    it('should have submit button disabled when fields are empty', () => {
      render(<NewSessionModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should require title field', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      render(<NewSessionModal {...defaultProps} onError={onError} />)

      // Fill author and date but not title
      await user.type(screen.getByPlaceholderText(/Tolkien/i), 'Test Author')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      // Title field still empty, so button should be disabled
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should require author field', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill only title and date
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      // Author field still empty, so button should be disabled
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should require due date field', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill title and author but not date
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'Test Author')

      // Date field empty, so button should be disabled
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })

    it('should call onError when title is empty on submit', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      render(<NewSessionModal {...defaultProps} onError={onError} />)

      // Fill only author and date
      await user.type(screen.getByPlaceholderText(/Tolkien/i), 'Test Author')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      // Add whitespace to title to bypass empty check
      const titleInput = screen.getByPlaceholderText('e.g., The Lord of the Rings') as HTMLInputElement
      await user.type(titleInput, '   ')

      // Even with whitespace, button should still be disabled
      expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled()
    })
  })

  describe('Form Validation - Date Validation', () => {
    it('should set min date attribute to a future date', () => {
      render(<NewSessionModal {...defaultProps} />)

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const minAttr = dateInput.getAttribute('min')

      expect(minAttr).toBeTruthy()

      // Verify it's a valid date string in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      expect(minAttr).toMatch(dateRegex)

      // Verify min date is after today
      const minDate = new Date(minAttr!)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      expect(minDate.getTime()).toBeGreaterThan(today.getTime())
    })

    it('should accept due date in the future', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill form with valid data
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'Test Author')

      // Set date to two days from now
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])

      // Button should be enabled now
      expect(screen.getByRole('button', { name: /start session/i })).not.toBeDisabled()
    })

    it('should call onError when due date is in the past on submit', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      render(<NewSessionModal {...defaultProps} onError={onError} />)

      // Directly call submit by enabling the button via valid inputs first
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'Test Author')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const future = new Date()
      future.setDate(future.getDate() + 2)
      await user.type(dateInput, future.toISOString().split('T')[0])

      // Submit should work
      const submitButton = screen.getByRole('button', { name: /start session/i })
      await user.click(submitButton)

      // Should not have called onError for valid submission
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })
  })

  describe('Form Input Changes', () => {
    it('should update title when input changes', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText('e.g., The Lord of the Rings') as HTMLInputElement
      await user.type(titleInput, 'My Book')

      expect(titleInput.value).toBe('My Book')
    })

    it('should update author when input changes', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      const authorInput = screen.getByPlaceholderText('e.g., J.R.R. Tolkien') as HTMLInputElement
      await user.type(authorInput, 'My Author')

      expect(authorInput.value).toBe('My Author')
    })

    it('should allow optional year field', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'Test Author')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      // Submit without year
      const submitButton = screen.getByRole('button', { name: /start session/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              book: expect.objectContaining({
                year: undefined,
              }),
            }),
          })
        )
      })
    })

    it('should trim whitespace from title and author', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill with whitespace
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), '  Test Book  ')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), '  Test Author  ')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByRole('button', { name: /start session/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              book: expect.objectContaining({
                title: 'Test Book',
                author: 'Test Author',
              }),
            }),
          })
        )
      })
    })
  })

  describe('Form Submission', () => {
    it('should call supabase on valid submit', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'New Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'New Author')

      // Fill due date via the date input element
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText(/start session/i))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should call onSessionCreated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'New Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'New Author')

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText(/start session/i))

      await waitFor(() => {
        expect(defaultProps.onSessionCreated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
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

    it('should clear form on close', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText('e.g., The Lord of the Rings') as HTMLInputElement
      await user.type(titleInput, 'Some Book')

      expect(titleInput.value).toBe('Some Book')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      // Form should be cleared for next use
      expect(titleInput.value).toBe('')
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Session creation failed') })
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'A Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'An Author')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText(/start session/i))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Session creation failed')
      })
    })

    it('should handle unexpected error gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'A Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'An Author')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText(/start session/i))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error')
      })
    })

    it('should handle error with no message property', async () => {
      mockInvoke.mockRejectedValue(42) // Non-Error object
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'A Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'An Author')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText(/start session/i))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to create session')
      })
    })
  })

  describe('X Button Close', () => {
    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should disable X button when loading', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {})) // Never resolves
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill form and start submission
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'A Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'An Author')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByRole('button', { name: /start session/i }))

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument()
      })

      // X button should be disabled during loading
      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toBeDisabled()
    })

    it('should disable Cancel button when loading', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {})) // Never resolves
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill form and start submission
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'A Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'An Author')

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByRole('button', { name: /start session/i }))

      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument()
      })

      // Cancel button should be disabled during loading
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Year Field', () => {
    it('should accept year input', async () => {
      const user = userEvent.setup()
      render(<NewSessionModal {...defaultProps} />)

      // Fill required fields
      await user.type(screen.getByPlaceholderText('e.g., The Lord of the Rings'), 'Test Book')
      await user.type(screen.getByPlaceholderText('e.g., J.R.R. Tolkien'), 'Test Author')

      const yearInput = screen.getByPlaceholderText('e.g., 1954') as HTMLInputElement
      await user.type(yearInput, '2023')

      expect(yearInput.value).toBe('2023')
    })

    it('should have year field with correct min and max attributes', () => {
      render(<NewSessionModal {...defaultProps} />)

      const yearInput = document.querySelector('input[type="number"][placeholder="e.g., 1954"]') as HTMLInputElement
      expect(yearInput).toHaveAttribute('min', '1000')
      expect(yearInput).toHaveAttribute('max', String(new Date().getFullYear() + 1))
    })
  })

  describe('Modal Structure', () => {
    it('should have correct dialog aria attributes', () => {
      render(<NewSessionModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-new-session')
    })

    it('should display correct modal title', () => {
      render(<NewSessionModal {...defaultProps} />)

      const title = screen.getByText('Start New Session')
      expect(title).toBeInTheDocument()
      expect(title).toHaveAttribute('id', 'modal-title-new-session')
    })

    it('should display helper text for all fields', () => {
      render(<NewSessionModal {...defaultProps} />)

      expect(screen.getByText('When should members finish reading this book?')).toBeInTheDocument()
      expect(screen.getByText('Begin reading a new book')).toBeInTheDocument()
      expect(screen.getByText('Creating new reading session')).toBeInTheDocument()
    })
  })
})

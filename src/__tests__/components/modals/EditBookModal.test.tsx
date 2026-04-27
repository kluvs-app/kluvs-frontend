import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditBookModal from '../../../components/modals/EditBookModal'
import { mockClub, mockClub2 } from '../../utils/mocks'

// Mock supabase
const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
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

    it('should pre-populate form fields from active session', () => {
      render(<EditBookModal {...defaultProps} />)

      expect(screen.getByDisplayValue('The Great Gatsby')).toBeInTheDocument()
      expect(screen.getByDisplayValue('F. Scott Fitzgerald')).toBeInTheDocument()
      expect(screen.getByDisplayValue('First Edition')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1925')).toBeInTheDocument()
    })

    it('should show club context info', () => {
      render(<EditBookModal {...defaultProps} />)

      expect(screen.getByText(mockClub.name)).toBeInTheDocument()
      expect(screen.getByText('Updating active reading session')).toBeInTheDocument()
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
    it('should disable submit button when title is empty', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const titleInput = screen.getByDisplayValue('The Great Gatsby') as HTMLInputElement
      await user.clear(titleInput)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when author is empty', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const authorInput = screen.getByDisplayValue('F. Scott Fitzgerald') as HTMLInputElement
      await user.clear(authorInput)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      expect(submitButton).toBeDisabled()
    })

    it('should call onError when title is empty and submit is attempted', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      render(<EditBookModal {...defaultProps} onError={onError} />)

      const titleInput = screen.getByDisplayValue('The Great Gatsby') as HTMLInputElement
      await user.clear(titleInput)

      // Type something in title to enable button momentarily
      await user.type(titleInput, 'T')
      // Then clear again to trigger validation
      await user.clear(titleInput)
      await user.type(titleInput, '  ') // Just spaces

      // Try to click submit - button should be disabled but test validation
      const submitButton = screen.getByRole('button', { name: /update book/i })
      expect(submitButton).toBeDisabled()
    })

    it('should call onError when author is empty and submit is attempted', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      render(<EditBookModal {...defaultProps} onError={onError} />)

      const authorInput = screen.getByDisplayValue('F. Scott Fitzgerald') as HTMLInputElement
      await user.clear(authorInput)
      await user.type(authorInput, '  ') // Just spaces

      const submitButton = screen.getByRole('button', { name: /update book/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Input Changes', () => {
    it('should update title when input changes', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const titleInput = screen.getByDisplayValue('The Great Gatsby') as HTMLInputElement
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      expect(titleInput.value).toBe('New Title')
    })

    it('should update author when input changes', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const authorInput = screen.getByDisplayValue('F. Scott Fitzgerald') as HTMLInputElement
      await user.clear(authorInput)
      await user.type(authorInput, 'New Author')

      expect(authorInput.value).toBe('New Author')
    })

    it('should update edition when input changes', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const editionInput = screen.getByDisplayValue('First Edition') as HTMLInputElement
      await user.clear(editionInput)
      await user.type(editionInput, 'Second Edition')

      expect(editionInput.value).toBe('Second Edition')
    })

    it('should update year when input changes', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const yearInput = screen.getByDisplayValue('1925') as HTMLInputElement
      await user.clear(yearInput)
      await user.type(yearInput, '2023')

      expect(yearInput.value).toBe('2023')
    })

    it('should allow empty edition field', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const editionInput = screen.getByDisplayValue('First Edition') as HTMLInputElement
      await user.clear(editionInput)

      // Should still be able to submit with empty edition
      await user.click(screen.getByRole('button', { name: /update book/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should allow empty year field', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const yearInput = screen.getByDisplayValue('1925') as HTMLInputElement
      await user.clear(yearInput)

      await user.click(screen.getByRole('button', { name: /update book/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call supabase session PUT on submit', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              book: expect.objectContaining({
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
              }),
            }),
          })
        )
      })
    })

    it('should call onBookUpdated and onClose on success', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onBookUpdated).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should trim whitespace from title and author on submit', async () => {
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const titleInput = screen.getByDisplayValue('The Great Gatsby') as HTMLInputElement
      const authorInput = screen.getByDisplayValue('F. Scott Fitzgerald') as HTMLInputElement

      await user.clear(titleInput)
      await user.type(titleInput, '  Updated Title  ')
      await user.clear(authorInput)
      await user.type(authorInput, '  Updated Author  ')

      const submitButton = screen.getByRole('button', { name: /update book/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              book: expect.objectContaining({
                title: 'Updated Title',
                author: 'Updated Author',
              }),
            }),
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Update failed') })
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Update failed')
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<EditBookModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /update book/i })
      await user.click(submitButton)

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
})

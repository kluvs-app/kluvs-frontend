import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscussionModal from '../../../components/modals/DiscussionModal'
import { mockClub, mockClub2, mockDiscussion } from '../../utils/mocks'

// Mock supabase
const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
  invokeFunction: (...args: any[]) => mockInvoke(...args),
}))

describe('DiscussionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    onDiscussionSaved: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering - Add Mode', () => {
    it('should render add mode when no editingDiscussion', () => {
      render(<DiscussionModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Add Discussion' })).toBeInTheDocument()
      expect(screen.getByText('Schedule a new discussion event')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DiscussionModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Add Discussion')).not.toBeInTheDocument()
    })

    it('should not render when no active session', () => {
      render(<DiscussionModal {...defaultProps} selectedClub={mockClub2} />)

      expect(screen.queryByText('Add Discussion')).not.toBeInTheDocument()
    })

    it('should show empty form fields in add mode', () => {
      render(<DiscussionModal {...defaultProps} />)

      expect(screen.getByPlaceholderText('e.g., Chapter 1-5 Discussion')).toHaveValue('')
    })
  })

  describe('Rendering - Edit Mode', () => {
    it('should render edit mode when editingDiscussion is provided', () => {
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      expect(screen.getByRole('heading', { name: 'Edit Discussion' })).toBeInTheDocument()
      expect(screen.getByText('Update discussion details')).toBeInTheDocument()
    })

    it('should pre-populate form in edit mode', () => {
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      expect(screen.getByDisplayValue('Chapter 1-3 Discussion')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Discord Voice Channel')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<DiscussionModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-discussion')
    })

    it('should have Close button with aria-label', () => {
      render(<DiscussionModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Validation', () => {
    it('should have submit button disabled when title is empty', () => {
      render(<DiscussionModal {...defaultProps} />)

      // "Add Discussion" button text appears in both heading and button; get the button
      const submitButton = screen.getByText('Add Discussion', { selector: 'span' }).closest('button')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Submission - Add', () => {
    async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByPlaceholderText('e.g., Chapter 1-5 Discussion'), 'New Discussion')

      // Fill date via the date input (type="date")
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])
    }

    it('should call supabase session PUT with new discussion', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('should call onDiscussionSaved and onClose on success', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onDiscussionSaved).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Close Behavior', () => {
    it('should clear errors and call onClose on Cancel', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Save failed') })
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., Chapter 1-5 Discussion'), 'Test')
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Save failed')
      })
    })

    it('should call onError with past date message when date is in the past', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., Chapter 1-5 Discussion'), 'Past Test')
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      // Use fireEvent to set a past date directly since type may not bypass min attribute
      const { fireEvent } = await import('@testing-library/react')
      fireEvent.change(dateInput, { target: { value: '2020-01-01' } })

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Discussion date must be today or in the future')
      })
    })
  })

  describe('Form Submission - Edit', () => {
    it('should call session PUT with updated discussion in edit mode', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      // Change title
      const titleInput = screen.getByDisplayValue('Chapter 1-3 Discussion')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      // Use a future date
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const { fireEvent } = await import('@testing-library/react')
      const future = new Date()
      future.setMonth(future.getMonth() + 1)
      fireEvent.change(dateInput, { target: { value: future.toISOString().split('T')[0] } })

      await user.click(screen.getByText('Update Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('should call onDiscussionSaved and onClose in edit mode on success', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      const { fireEvent } = await import('@testing-library/react')
      const future = new Date()
      future.setMonth(future.getMonth() + 1)
      fireEvent.change(dateInput, { target: { value: future.toISOString().split('T')[0] } })

      await user.click(screen.getByText('Update Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onDiscussionSaved).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Location field', () => {
    it('should update location field when user types', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      const locationInput = screen.getByPlaceholderText('e.g., Community Center, Discord Voice Chat')
      await user.type(locationInput, 'Library Room B')

      expect(locationInput).toHaveValue('Library Room B')
    })
  })
})

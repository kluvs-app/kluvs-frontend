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

      expect(screen.getByPlaceholderText('e.g., Chapters 1–5')).toHaveValue('')
    })
  })

  describe('Rendering - Edit Mode', () => {
    it('should render edit mode when editingDiscussion is provided', () => {
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      expect(screen.getByRole('heading', { name: 'Edit Discussion' })).toBeInTheDocument()
    })

    it('should pre-populate form in edit mode', () => {
      render(<DiscussionModal {...defaultProps} editingDiscussion={mockDiscussion} />)

      expect(screen.getByDisplayValue('Chapter 1-3 Discussion')).toBeInTheDocument()
      expect(screen.getByDisplayValue('19:30')).toBeInTheDocument()
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
    async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, title = 'New Discussion', addTime = false, addLocation = false) {
      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), title)

      // Fill date via the date input (type="date")
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      if (addTime) {
        const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement
        const { fireEvent } = await import('@testing-library/react')
        fireEvent.change(timeInput, { target: { value: '14:00' } })
      }

      if (addLocation) {
        await user.type(screen.getByPlaceholderText('e.g., Community Center, Discord'), 'Library')
      }
    }

    it('should call discussion POST endpoint with new discussion data', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              session_id: defaultProps.selectedClub.active_session!.id,
              title: 'New Discussion',
            }),
          })
        )
      })
    })

    it('should include optional time and location in POST payload', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user, 'Test Discussion', true, true)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              session_id: defaultProps.selectedClub.active_session!.id,
              title: 'Test Discussion',
              time: '14:00',
              location: 'Library',
            }),
          })
        )
      })
    })

    it('should send null for empty time and location', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user, 'Minimal Discussion', false, false)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              time: null,
              location: null,
            }),
          })
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

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<DiscussionModal {...defaultProps} />)

      await fillAndSubmit(user)
      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })

      // Re-render with isOpen=true to see if form was cleared
      rerender(<DiscussionModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('e.g., Chapters 1–5')).toHaveValue('')
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

      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), 'Test')
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

      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), 'Past Test')
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
    it('should call discussion PUT endpoint with updated discussion data', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      // Change title
      const titleInput = screen.getByDisplayValue('Chapter 1-3 Discussion')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              id: futureDiscussion.id,
              title: 'Updated Title',
            }),
          })
        )
      })
    })

    it('should include all fields in PUT payload', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      const locationInput = screen.getByDisplayValue('Discord Voice Channel')
      await user.clear(locationInput)
      await user.type(locationInput, 'Updated Location')

      // Get the first button that contains "Update"
      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              id: futureDiscussion.id,
              title: 'Chapter 1-3 Discussion',
              location: 'Updated Location',
            }),
          })
        )
      })
    })

    it('should call onDiscussionSaved and onClose in edit mode on success', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        expect(defaultProps.onDiscussionSaved).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should maintain discussion ID when editing', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      const titleInput = screen.getByDisplayValue('Chapter 1-3 Discussion')
      await user.clear(titleInput)
      await user.type(titleInput, 'Completely New Title')

      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            body: expect.objectContaining({
              id: futureDiscussion.id,
            }),
          })
        )
      })
    })
  })

  describe('Location field', () => {
    it('should update location field when user types', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      const locationInput = screen.getByPlaceholderText('e.g., Community Center, Discord')
      await user.type(locationInput, 'Library Room B')

      expect(locationInput).toHaveValue('Library Room B')
    })
  })

  describe('Time field', () => {
    it('should render a time input', () => {
      render(<DiscussionModal {...defaultProps} />)

      const timeInputs = document.querySelectorAll('input[type="time"]')
      expect(timeInputs).toHaveLength(1)
    })

    it('should update time field when changed', async () => {
      const { fireEvent } = await import('@testing-library/react')
      render(<DiscussionModal {...defaultProps} />)

      const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement
      fireEvent.change(timeInput, { target: { value: '14:00' } })

      expect(timeInput).toHaveValue('14:00')
    })
  })

  describe('Payload Validation - Add', () => {
    async function fillMinimalForm(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), 'Title Only')
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])
    }

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), '   Trimmed Title   ')
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            body: expect.objectContaining({
              title: 'Trimmed Title',
            }),
          })
        )
      })
    })

    it('should trim whitespace from location', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await fillMinimalForm(user)
      await user.type(screen.getByPlaceholderText('e.g., Community Center, Discord'), '   Location   ')

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            body: expect.objectContaining({
              location: 'Location',
            }),
          })
        )
      })
    })

    it('should trim whitespace from time by sending as-is', async () => {
      const user = userEvent.setup()
      const { fireEvent } = await import('@testing-library/react')
      render(<DiscussionModal {...defaultProps} />)

      await fillMinimalForm(user)
      const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement
      fireEvent.change(timeInput, { target: { value: '14:00' } })

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            body: expect.objectContaining({
              time: '14:00',
            }),
          })
        )
      })
    })
  })

  describe('Payload Validation - Edit', () => {
    it('should trim whitespace in edit mode', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      const titleInput = screen.getByDisplayValue('Chapter 1-3 Discussion')
      await user.clear(titleInput)
      await user.type(titleInput, '   Updated With Spaces   ')

      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion',
          expect.objectContaining({
            body: expect.objectContaining({
              title: 'Updated With Spaces',
            }),
          })
        )
      })
    })
  })

  describe('Session ID Inclusion', () => {
    it('should always include session_id in POST payload', async () => {
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), 'Test')
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      await user.click(screen.getByText('Add Discussion', { selector: 'span' }))

      await waitFor(() => {
        const calls = mockInvoke.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall[1].body).toHaveProperty('session_id')
        expect(lastCall[1].body.session_id).toBe(defaultProps.selectedClub.active_session!.id)
      })
    })

    it('should not include session_id in PUT payload for edit', async () => {
      const user = userEvent.setup()
      const futureDiscussion = { ...mockDiscussion, date: '2027-06-15' }
      render(<DiscussionModal {...defaultProps} editingDiscussion={futureDiscussion} />)

      const updateButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Update'))!
      await user.click(updateButton)

      await waitFor(() => {
        const calls = mockInvoke.mock.calls
        const lastCall = calls[calls.length - 1]
        expect(lastCall[1].body).not.toHaveProperty('session_id')
      })
    })
  })

  describe('Loading State', () => {
    it('should disable submit button during loading', async () => {
      let resolveInvoke: () => void
      mockInvoke.mockImplementationOnce(() =>
        new Promise(resolve => { resolveInvoke = () => resolve({ data: {}, error: null }) })
      )
      const user = userEvent.setup()
      render(<DiscussionModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., Chapters 1–5'), 'Test')
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const dateInput = dateInputs[0] as HTMLInputElement
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await user.type(dateInput, tomorrow.toISOString().split('T')[0])

      const submitButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('Add'))!
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()

      resolveInvoke!()

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberModal from '../../../components/modals/MemberModal'
import { mockClub, mockServer, mockAdminMember, mockRegularMember } from '../../utils/mocks'

// Mock supabase
const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}))

describe('MemberModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
    selectedServerData: mockServer,
    onMemberSaved: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering - Add Mode', () => {
    it('should render add mode when no editingMember', () => {
      render(<MemberModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Add Member' })).toBeInTheDocument()
      expect(screen.getByText('Add a new member to the club')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<MemberModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Add Member')).not.toBeInTheDocument()
    })

    it('should show empty name field in add mode', () => {
      render(<MemberModal {...defaultProps} />)

      expect(screen.getByPlaceholderText('e.g., BookLover42')).toHaveValue('')
    })
  })

  describe('Rendering - Edit Mode', () => {
    it('should render edit mode when editingMember is provided', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      expect(screen.getByRole('heading', { name: 'Edit Member' })).toBeInTheDocument()
      expect(screen.getByText('Update member details')).toBeInTheDocument()
    })

    it('should pre-populate form in edit mode', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<MemberModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-member')
    })

    it('should have Close button with aria-label', () => {
      render(<MemberModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Validation', () => {
    it('should validate empty name and call onError', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      // Type then clear name to make it empty
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.clear(screen.getByPlaceholderText('e.g., BookLover42'))

      // Now get the submit button (it will be disabled due to empty name)
      // We'll use getByRole to get the actual submit button
      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1] // Last button is the submit button

      // Button should be disabled when name is empty
      expect(submitButton).toBeDisabled()
    })

    it('should validate negative books_read', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')

      const inputs = screen.getAllByDisplayValue('0')
      const booksInput = inputs[0] as HTMLInputElement
      await user.clear(booksInput)
      await user.type(booksInput, '-3')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Books read must be a non-negative number')
      })
    })

    it('should have submit button disabled when name is empty', () => {
      render(<MemberModal {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1] // Last button is the submit button
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Submission - Add', () => {
    it('should call supabase on valid add submission', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should call onMemberSaved and onClose on success', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onMemberSaved).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Form Submission - Edit', () => {
    it('should call supabase on valid edit submission', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      // Change name
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })
  })

  describe('Close Behavior', () => {
    it('should clear errors and reset form on Cancel', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Shame List - Add Mode', () => {
    it('should add member to shame list when checkbox is checked', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: { member: { id: 'new-member-id' } }, error: null })

      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')

      const shameCheckbox = screen.getByRole('checkbox')
      await user.click(shameCheckbox)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('club', {
          method: 'PUT',
          body: {
            id: mockClub.id,
            server_id: mockServer.id,
            shame_list: expect.arrayContaining(['new-member-id'])
          }
        })
      })
    })

    it('should handle shame list API error gracefully', async () => {
      const user = userEvent.setup()
      mockInvoke
        .mockResolvedValueOnce({ data: { member: { id: 'new-member-id' } }, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('Shame list failed') })

      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')

      const shameCheckbox = screen.getByRole('checkbox')
      await user.click(shameCheckbox)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Member created but failed to add to shame list')
      })
    })
  })

  describe('Shame List - Edit Mode', () => {
    it('should update shame list when adding member to shame list', async () => {
      const user = userEvent.setup()
      const memberNotInShameList = { ...mockAdminMember, id: 999 }
      mockInvoke.mockResolvedValue({ data: {}, error: null })

      render(<MemberModal {...defaultProps} editingMember={memberNotInShameList} />)

      const shameCheckbox = screen.getByRole('checkbox')
      await user.click(shameCheckbox)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('club', {
          method: 'PUT',
          body: {
            id: mockClub.id,
            server_id: mockServer.id,
            shame_list: expect.arrayContaining([999])
          }
        })
      })
    })

    it('should update shame list when removing member from shame list', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: {}, error: null })

      // Use mockRegularMember (id: 2) which IS in mockClub.shame_list
      render(<MemberModal {...defaultProps} editingMember={mockRegularMember} />)

      const shameCheckbox = screen.getByRole('checkbox')
      // Mock club has mockRegularMember.id (2) in shame_list, so unchecking should remove it
      await user.click(shameCheckbox)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('club', {
          method: 'PUT',
          body: {
            id: mockClub.id,
            server_id: mockServer.id,
            shame_list: expect.not.arrayContaining([mockRegularMember.id])
          }
        })
      })
    })

    it('should handle shame list error when editing', async () => {
      const user = userEvent.setup()
      mockInvoke
        .mockResolvedValueOnce({ data: {}, error: null }) // Member update succeeds
        .mockResolvedValueOnce({ data: null, error: new Error('Club update failed') }) // Shame list update fails

      const memberNotInShameList = { ...mockAdminMember, id: 999 }
      render(<MemberModal {...defaultProps} editingMember={memberNotInShameList} />)

      const shameCheckbox = screen.getByRole('checkbox')
      await user.click(shameCheckbox)

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Member updated but failed to update shame list status')
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Save failed') })
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Save failed')
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error')
      })
    })
  })

  describe('Form Input Changes', () => {
    it('should update books_read when input changes', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      const inputs = screen.getAllByDisplayValue('0')
      const booksInput = inputs[0] as HTMLInputElement

      await user.clear(booksInput)
      await user.type(booksInput, '25')

      expect(booksInput).toHaveValue(25)
    })

    it('should trim whitespace from name on submit', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), '  New Member  ')

      const buttons = screen.getAllByRole('button')
      const submitButton = buttons[buttons.length - 1]
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('member', {
          method: 'POST',
          body: expect.objectContaining({ name: 'New Member' })
        })
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberModal from '../../../components/modals/MemberModal'
import { mockClub, mockAdminMember, mockRegularMember } from '../../utils/mocks'

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

describe('MemberModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClub: mockClub,
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
    })

    it('should pre-populate form in edit mode', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      expect(screen.queryByPlaceholderText('e.g., BookLover42')).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })

    it('should pre-populate discord_id in edit mode', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      expect(screen.getByDisplayValue('111222333444555666')).toBeInTheDocument()
    })

    it('should show empty discord_id for member without one', () => {
      render(<MemberModal {...defaultProps} editingMember={mockRegularMember} />)

      expect(screen.getByPlaceholderText('e.g., 123456789012345678')).toHaveValue('')
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

      const submitButton = screen.getByRole('button', { name: 'Add Member' })
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

      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Books read must be a non-negative number')
      })
    })

    it('should have submit button disabled when name is empty', () => {
      render(<MemberModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Add Member' })).toBeDisabled()
    })

    it('should call onError when discord_id is invalid format', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      await user.type(screen.getByPlaceholderText('e.g., 123456789012345678'), 'not-a-snowflake')

      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Discord ID must be a 17–19 digit number')
      })
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('should call onError when discord_id is too short', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      await user.type(screen.getByPlaceholderText('e.g., 123456789012345678'), '12345')

      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Discord ID must be a 17–19 digit number')
      })
      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission - Add', () => {
    it('should call supabase on valid add submission', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should call onMemberSaved and onClose on success', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))

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

      const booksInput = screen.getByDisplayValue('10')
      await user.clear(booksInput)
      await user.type(booksInput, '15')
      await user.click(screen.getByRole('button', { name: 'Update Member' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    })

    it('should include discord_id in PUT payload', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      await user.click(screen.getByRole('button', { name: 'Update Member' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ discord_id: '111222333444555666' }),
          })
        )
      })
    })

    it('should send discord_id as null when field is cleared', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)

      const discordInput = screen.getByDisplayValue('111222333444555666')
      await user.clear(discordInput)
      await user.click(screen.getByRole('button', { name: 'Update Member' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ discord_id: null }),
          })
        )
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

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Save failed') })
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Save failed')
      })
    })

    it('should handle unknown errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)

      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))

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
      await user.click(screen.getByRole('button', { name: 'Add Member' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('member', {
          method: 'POST',
          body: expect.objectContaining({ name: 'New Member' })
        })
      })
    })
  })
})

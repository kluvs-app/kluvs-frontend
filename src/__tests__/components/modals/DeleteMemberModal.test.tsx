import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteMemberModal from '../../../components/modals/DeleteMemberModal'
import { mockAdminMember } from '../../utils/mocks'

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

const TEST_CLUB_ID = 'club-1'

describe('DeleteMemberModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    memberToDelete: mockAdminMember,
    clubId: TEST_CLUB_ID,
    onMemberDeleted: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true with memberToDelete', () => {
      render(<DeleteMemberModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Remove from Club' })).toBeInTheDocument()
      expect(screen.getByText(`"${mockAdminMember.name}"`)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DeleteMemberModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Remove from Club')).not.toBeInTheDocument()
    })

    it('should not render when memberToDelete is null', () => {
      render(<DeleteMemberModal {...defaultProps} memberToDelete={null} />)

      expect(screen.queryByText('Remove from Club')).not.toBeInTheDocument()
    })

    it('should show informational text about account not being affected', () => {
      render(<DeleteMemberModal {...defaultProps} />)

      expect(screen.getByText(/account and membership in other clubs will not be affected/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<DeleteMemberModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-delete-member')
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call PUT /member with remaining clubs on confirm', async () => {
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.click(screen.getByText('Remove from Club', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              id: mockAdminMember.id,
              clubs: expect.not.arrayContaining([TEST_CLUB_ID]),
            }),
          })
        )
      })
    })

    it('should call onMemberDeleted and onClose after successful removal', async () => {
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.click(screen.getByText('Remove from Club', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onMemberDeleted).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError when removal fails with error object', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Server error') })
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.click(screen.getByText('Remove from Club', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Server error')
      })
    })

    it('should call onError with generic message for unknown errors', async () => {
      mockInvoke.mockRejectedValue(42)
      const user = userEvent.setup()
      render(<DeleteMemberModal {...defaultProps} />)

      await user.click(screen.getByText('Remove from Club', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to remove member from club')
      })
    })
  })
})

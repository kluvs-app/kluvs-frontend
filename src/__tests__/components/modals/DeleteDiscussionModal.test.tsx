import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteDiscussionModal from '../../../components/modals/DeleteDiscussionModal'
import { mockClub, mockDiscussion } from '../../utils/mocks'

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

describe('DeleteDiscussionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    discussionToDelete: mockDiscussion,
    selectedClub: mockClub,
    onDiscussionDeleted: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true with discussionToDelete', () => {
      render(<DeleteDiscussionModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Delete Discussion' })).toBeInTheDocument()
      expect(screen.getByText(`"${mockDiscussion.title}"`)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DeleteDiscussionModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Delete Discussion')).not.toBeInTheDocument()
    })

    it('should not render when discussionToDelete is null', () => {
      render(<DeleteDiscussionModal {...defaultProps} discussionToDelete={null} />)

      expect(screen.queryByText('Delete Discussion')).not.toBeInTheDocument()
    })

    it('should show warning text', () => {
      render(<DeleteDiscussionModal {...defaultProps} />)

      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<DeleteDiscussionModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-delete-discussion')
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call supabase session PUT on confirm', async () => {
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.click(screen.getByText('Delete Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'session',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              discussion_ids_to_delete: [mockDiscussion.id],
            }),
          })
        )
      })
    })

    it('should call onDiscussionDeleted and onClose after successful delete', async () => {
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.click(screen.getByText('Delete Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onDiscussionDeleted).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError when delete fails', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Delete failed') })
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.click(screen.getByText('Delete Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Delete failed')
      })
    })

    it('should call onError with generic message for unknown errors', async () => {
      mockInvoke.mockRejectedValue(null)
      const user = userEvent.setup()
      render(<DeleteDiscussionModal {...defaultProps} />)

      await user.click(screen.getByText('Delete Discussion', { selector: 'span' }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to delete discussion')
      })
    })
  })
})

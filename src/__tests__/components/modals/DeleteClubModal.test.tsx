import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteClubModal from '../../../components/modals/DeleteClubModal'
import { mockClub } from '../../utils/mocks'

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: { functions: { invoke: (...args: any[]) => mockInvoke(...args) } },
  invokeFunction: (...args: any[]) => mockInvoke(...args),
}))

describe('DeleteClubModal', () => {
  const clubToDelete = { id: 'club-1', name: 'Book Lovers Club' }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    clubToDelete,
    selectedServer: 'server-1',
    selectedClub: mockClub,
    onClubDeleted: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen is true with clubToDelete', () => {
      render(<DeleteClubModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete Club', { selector: '#modal-title-delete-club' })).toBeInTheDocument()
      expect(screen.getByText(/Book Lovers Club/)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DeleteClubModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not render when clubToDelete is null', () => {
      render(<DeleteClubModal {...defaultProps} clubToDelete={null} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show warning text about undoing', () => {
      render(<DeleteClubModal {...defaultProps} />)
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
    })

    it('should display the club name in the confirmation message', () => {
      render(<DeleteClubModal {...defaultProps} />)
      expect(screen.getByText(`"${clubToDelete.name}"`)).toBeInTheDocument()
    })

    it('should list what will be permanently deleted', () => {
      render(<DeleteClubModal {...defaultProps} />)
      expect(screen.getByText(/reading sessions/i)).toBeInTheDocument()
      expect(screen.getByText(/discussions/i)).toBeInTheDocument()
      expect(screen.getByText(/member associations/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<DeleteClubModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-delete-club')
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call supabase delete on confirm', async () => {
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          expect.stringContaining('club'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should call onClubDeleted and onClose after successful delete', async () => {
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(defaultProps.onClubDeleted).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Loading State', () => {
    it('should show spinner during deletion', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(screen.getByText('Deleting…')).toBeInTheDocument()
      })
    })

    it('should disable buttons during loading', async () => {
      mockInvoke.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should call onError when delete fails', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Network error') })
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error')
      })
    })

    it('should call onError with generic message for unknown errors', async () => {
      mockInvoke.mockRejectedValue('unknown')
      const user = userEvent.setup()
      render(<DeleteClubModal {...defaultProps} />)
      await user.click(screen.getByTestId('modal-club-delete'))
      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to delete club')
      })
    })
  })
})

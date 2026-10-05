import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteAccountModal from '../../../components/modals/DeleteAccountModal'
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

// Mock useAuth
const mockSignOut = vi.fn()
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    member: mockAdminMember,
    signOut: mockSignOut,
  }),
}))

describe('DeleteAccountModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: { success: true, message: 'Member deleted successfully' }, error: null })
    mockSignOut.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<DeleteAccountModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Delete Account' })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DeleteAccountModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Delete Account')).not.toBeInTheDocument()
    })

    it('should state the action is immediate and irreversible', () => {
      render(<DeleteAccountModal {...defaultProps} />)

      expect(screen.getByText(/immediate and cannot be undone/i)).toBeInTheDocument()
    })

    it('should mention automatic club ownership transfer', () => {
      render(<DeleteAccountModal {...defaultProps} />)

      expect(screen.getByText(/ownership will be automatically transferred/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<DeleteAccountModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-delete-account')
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call DELETE /member?id={id} for the logged-in member on confirm', async () => {
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Delete Account' }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          `member?id=${mockAdminMember.id}`,
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('should sign out and call onClose after successful deletion', async () => {
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Delete Account' }))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should show a loading state while deleting', async () => {
      let resolveInvoke: (value: unknown) => void = () => {}
      mockInvoke.mockReturnValue(new Promise(resolve => { resolveInvoke = resolve }))
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Delete Account' }))

      expect(screen.getByText('Deleting…')).toBeInTheDocument()

      resolveInvoke({ data: { success: true }, error: null })
      await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled())
    })
  })

  describe('Error Handling', () => {
    it('should show an inline error and keep the modal open when deletion fails', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Server error') })
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Delete Account' }))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
      expect(defaultProps.onClose).not.toHaveBeenCalled()
      expect(mockSignOut).not.toHaveBeenCalled()
    })

    it('should show a generic message for unknown errors', async () => {
      mockInvoke.mockRejectedValue(42)
      const user = userEvent.setup()
      render(<DeleteAccountModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Delete Account' }))

      await waitFor(() => {
        expect(screen.getByText('Failed to delete account')).toBeInTheDocument()
      })
    })
  })
})

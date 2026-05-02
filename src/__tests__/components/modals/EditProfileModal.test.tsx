import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditProfileModal from '../../../components/modals/EditProfileModal'
import { mockAdminMember } from '../../utils/mocks'

// Mock supabase
const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
  getAvatarUrl: (path: string) => `https://storage.example.com/${path}`,
}))

// Mock useAuth (EditProfileModal uses member from useAuth for submission)
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    member: {
      id: 1,
      user_id: 'admin-user-id',
      name: 'Admin User',
      books_read: 10,
      clubs: [{ id: 'club-1', name: 'Book Lovers Club', discord_channel: 'book-club', server_id: 'server-1', role: 'admin' }],
      discord_id: '111222333444555666',
      avatar_path: 'avatars/admin-user.jpg',
    },
  }),
}))

describe('EditProfileModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onProfileUpdated: vi.fn(),
    onError: vi.fn(),
    currentMember: mockAdminMember,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('should render when isOpen with currentMember', () => {
      render(<EditProfileModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Edit Profile' })).toBeInTheDocument()
      expect(screen.getByText('Update your profile details')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<EditProfileModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
    })

    it('should not render when isOpen is false and currentMember is null', () => {
      render(<EditProfileModal {...defaultProps} isOpen={false} currentMember={null as any} />)

      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
    })

    it('should pre-populate name from currentMember', () => {
      render(<EditProfileModal {...defaultProps} />)

      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument()
    })

    it('should pre-populate discord_id from currentMember', () => {
      render(<EditProfileModal {...defaultProps} />)

      expect(screen.getByDisplayValue('111222333444555666')).toBeInTheDocument()
    })

    it('should show avatar when member has avatar_path', () => {
      render(<EditProfileModal {...defaultProps} />)

      const avatar = screen.getByAltText('Member avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('avatars/admin-user.jpg'))
    })

    it('should not show avatar when member has no avatar_path', () => {
      const memberWithoutAvatar = { ...defaultProps.currentMember, avatar_path: undefined }
      render(<EditProfileModal {...defaultProps} currentMember={memberWithoutAvatar} />)

      expect(screen.queryByAltText('Member avatar')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role and aria attributes', () => {
      render(<EditProfileModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-edit-profile')
    })

    it('should have Close button with aria-label', () => {
      render(<EditProfileModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Validation', () => {
    it('should disable submit when name is empty', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)

      expect(screen.getByText('Save Changes').closest('button')).toBeDisabled()
    })

    it('should disable submit when name is only whitespace', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, '   ')

      expect(screen.getByText('Save Changes').closest('button')).toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call supabase member PUT on submit', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      // Change the name
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({
              name: 'New Name',
              discord_id: '111222333444555666',
            }),
          })
        )
      })
    })

    it('should send discord_id as null when field is cleared', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      const discordInput = screen.getByPlaceholderText('e.g., 123456789012345678')
      await user.clear(discordInput)

      // Change name to enable Save (name must differ from current)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await user.click(screen.getByText('Save Changes'))

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

    it('should call onProfileUpdated on success', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      // Must change name to enable Save (disabled when name === member.name)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(defaultProps.onProfileUpdated).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Close Behavior', () => {
    it('should clear errors and call onClose on Cancel', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should clear errors and call onClose on X button', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should call onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Update failed') })
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      // Must change name to enable Save
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Update failed')
      })
    })
  })
})

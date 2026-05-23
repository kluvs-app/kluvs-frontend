import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditProfileModal from '../../../components/modals/EditProfileModal'
import { mockAdminMember } from '../../utils/mocks'

const mockInvoke = vi.fn()
const mockUpload = vi.fn()

vi.mock('../../../supabase', () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
    storage: { from: () => ({ upload: mockUpload }) },
  },
  invokeFunction: (...args: any[]) => mockInvoke(...args),
  getAvatarUrl: (path: string) => `https://storage.example.com/${path}`,
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    member: {
      id: 1,
      user_id: 'admin-user-id',
      name: 'Admin User',
      handle: 'admin_handle',
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
    mockUpload.mockResolvedValue({ data: {}, error: null })
  })

  describe('Rendering', () => {
    it('renders when isOpen with currentMember', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<EditProfileModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
    })

    it('pre-populates name from currentMember', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument()
    })

    it('shows Discord connected status when discord_id is set', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('111222333444555666')).toBeInTheDocument()
    })

    it('shows Discord not connected when discord_id is null', () => {
      render(<EditProfileModal {...defaultProps} currentMember={{ ...defaultProps.currentMember, discord_id: null }} />)
      expect(screen.getByText('Discord not connected')).toBeInTheDocument()
      expect(screen.queryByText('Connected')).not.toBeInTheDocument()
    })

    it('shows avatar when member has avatar_path', () => {
      render(<EditProfileModal {...defaultProps} />)
      const avatar = screen.getByAltText('Member avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', expect.stringContaining('avatars/admin-user.jpg'))
    })

    it('does not show avatar img when member has no avatar_path', () => {
      const memberWithoutAvatar = { ...defaultProps.currentMember, avatar_path: undefined }
      render(<EditProfileModal {...defaultProps} currentMember={memberWithoutAvatar} />)
      expect(screen.queryByAltText('Member avatar')).not.toBeInTheDocument()
    })

    it('shows Change avatar button', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Change avatar' })).toBeInTheDocument()
    })

  })

  describe('Accessibility', () => {
    it('has dialog role and aria attributes', () => {
      render(<EditProfileModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-edit-profile')
    })

    it('has Close button with aria-label', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('closes on Escape key', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form validation', () => {
    it('disables Save when name is empty', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      await user.clear(screen.getByDisplayValue('Admin User'))
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('disables Save when name is only whitespace', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, '   ')
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('disables Save when nothing has changed', () => {
      render(<EditProfileModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('enables Save when name changes', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    })

  })

  describe('Form submission', () => {
    it('calls member PUT with updated name', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'member',
          expect.objectContaining({ method: 'PUT', body: expect.objectContaining({ name: 'New Name' }) })
        )
      })
    })

    it('calls onProfileUpdated on success', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(defaultProps.onProfileUpdated).toHaveBeenCalledTimes(1))
    })

    it('uploads avatar to storage before saving when file selected', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      const file = new File(['avatar'], 'photo.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      // Trigger name change so Save is enabled regardless of avatar
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Admin User Updated')

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('avatars/'),
          file,
          expect.objectContaining({ upsert: true })
        )
      })
    })
  })

  describe('Close behavior', () => {
    it('clears errors and calls onClose on Cancel', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('clears errors and calls onClose on X button', async () => {
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error handling', () => {
    it('calls onError on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Update failed') })
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)
      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed')
      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(defaultProps.onError).toHaveBeenCalledWith('Update failed'))
    })

    it('calls onError on avatar upload failure', async () => {
      mockUpload.mockResolvedValue({ data: null, error: new Error('Upload failed') })
      const user = userEvent.setup()
      render(<EditProfileModal {...defaultProps} />)

      const file = new File(['avatar'], 'photo.jpg', { type: 'image/jpeg' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(fileInput, file)

      const nameInput = screen.getByDisplayValue('Admin User')
      await user.clear(nameInput)
      await user.type(nameInput, 'Admin User Updated')

      await user.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(defaultProps.onError).toHaveBeenCalledWith('Upload failed'))
    })
  })
})

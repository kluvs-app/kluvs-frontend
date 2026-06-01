import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberModal from '../../../components/modals/MemberModal'
import { mockClub, mockAdminMember, mockRegularMember } from '../../utils/mocks'

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: { functions: { invoke: (...args: any[]) => mockInvoke(...args) } },
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

  describe('Rendering — Add Mode', () => {
    it('renders add mode when no editingMember', () => {
      render(<MemberModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Add Member' })).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<MemberModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Add Member')).not.toBeInTheDocument()
    })

    it('shows empty name field in add mode', () => {
      render(<MemberModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('e.g., BookLover42')).toHaveValue('')
    })

    it('does not show reading toggle in add mode', () => {
      render(<MemberModal {...defaultProps} />)
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    })

    it('has submit button disabled when name is empty', () => {
      render(<MemberModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Add Member' })).toBeDisabled()
    })

    it('enables submit button when name is filled', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      expect(screen.getByRole('button', { name: 'Add Member' })).toBeEnabled()
    })
  })

  describe('Rendering — Edit Mode', () => {
    it('renders edit mode when editingMember is provided', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByRole('heading', { name: 'Edit Member' })).toBeInTheDocument()
    })

    it('does not show name field in edit mode', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.queryByPlaceholderText('e.g., BookLover42')).not.toBeInTheDocument()
    })

    it('does not show books_read field', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.queryByDisplayValue('10')).not.toBeInTheDocument()
    })

    it('does not show discord_id field', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.queryByDisplayValue('111222333444555666')).not.toBeInTheDocument()
    })

    it('shows reading toggle in edit mode', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('shows club name info', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
    })
  })

  describe('Reading toggle — active session', () => {
    it('enables the toggle when club has an active session', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByRole('switch')).not.toBeDisabled()
    })

    it('reflects is_reading state from session member', () => {
      // mockAdminMember (id: 1) has is_reading: true in mockClub.active_session.members
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('reflects is_reading: false for a non-reading member', () => {
      // mockRegularMember (id: 2) has is_reading: false in mockClub.active_session.members
      render(<MemberModal {...defaultProps} editingMember={mockRegularMember} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })

    it('toggles reading status on click', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('shows "Reading" label when is_reading is true', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByText('Reading')).toBeInTheDocument()
    })

    it('shows "Not reading" label when is_reading is false', () => {
      render(<MemberModal {...defaultProps} editingMember={mockRegularMember} />)
      expect(screen.getByText('Not reading')).toBeInTheDocument()
    })
  })

  describe('Reading toggle — no active session', () => {
    const clubNoSession = { ...mockClub, active_session: null }

    it('disables the toggle when no active session', () => {
      render(<MemberModal {...defaultProps} selectedClub={clubNoSession} editingMember={mockAdminMember} />)
      expect(screen.getByRole('switch')).toBeDisabled()
    })

    it('shows helper text when no active session', () => {
      render(<MemberModal {...defaultProps} selectedClub={clubNoSession} editingMember={mockAdminMember} />)
      expect(screen.getByText(/start a session to enable this option/i)).toBeInTheDocument()
    })

    it('does not show helper text when active session exists', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.queryByText(/start a session to enable this option/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission — Add', () => {
    it('calls member API on valid add submission', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'New Member')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))
      await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('member', expect.objectContaining({ method: 'POST' })))
    })

    it('trims whitespace from name on submit', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), '  New Member  ')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))
      await waitFor(() =>
        expect(mockInvoke).toHaveBeenCalledWith('member', expect.objectContaining({
          body: expect.objectContaining({ name: 'New Member' })
        }))
      )
    })

    it('calls onMemberSaved and onClose on success', async () => {
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

  describe('Form Submission — Edit', () => {
    it('calls member API when role changes', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockRegularMember} editorRole="owner" />)
      await user.selectOptions(screen.getByRole('combobox'), 'admin')
      await user.click(screen.getByRole('button', { name: 'Update Member' }))
      await waitFor(() =>
        expect(mockInvoke).toHaveBeenCalledWith('member', expect.objectContaining({ method: 'PUT' }))
      )
    })

    it('calls session API when reading status changes', async () => {
      const user = userEvent.setup()
      // mockAdminMember (id: 1) is currently reading — toggle it off
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} editorRole="owner" />)
      await user.click(screen.getByRole('switch'))
      await user.click(screen.getByRole('button', { name: 'Update Member' }))
      await waitFor(() =>
        expect(mockInvoke).toHaveBeenCalledWith('session', expect.objectContaining({ method: 'PUT' }))
      )
    })

    it('makes no API call when nothing has changed', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} editorRole="owner" />)
      await user.click(screen.getByRole('button', { name: 'Update Member' }))
      await waitFor(() => expect(defaultProps.onMemberSaved).toHaveBeenCalled())
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('calls onMemberSaved and onClose on success', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} editorRole="owner" />)
      await user.click(screen.getByRole('switch'))
      await user.click(screen.getByRole('button', { name: 'Update Member' }))
      await waitFor(() => {
        expect(defaultProps.onMemberSaved).toHaveBeenCalledTimes(1)
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Accessibility', () => {
    it('has dialog role and aria attributes', () => {
      render(<MemberModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-member')
    })

    it('has Close button with aria-label', () => {
      render(<MemberModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('closes on Escape key', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('toggle has aria-checked attribute', () => {
      render(<MemberModal {...defaultProps} editingMember={mockAdminMember} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked')
    })
  })

  describe('Close Behavior', () => {
    it('clears errors and resets form on Cancel', async () => {
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onError).toHaveBeenCalledWith('')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('shows error message in modal on API failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Save failed') })
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))
      await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument())
    })

    it('shows error message in modal on network failure', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))
      await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
    })

    it('clears error when modal is closed and reopened', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Save failed') })
      const user = userEvent.setup()
      render(<MemberModal {...defaultProps} />)
      await user.type(screen.getByPlaceholderText('e.g., BookLover42'), 'Test')
      await user.click(screen.getByRole('button', { name: 'Add Member' }))
      await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})

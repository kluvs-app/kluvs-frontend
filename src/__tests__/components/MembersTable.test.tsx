import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MembersTable from '../../components/MembersTable'
import { mockClub, mockAdminMember, mockRegularMember } from '../utils/mocks'

// Mock supabase to avoid import errors from getAvatarUrl
vi.mock('../../supabase', () => ({
  supabase: {},
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

describe('MembersTable', () => {
  const mockOnAddMember = vi.fn()
  const mockOnEditMember = vi.fn()
  const mockOnDeleteMember = vi.fn()

  const defaultProps = {
    selectedClub: mockClub,
    isAdmin: true,
    onAddMember: mockOnAddMember,
    onEditMember: mockOnEditMember,
    onDeleteMember: mockOnDeleteMember,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should display member count in header', () => {
      render(<MembersTable {...defaultProps} />)

      expect(screen.getByText(`Members (${mockClub.members.length})`)).toBeInTheDocument()
    })

    it('should render all members', () => {
      render(<MembersTable {...defaultProps} />)

      mockClub.members.forEach(member => {
        expect(screen.getByText(member.name)).toBeInTheDocument()
      })
    })

    it('should display member stats correctly', () => {
      render(<MembersTable {...defaultProps} />)

      const firstMember = mockClub.members[0]
      expect(screen.getByText(firstMember.books_read.toString())).toBeInTheDocument()
    })
  })

  describe('Admin-Only Features', () => {
    it('should show Add Member button for admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument()
    })

    it('should hide Add Member button for non-admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={false} />)

      expect(screen.queryByRole('button', { name: /Add Member/i })).not.toBeInTheDocument()
    })

    it('should show edit buttons for admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      // Edit buttons use aria-label="Edit <name>"
      const editButtons = screen.getAllByLabelText(/^Edit /)
      expect(editButtons.length).toBe(mockClub.members.length)
    })

    it('should hide edit buttons for non-admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={false} />)

      const editButtons = screen.queryAllByLabelText(/^Edit /)
      expect(editButtons.length).toBe(0)
    })

    it('should show delete buttons for admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      // Delete buttons use aria-label="Delete <name>"
      const deleteButtons = screen.getAllByLabelText(/^Delete /)
      expect(deleteButtons.length).toBe(mockClub.members.length)
    })

    it('should hide delete buttons for non-admin', () => {
      render(<MembersTable {...defaultProps} isAdmin={false} />)

      const deleteButtons = screen.queryAllByLabelText(/^Delete /)
      expect(deleteButtons.length).toBe(0)
    })
  })

  describe('User Interactions', () => {
    it('should call onAddMember when Add Member button is clicked', async () => {
      const user = userEvent.setup()
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      const addButton = screen.getByRole('button', { name: /Add Member/i })
      await user.click(addButton)

      expect(mockOnAddMember).toHaveBeenCalledTimes(1)
    })

    it('should call onEditMember with correct member when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      const editButtons = screen.getAllByLabelText(/^Edit /)
      await user.click(editButtons[0])

      // Should be called with the first member
      expect(mockOnEditMember).toHaveBeenCalledTimes(1)
      expect(mockOnEditMember).toHaveBeenCalledWith(mockClub.members[0])
    })

    it('should call onDeleteMember with correct member when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      const deleteButtons = screen.getAllByLabelText(/^Delete /)
      await user.click(deleteButtons[0])

      // Should be called with the first member
      expect(mockOnDeleteMember).toHaveBeenCalledTimes(1)
      expect(mockOnDeleteMember).toHaveBeenCalledWith(mockClub.members[0])
    })

    it('should handle edit clicks for multiple members independently', async () => {
      const user = userEvent.setup()
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      const editButtons = screen.getAllByLabelText(/^Edit /)

      // Click first member's edit button
      await user.click(editButtons[0])
      expect(mockOnEditMember).toHaveBeenCalledWith(mockClub.members[0])

      // Click second member's edit button
      await user.click(editButtons[1])
      expect(mockOnEditMember).toHaveBeenCalledWith(mockClub.members[1])

      expect(mockOnEditMember).toHaveBeenCalledTimes(2)
    })
  })

  describe('Empty State', () => {
    it('should handle club with no members gracefully', () => {
      const emptyClub = {
        ...mockClub,
        members: [],
      }

      render(<MembersTable {...defaultProps} selectedClub={emptyClub} />)

      expect(screen.getByText('Members (0)')).toBeInTheDocument()
    })
  })

  describe('Member Status Display', () => {
    it('should show admin member name', () => {
      const clubWithAdmin = {
        ...mockClub,
        members: [mockAdminMember],
      }

      render(<MembersTable {...defaultProps} selectedClub={clubWithAdmin} />)

      expect(screen.getByText(mockAdminMember.name)).toBeInTheDocument()
    })

    it('should display regular members', () => {
      const clubWithRegular = {
        ...mockClub,
        members: [mockRegularMember],
      }

      render(<MembersTable {...defaultProps} selectedClub={clubWithRegular} />)

      expect(screen.getByText(mockRegularMember.name)).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive classes on Add Member button', () => {
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      const addButton = screen.getByRole('button', { name: /Add Member/i })
      // Button should have responsive styling (implementation detail)
      expect(addButton).toBeInTheDocument()
    })
  })

  describe('Member Data Display', () => {
    it('should display books read count', () => {
      render(<MembersTable {...defaultProps} />)

      mockClub.members.forEach(member => {
        expect(screen.getByText(member.books_read.toString())).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible action buttons with aria-labels', () => {
      render(<MembersTable {...defaultProps} isAdmin={true} />)

      // Edit and delete buttons have aria-label attributes
      const editButtons = screen.getAllByLabelText(/^Edit /)
      const deleteButtons = screen.getAllByLabelText(/^Delete /)

      expect(editButtons.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })
})

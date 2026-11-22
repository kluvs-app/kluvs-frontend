import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberBadge from '../../components/MemberBadge'
import type { ClubMember } from '../../types'
import { mockAdminClubMember, mockRegularClubMember } from '../utils/mocks'

vi.mock('../../supabase', () => ({
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

const regular: ClubMember = { ...mockRegularClubMember, role: 'member' }
const owner: ClubMember = { ...mockAdminClubMember, role: 'owner' }

describe('MemberBadge', () => {
  it('renders the name, handle and role', () => {
    render(<MemberBadge member={regular} isOwn={false} isAdmin={false} />)
    expect(screen.getByText('Regular User')).toBeInTheDocument()
    expect(screen.getByText('@regular_handle')).toBeInTheDocument()
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('defaults a missing role to member', () => {
    render(<MemberBadge member={{ ...regular, role: undefined }} isOwn={false} isAdmin={false} />)
    expect(screen.getByText('member')).toBeInTheDocument()
  })

  it('marks the current user with YOU', () => {
    const { rerender } = render(<MemberBadge member={regular} isOwn={false} isAdmin={false} />)
    expect(screen.queryByText('YOU')).not.toBeInTheDocument()
    rerender(<MemberBadge member={regular} isOwn isAdmin={false} />)
    expect(screen.getByText('YOU')).toBeInTheDocument()
  })

  describe('admin menu', () => {
    const handlers = () => ({ onEdit: vi.fn(), onDelete: vi.fn() })

    it('lets an admin edit or remove another member', async () => {
      const user = userEvent.setup()
      const { onEdit, onDelete } = handlers()
      render(<MemberBadge member={regular} isOwn={false} isAdmin onEdit={onEdit} onDelete={onDelete} />)

      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      await user.click(screen.getByRole('button', { name: 'Edit Member' }))
      expect(onEdit).toHaveBeenCalledWith(regular)

      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      await user.click(screen.getByRole('button', { name: 'Remove' }))
      expect(onDelete).toHaveBeenCalledWith(regular)
    })

    it('is hidden for non-admins', () => {
      render(<MemberBadge member={regular} isOwn={false} isAdmin={false} {...handlers()} />)
      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
    })

    it('is hidden on the admin\'s own badge', () => {
      render(<MemberBadge member={regular} isOwn isAdmin {...handlers()} />)
      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
    })

    it('is hidden on the owner\'s badge', () => {
      render(<MemberBadge member={owner} isOwn={false} isAdmin {...handlers()} />)
      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
    })

    it('is hidden when the handlers are missing', () => {
      render(<MemberBadge member={regular} isOwn={false} isAdmin />)
      expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
    })
  })

  describe('reading status', () => {
    it('shows nothing when there is no status', () => {
      render(<MemberBadge member={regular} isOwn={false} isAdmin={false} />)
      expect(screen.queryByTitle('Reading')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Skipping')).not.toBeInTheDocument()
    })

    it('shows the reading icon', () => {
      render(<MemberBadge member={regular} isOwn={false} isAdmin={false} readingStatus="reading" />)
      expect(screen.getByTitle('Reading')).toHaveStyle({ opacity: '1' })
    })

    it('shows the dimmed skipping icon', () => {
      render(<MemberBadge member={regular} isOwn={false} isAdmin={false} readingStatus="skipping" />)
      expect(screen.getByTitle('Skipping')).toHaveStyle({ opacity: '0.4' })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ProfilePage from '../../pages/ProfilePage'
import { mockAdminMember, mockRegularMember, mockClub, mockClub2 } from '../utils/mocks'

vi.mock('../../supabase', () => {
  const mockClient = {
    auth: { getSession: vi.fn(), signInWithOAuth: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
    getAvatarUrl: (path: string) => `https://example.com/${path}`,
  }
})

vi.mock('../../components/modals/EditProfileModal', () => ({
  default: ({ isOpen, onClose, onProfileUpdated }: any) =>
    isOpen ? (
      <div role="dialog" data-testid="edit-profile-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onProfileUpdated} data-testid="profile-updated-btn">Profile Updated</button>
      </div>
    ) : null,
}))

vi.mock('../../components/modals/SignOutModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div role="dialog" data-testid="sign-out-modal">
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

vi.mock('../../components/modals/ReadingLogModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div role="dialog" data-testid="reading-log-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('../../components/AttendanceControl', () => ({
  default: ({ discussion }: any) => <div data-testid="attendance-control">{discussion.id}</div>,
}))

vi.mock('../../components/modals/DiscussionNoteModal', () => ({
  default: ({ isOpen, onClose, discussion }: any) =>
    isOpen ? (
      <div role="dialog" data-testid="note-modal">
        <span data-testid="note-modal-discussion">{discussion?.id}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

let mockSupabase: any

beforeEach(async () => {
  const mod = await import('../../supabase')
  mockSupabase = (mod.supabase as any)
  vi.clearAllMocks()

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'admin-user-id', email: 'admin@example.com' } } },
    error: null,
  })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
    if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
    if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub, error: null })
    return Promise.resolve({ data: null, error: null })
  })
})

function renderPage() {
  return render(<MemoryRouter><ProfilePage /></MemoryRouter>)
}

const TWO_HOP = { timeout: 3000 }

describe('ProfilePage', () => {
  describe('Rendering', () => {
    it('renders the Profile eyebrow', async () => {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('Profile').length).toBeGreaterThan(0))
    })

    it('shows member name', async () => {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0))
    })

    it('shows member handle', async () => {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('@admin_handle').length).toBeGreaterThan(0))
    })

    it('shows member since year in stats', async () => {
      renderPage()
      // memberSince = new Date('2024-01-01').getFullYear() = 2024
      await waitFor(() => expect(screen.getAllByText('2024').length).toBeGreaterThan(0))
    })
  })

  describe('Statistics', () => {
    it('shows clubs count', async () => {
      renderPage()
      await waitFor(() => {
        // "Active clubs" label (desktop) or "Clubs" (mobile) — both in DOM
        expect(screen.getAllByText(/clubs/i).length).toBeGreaterThan(0)
        // The count value "2" is displayed as the stat number
        expect(screen.getAllByText('2').length).toBeGreaterThan(0)
      })
    })

    it('shows books read count', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getAllByText(/books/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText('10').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Currently Reading', () => {
    it('shows book title after clubs load', async () => {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('The Great Gatsby').length).toBeGreaterThan(0), TWO_HOP)
    })

    it('shows book author', async () => {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('F. Scott Fitzgerald').length).toBeGreaterThan(0), TWO_HOP)
    })

    it('shows discussion progress as fraction', async () => {
      renderPage()
      // Both discussions are in the past so done=2, total=2 → "2 of 2"
      // Two clubs both resolve to mockClub, so multiple matching spans are expected
      await waitFor(() => expect(screen.getAllByText(/\d+ of \d+/).length).toBeGreaterThan(0), TWO_HOP)
    })

    it('shows shelf header when no active sessions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub2, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() =>
        expect(screen.getByText(/on your shelf/i)).toBeInTheDocument(), TWO_HOP
      )
    })
  })

  describe('Up Next', () => {
    it('shows Up Next section when an upcoming discussion exists', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({
          data: {
            ...mockClub,
            active_session: {
              ...mockClub.active_session,
              discussions: [{ id: 'd-future', title: 'Chapters 7–9 discussion', scheduled_at: futureDate }],
            },
          },
          error: null,
        })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getAllByText(/up next/i).length).toBeGreaterThan(0), TWO_HOP)
    })

    it('hides Up Next section when there are no future discussions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub2, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() =>
        expect(screen.queryByText(/up next/i)).not.toBeInTheDocument(), TWO_HOP
      )
    })

    it('shows attendance controls for the next discussion', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({
          data: {
            ...mockClub,
            active_session: {
              ...mockClub.active_session,
              discussions: [{ id: 'd-future', title: 'Chapters 7–9 discussion', scheduled_at: futureDate }],
            },
          },
          error: null,
        })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() =>
        expect(screen.getAllByTestId('attendance-control').length).toBeGreaterThan(0), TWO_HOP
      )
      screen.getAllByTestId('attendance-control').forEach(el => {
        expect(el).toHaveTextContent('d-future')
      })
    })

    it('opens the note modal for the next discussion when the note button is clicked', async () => {
      const user = userEvent.setup()
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({
          data: {
            ...mockClub,
            active_session: {
              ...mockClub.active_session,
              discussions: [{ id: 'd-future', title: 'Chapters 7–9 discussion', scheduled_at: futureDate }],
            },
          },
          error: null,
        })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()

      const noteButtons = await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /food for thought/i })
        expect(buttons.length).toBeGreaterThan(1)
        return buttons
      }, TWO_HOP)

      // Mobile note button
      await user.click(noteButtons[0])
      expect(screen.getByTestId('note-modal')).toBeInTheDocument()
      expect(screen.getByTestId('note-modal-discussion')).toHaveTextContent('d-future')

      // Closing the modal
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByTestId('note-modal')).not.toBeInTheDocument()

      // Desktop note button
      await user.click(noteButtons[1])
      expect(screen.getByTestId('note-modal')).toBeInTheDocument()
      expect(screen.getByTestId('note-modal-discussion')).toHaveTextContent('d-future')
    })
  })

  describe('Edit Profile', () => {
    it('opens EditProfileModal via kebab menu', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /open menu/i })[0])
      await user.click(await screen.findByText('Edit Profile'))
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
    })

    it('closes EditProfileModal on dismiss', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /open menu/i })[0])
      await user.click(await screen.findByText('Edit Profile'))
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByTestId('edit-profile-modal')).not.toBeInTheDocument()
    })
  })

  describe('Member with no clubs', () => {
    it('shows zero in clubs stat', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id='))
          return Promise.resolve({ data: { ...mockRegularMember, clubs: [] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getAllByText('0').length).toBeGreaterThan(0))
    })

    it('shows empty state message and CTA when member has no clubs', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id='))
          return Promise.resolve({ data: { ...mockRegularMember, clubs: [] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText(/No clubs yet/i)).toBeInTheDocument(), TWO_HOP)
      expect(screen.getByText(/You haven't joined any book clubs/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /find a club to join/i })).toBeInTheDocument()
    })

    it('applies hover opacity on Find a club link mouseEnter and resets on mouseLeave', async () => {
      const { fireEvent } = await import('@testing-library/react')
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id='))
          return Promise.resolve({ data: { ...mockRegularMember, clubs: [] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByRole('link', { name: /find a club to join/i })).toBeInTheDocument(), TWO_HOP)
      const link = screen.getByRole('link', { name: /find a club to join/i }) as HTMLElement
      fireEvent.mouseEnter(link)
      expect(link.style.opacity).toBe('0.75')
      fireEvent.mouseLeave(link)
      expect(link.style.opacity).toBe('1')
    })
  })

  describe('onProfileUpdated callback', () => {
    it('closes EditProfileModal after onProfileUpdated is called', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /open menu/i })[0])
      await user.click(await screen.findByText('Edit Profile'))
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
      await user.click(screen.getByTestId('profile-updated-btn'))
      expect(screen.queryByTestId('edit-profile-modal')).not.toBeInTheDocument()
    })
  })

  describe('Reading Log', () => {
    it('opens ReadingLogModal via kebab menu', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /open menu/i })[0])
      await user.click(await screen.findByText('Reading Log'))
      expect(screen.getByTestId('reading-log-modal')).toBeInTheDocument()
    })

    it('closes ReadingLogModal on dismiss', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /open menu/i })[0])
      await user.click(await screen.findByText('Reading Log'))
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByTestId('reading-log-modal')).not.toBeInTheDocument()
    })
  })

  describe('Mobile sign-out', () => {
    it('renders kebab menus (no standalone Edit Profile button anywhere)', async () => {
      renderPage()
      await waitFor(() => expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBeGreaterThan(0))
      // Standalone button with aria-label="Edit profile" was removed; menus are used everywhere
      expect(screen.queryAllByLabelText('Edit profile').length).toBe(0)
    })

    it('opens SignOutModal when Sign out is chosen from mobile kebab', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByText(/profile/i).length).toBeGreaterThan(0))
      // The kebab trigger button is the last button before the desktop content
      const kebabTriggers = screen.queryAllByRole('button', { name: /open menu/i })
      // KebabMenu renders a button with aria-label="Open menu"
      expect(kebabTriggers.length).toBeGreaterThan(0)
      await user.click(kebabTriggers[0])
      const signOutItem = await screen.findByText(/sign out/i)
      await user.click(signOutItem)
      await waitFor(() => expect(screen.getByTestId('sign-out-modal')).toBeInTheDocument())
    })

    it('opens EditProfileModal when Edit profile is chosen from mobile kebab', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.queryAllByText(/profile/i).length).toBeGreaterThan(0))
      const kebabTriggers = screen.queryAllByRole('button', { name: /open menu/i })
      expect(kebabTriggers.length).toBeGreaterThan(0)
      await user.click(kebabTriggers[0])
      const editProfileItem = await screen.findAllByText(/edit profile/i)
      await user.click(editProfileItem[0])
      await waitFor(() => expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument())
    })
  })
})

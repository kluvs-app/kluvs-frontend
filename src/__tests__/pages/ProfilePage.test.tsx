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
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div role="dialog" data-testid="edit-profile-modal">
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
              discussions: [{ id: 'd-future', title: 'Chapters 7–9 discussion', date: futureDate }],
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
  })

  describe('Edit Profile', () => {
    it('opens EditProfileModal when Edit profile button is clicked', async () => {
      const user = userEvent.setup()
      renderPage()
      // Both mobile and desktop buttons have aria-label="Edit profile" — click the first
      await waitFor(() => expect(screen.getAllByLabelText('Edit profile').length).toBeGreaterThan(0))
      await user.click(screen.getAllByLabelText('Edit profile')[0])
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
    })

    it('closes EditProfileModal on dismiss', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => expect(screen.getAllByLabelText('Edit profile').length).toBeGreaterThan(0))
      await user.click(screen.getAllByLabelText('Edit profile')[0])
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
  })
})

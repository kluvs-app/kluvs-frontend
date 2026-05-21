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

// Helper for tests requiring auth + club fetch (two async hops)
const TWO_HOP = { timeout: 3000 }

describe('ProfilePage', () => {
  describe('Rendering', () => {
    it('renders the Me heading', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('Me')).toBeInTheDocument())
    })

    it('shows member name', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument())
    })

    it('shows member handle', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('@admin_handle')).toBeInTheDocument())
    })

    it('shows member since year', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText(/Member since/i)).toBeInTheDocument())
    })
  })

  describe('Statistics', () => {
    it('shows clubs count', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Number of Clubs')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('shows books read count', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Books Read')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
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

    it('shows discussion progress label', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText(/discussions/i)).toBeInTheDocument(), TWO_HOP)
    })

    it('shows empty state when no active sessions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub2, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() =>
        expect(screen.getByText(/No active reading sessions/i)).toBeInTheDocument(), TWO_HOP
      )
    })
  })

  describe('Next Discussion', () => {
    it('shows next discussion card when an upcoming discussion exists', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({
          data: {
            ...mockClub,
            active_session: {
              ...mockClub.active_session,
              discussions: [{ id: 'd-future', title: 'Future Discussion', date: futureDate }],
            },
          },
          error: null,
        })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText('Next Discussion')).toBeInTheDocument(), TWO_HOP)
    })

    it('shows no upcoming message when there are no future discussions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub2, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() =>
        expect(screen.getByText(/No upcoming discussions/i)).toBeInTheDocument(), TWO_HOP
      )
    })
  })

  describe('Edit Profile', () => {
    it('opens EditProfileModal when avatar edit button is clicked', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => screen.getByLabelText('Edit profile'))
      await user.click(screen.getByLabelText('Edit profile'))
      expect(screen.getByTestId('edit-profile-modal')).toBeInTheDocument()
    })

    it('closes EditProfileModal on dismiss', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => screen.getByLabelText('Edit profile'))
      await user.click(screen.getByLabelText('Edit profile'))
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByTestId('edit-profile-modal')).not.toBeInTheDocument()
    })
  })

  describe('Member with no clubs', () => {
    it('shows zero clubs in stats', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id='))
          return Promise.resolve({ data: { ...mockRegularMember, clubs: [] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument())
    })
  })
})

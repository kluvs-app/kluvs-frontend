import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ClubsPage from '../../pages/ClubsPage'
import { mockAdminMember, mockRegularMember, mockServer } from '../utils/mocks'

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

vi.mock('../../components/modals/AddClubModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="add-club-modal">
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
    if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
    return Promise.resolve({ data: null, error: null })
  })
})

function renderPage(props = {}) {
  return render(
    <MemoryRouter>
      <ClubsPage {...props} />
    </MemoryRouter>
  )
}

describe('ClubsPage', () => {
  describe('Rendering', () => {
    it('renders the page heading', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('Your Clubs')).toBeInTheDocument())
    })

    it('renders a row for each club', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
        expect(screen.getByText('Sci-Fi Readers')).toBeInTheDocument()
      })
    })

    it('renders role badges', async () => {
      renderPage()
      await waitFor(() => {
        const badges = screen.getAllByText('admin')
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('renders owner badge with correct role', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({
            data: {
              ...mockAdminMember,
              clubs: [{ ...mockAdminMember.clubs[0], role: 'owner' }],
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText('owner')).toBeInTheDocument())
    })

    it('shows empty state when member has no clubs', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText('No clubs yet')).toBeInTheDocument())
    })

    it('renders a New button', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument())
    })
  })

  describe('Navigation', () => {
    it('each club row links to the correct route', async () => {
      renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Book Lovers Club/i })
        expect(link).toHaveAttribute('href', '/clubs/club-1')
      })
    })
  })

  describe('New Club Modal', () => {
    it('opens AddClubModal when New button is clicked', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => screen.getByRole('button', { name: /new/i }))
      await user.click(screen.getByRole('button', { name: /new/i }))
      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()
    })

    it('opens AddClubModal immediately when openNewModal prop is true', async () => {
      renderPage({ openNewModal: true })
      await waitFor(() => expect(screen.getByTestId('add-club-modal')).toBeInTheDocument())
    })

    it('closes modal on dismiss', async () => {
      const user = userEvent.setup()
      renderPage({ openNewModal: true })
      await waitFor(() => screen.getByTestId('add-club-modal'))
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByTestId('add-club-modal')).not.toBeInTheDocument()
    })
  })

  describe('Member role', () => {
    it('still renders club list for a regular member', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => expect(screen.getByText('Book Lovers Club')).toBeInTheDocument())
    })
  })
})

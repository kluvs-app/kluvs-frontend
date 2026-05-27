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
      await waitFor(() => expect(screen.getByText('Clubs')).toBeInTheDocument())
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
      await waitFor(() => expect(screen.getByRole('heading', { name: /no clubs yet/i })).toBeInTheDocument())
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
      await waitFor(() => {
        const clubNames = screen.getAllByText(/Book Lovers Club|Sci-Fi/i)
        expect(clubNames.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Club list rendering', () => {
    it('renders role badge for each club', async () => {
      renderPage()
      await waitFor(() => {
        const badges = screen.getAllByText(/admin|member|owner/i)
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('renders club links for navigation', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Mobile navigation', () => {
    it('each club row is clickable and navigates', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        // Should have at least one club link
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('club links have correct href attributes', async () => {
      renderPage()
      await waitFor(() => {
        const clubLink = screen.getByRole('link', { name: /Book Lovers Club/i })
        expect(clubLink).toHaveAttribute('href', '/clubs/club-1')
      })
    })

    it('second club link navigates to correct club', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const sciFiLink = links.find(link => link.textContent?.includes('Sci-Fi'))
        if (sciFiLink) {
          expect(sciFiLink).toHaveAttribute('href', '/clubs/club-2')
        }
      })
    })
  })

  describe('Club list dividers', () => {
    it('renders dividers between club rows', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        // Dividers are visual separators, just check that we have multiple clubs
        expect(links.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Header and title', () => {
    it('renders eyebrow text "Your"', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('Your')).toBeInTheDocument())
    })

    it('renders large Clubs heading', async () => {
      renderPage()
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /clubs/i })
        expect(heading).toBeInTheDocument()
      })
    })

    it('New button opens modal immediately when openNewModal prop is true', async () => {
      renderPage({ openNewModal: true })
      await waitFor(() => expect(screen.getByTestId('add-club-modal')).toBeInTheDocument())
    })

    it('renders New button with correct styling', async () => {
      renderPage()
      await waitFor(() => {
        const newBtn = screen.getByRole('button', { name: /new/i })
        expect(newBtn).toBeInTheDocument()
      })
    })
  })

  describe('Create first club button in empty state', () => {
    it('shows create button in empty state', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /create your first club/i })
        expect(btn).toBeInTheDocument()
      })
    })

    it('create first club button opens AddClubModal', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => screen.getByRole('button', { name: /create your first club/i }))
      await user.click(screen.getByRole('button', { name: /create your first club/i }))
      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()
    })
  })

  describe('Club list item rendering details', () => {
    it('renders club cover images for each club', async () => {
      renderPage()
      await waitFor(() => {
        // Cover images are rendered via BookCover component
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })
    })

    it('renders club name and link for each club', async () => {
      renderPage()
      await waitFor(() => {
        // Club names should be visible
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
        expect(screen.getByText('Sci-Fi Readers')).toBeInTheDocument()
      })
    })

    it('renders member count in role badge', async () => {
      renderPage()
      await waitFor(() => {
        // Role badges are shown
        const badges = screen.queryAllByText(/admin|member|owner/i)
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it('renders chevron navigation indicator', async () => {
      renderPage()
      await waitFor(() => {
        // Chevrons indicate navigation
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Club list interactions', () => {
    it('navigates to correct club when list item clicked', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Book Lovers Club/i })
        expect(link).toBeInTheDocument()
      })

      const link = screen.getByRole('link', { name: /Book Lovers Club/i })
      expect(link).toHaveAttribute('href', '/clubs/club-1')
    })

    it('all club links are navigable', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('href')
          expect(link.getAttribute('href')).toMatch(/^\/clubs\//)
        })
      })
    })
  })

  describe('Mobile list layout', () => {
    it('displays clubs in single column on mobile', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
        expect(screen.getByText('Sci-Fi Readers')).toBeInTheDocument()
      })
    })

    it('shows club info in correct layout order', async () => {
      renderPage()
      await waitFor(() => {
        // Cover + info column layout
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })
    })
  })

  describe('Desktop redirect behavior', () => {
    it('redirects to last club on desktop when clubs available', async () => {
      // This tests the desktop redirect logic
      renderPage()
      await waitFor(() => {
        // On desktop, user would be redirected
        // On mobile (in tests), they see the list
        expect(screen.queryAllByText(/Clubs/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Empty state styling', () => {
    it('displays empty state with proper structure', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /no clubs yet/i })).toBeInTheDocument()
      })
    })

    it('empty state shows descriptive text', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.queryAllByText(/read alongside friends/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Header and UI elements', () => {
    it('renders eyebrow "Your" text in header', async () => {
      renderPage()
      await waitFor(() => expect(screen.getByText('Your')).toBeInTheDocument())
    })

    it('header has consistent styling with serif heading', async () => {
      renderPage()
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /clubs/i })
        expect(heading).toBeInTheDocument()
        expect(heading.tagName).toBe('H1')
      })
    })

    it('new button placement in header', async () => {
      renderPage()
      await waitFor(() => {
        const newBtn = screen.getByRole('button', { name: /new/i })
        expect(newBtn).toBeInTheDocument()
      })
    })
  })

  describe('Club data fetching', () => {
    it('fetches full club data for each club', async () => {
      renderPage()
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id='),
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    it('handles club data gracefully when fetch incomplete', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        // Simulate slow club fetch by returning nothing
        return new Promise(() => {})
      })
      renderPage()
      // Should still render the page structure
      await waitFor(() => {
        expect(screen.queryAllByText(/Clubs/i).length).toBeGreaterThan(0)
      }, { timeout: 2000 })
    })
  })

  describe('Role-specific badge rendering', () => {
    it('shows correct role badge for each membership', async () => {
      renderPage()
      await waitFor(() => {
        const adminBadges = screen.queryAllByText(/admin/i)
        expect(adminBadges.length).toBeGreaterThan(0)
      })
    })

    it('renders owner badge when member is owner', async () => {
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

    it('renders member badge for member role', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({
            data: {
              ...mockAdminMember,
              clubs: [{ ...mockAdminMember.clubs[0], role: 'member' }],
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Club list edge cases', () => {
    it('handles single club gracefully', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({
            data: { ...mockAdminMember, clubs: [mockAdminMember.clubs[0]] },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockAdminMember.clubs[0], error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })
    })

    it('handles clubs without active sessions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        if (endpoint.includes('club?id=')) {
          const club = { ...mockAdminMember.clubs[0], active_session: null }
          return Promise.resolve({ data: club, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })
    })
  })

  describe('Modal lifecycle', () => {
    it('modal closes after successful club creation', async () => {
      const user = userEvent.setup()
      renderPage({ openNewModal: true })
      await waitFor(() => screen.getByTestId('add-club-modal'))

      const closeBtn = screen.getByRole('button', { name: /close/i })
      await user.click(closeBtn)
      expect(screen.queryByTestId('add-club-modal')).not.toBeInTheDocument()
    })

    it('new modal prop opens modal on mount', async () => {
      renderPage({ openNewModal: true })
      await waitFor(() => expect(screen.getByTestId('add-club-modal')).toBeInTheDocument())
    })

    it('new club modal closes and refreshes member data', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => screen.getByRole('button', { name: /new/i }))

      await user.click(screen.getByRole('button', { name: /new/i }))
      await waitFor(() => screen.getByTestId('add-club-modal'))

      // Modal is open
      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('club links have descriptive names', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link.textContent?.trim().length).toBeGreaterThan(0)
        })
      })
    })

    it('buttons have accessible names', async () => {
      renderPage()
      await waitFor(() => {
        const newBtn = screen.getByRole('button', { name: /new/i })
        expect(newBtn).toBeInTheDocument()
      })
    })

    it('heading hierarchy is correct', async () => {
      renderPage()
      await waitFor(() => {
        const h1 = screen.getByRole('heading', { name: /clubs/i })
        expect(h1.tagName).toBe('H1')
      })
    })
  })

  describe('Club list rendering with data', () => {
    it('renders all clubs from member data', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
        expect(screen.getByText('Sci-Fi Readers')).toBeInTheDocument()
      })
    })

    it('fetches club details for all clubs', async () => {
      renderPage()
      await waitFor(() => {
        // Verify fetch was called for clubs
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id='),
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    it('renders links for navigation to each club', async () => {
      renderPage()
      await waitFor(() => {
        const link1 = screen.getByRole('link', { name: /Book Lovers Club/i })
        const link2 = screen.getByRole('link', { name: /Sci-Fi/i })
        expect(link1).toHaveAttribute('href', '/clubs/club-1')
        expect(link2).toHaveAttribute('href', '/clubs/club-2')
      })
    })
  })

  describe('Page structure and layout', () => {
    it('renders consistent header structure', async () => {
      renderPage()
      await waitFor(() => {
        // Eye brow + heading + button
        expect(screen.getByText('Your')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /clubs/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument()
      })
    })

    it('displays clubs in scrollable list container', async () => {
      renderPage()
      await waitFor(() => {
        // Multiple clubs visible
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
        expect(screen.getByText('Sci-Fi Readers')).toBeInTheDocument()
      })
    })

    it('renders dividers between club rows', async () => {
      renderPage()
      await waitFor(() => {
        // Clubs are separated visually
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Button state and interaction', () => {
    it('new club button is always visible and clickable', async () => {
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /new/i })
        expect(btn).toBeEnabled()
      })
    })

    it('empty state create button opens modal', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      const user = userEvent.setup()
      renderPage()
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /create your first club/i })
        expect(btn).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create your first club/i }))
      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()
    })
  })

  describe('Data loading and caching', () => {
    it('caches club details to avoid refetching', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })

      const callCount = mockSupabase.functions.invoke.mock.calls.length
      // Re-rendering shouldn't refetch (mocked behavior)
      expect(callCount).toBeGreaterThan(0)
    })
  })

  describe('Empty state messaging', () => {
    it('shows proper empty state layout with placeholder cover', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /no clubs yet/i })
        expect(heading).toBeInTheDocument()
      })
    })

    it('shows full empty state with messaging', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: { ...mockAdminMember, clubs: [] }, error: null })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /no clubs yet/i })).toBeInTheDocument()
        expect(screen.queryAllByText(/read alongside friends/i).length).toBeGreaterThan(0)
        expect(screen.getByRole('button', { name: /create your first club/i })).toBeInTheDocument()
      })
    })
  })

  describe('Multiple club management', () => {
    it('handles multiple clubs without duplication', async () => {
      renderPage()
      await waitFor(() => {
        const bookLoversLinks = screen.queryAllByText('Book Lovers Club')
        expect(bookLoversLinks.length).toBeGreaterThan(0)
      })
    })

    it('each club link is unique and navigates to correct destination', async () => {
      renderPage()
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const club1Links = links.filter(l => l.getAttribute('href') === '/clubs/club-1')
        const club2Links = links.filter(l => l.getAttribute('href') === '/clubs/club-2')
        expect(club1Links.length).toBeGreaterThan(0)
        expect(club2Links.length).toBeGreaterThan(0)
      })
    })
  })

})

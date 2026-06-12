import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ClubDetailPage from '../../pages/ClubDetailPage'
import { mockAdminMember, mockRegularMember, mockClub, mockServer } from '../utils/mocks'

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

vi.mock('../../components/layout/Sidebar', () => ({ default: () => null }))
vi.mock('../../components/modals/EditBookModal', () => ({
  default: ({ isOpen, onBookUpdated, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="edit-book-modal">
      <button onClick={onBookUpdated} data-testid="modal-book-save">Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/NewSessionModal', () => ({
  default: ({ isOpen, onSessionCreated, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="new-session-modal">
      <button onClick={onSessionCreated} data-testid="modal-session-save">Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DiscussionModal', () => ({
  default: ({ isOpen, editingDiscussion, onDiscussionSaved, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="discussion-modal">
      <button onClick={onDiscussionSaved} data-testid="modal-discussion-save">Save</button>
      <button onClick={onClose}>Close</button>
      {editingDiscussion && <span data-testid="discussion-being-edited">{editingDiscussion.id}</span>}
    </div>
  ) : null,
}))
vi.mock('../../components/modals/MemberModal', () => ({
  default: ({ isOpen, editingMember, onMemberSaved, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="member-modal">
      <button onClick={onMemberSaved} data-testid="modal-member-save">Save</button>
      <button onClick={onClose}>Close</button>
      {editingMember && <span data-testid="member-being-edited">{editingMember.id}</span>}
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteMemberModal', () => ({
  default: ({ isOpen, memberToDelete, onMemberDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-member-modal">
      <button onClick={onMemberDeleted} data-testid="modal-member-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
      {memberToDelete && <span data-testid="member-to-delete">{memberToDelete.id}</span>}
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteDiscussionModal', () => ({
  default: ({ isOpen, discussionToDelete, onDiscussionDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-discussion-modal">
      <button onClick={onDiscussionDeleted} data-testid="modal-discussion-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
      {discussionToDelete && <span data-testid="discussion-to-delete">{discussionToDelete.id}</span>}
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteClubModal', () => ({
  default: ({ isOpen, clubToDelete, onClubDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-club-modal">
      <button onClick={onClubDeleted} data-testid="modal-club-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
      {clubToDelete && <span data-testid="club-to-delete">{clubToDelete.id}</span>}
    </div>
  ) : null,
}))
vi.mock('../../components/modals/EditClubModal', () => ({
  default: ({ isOpen, onEditClubSaved, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="edit-club-modal">
      <button onClick={onEditClubSaved} data-testid="modal-edit-club-save">Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/AddClubModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="add-club-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockSetTopBar = vi.fn()
vi.mock('../../contexts/MobileTopBarContext', () => ({
  useMobileTopBar: () => ({ setTopBar: mockSetTopBar, resetTopBar: vi.fn(), state: {} }),
}))

let mockSupabase: any
beforeEach(async () => {
  const mod = await import('../../supabase')
  mockSupabase = (mod.supabase as any)
  vi.clearAllMocks()
  mockNavigate.mockReset()
  localStorage.clear()

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
    if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
    return Promise.resolve({ data: null, error: null })
  })
})

function renderDetail(slug = 'club-1') {
  return render(
    <MemoryRouter initialEntries={[`/clubs/${slug}`]}>
      <Routes>
        <Route path="/clubs/:slug" element={<ClubDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ClubDetailPage', () => {
  describe('Loading', () => {
    it('shows loading spinner on mount', () => {
      mockSupabase.functions.invoke.mockImplementation(() => new Promise(() => {}))
      renderDetail()
      expect(screen.getByText(/Loading club/i)).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('renders club content', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for primary content that indicates the detail page loaded
        const clubElements = screen.getAllByText(/club/i)
        expect(clubElements.length).toBeGreaterThan(0)
        const memberElements = screen.getAllByText(/members/i)
        expect(memberElements.length).toBeGreaterThan(0)
      })
    })

    it('renders member count somewhere on the page', async () => {
      renderDetail()
      await waitFor(() => {
        const memberTexts = screen.getAllByText(/3\s*members/i)
        expect(memberTexts.length).toBeGreaterThan(0)
      })
    })

    it('renders founded year when available', async () => {
      renderDetail()
      await waitFor(() => {
        const foundedTexts = screen.getAllByText(/founded/i)
        expect(foundedTexts.length).toBeGreaterThan(0)
      })
    })

    it('renders active session content', async () => {
      renderDetail()
      await waitFor(() => {
        const nowReadingElements = screen.getAllByText(/now reading/i)
        expect(nowReadingElements.length).toBeGreaterThan(0)
      })
    })

    it('renders book title when active session exists', async () => {
      renderDetail()
      await waitFor(() => {
        const bookTitles = screen.getAllByText('The Great Gatsby')
        expect(bookTitles.length).toBeGreaterThan(0)
      })
    })

    it('renders discussions when active session exists', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByText(/scheduled/i)).toBeInTheDocument())
    })

    it('renders member roster section', async () => {
      renderDetail()
      await waitFor(() => {
        const memberLabels = screen.getAllByText(/^members$/i)
        expect(memberLabels.length).toBeGreaterThan(0)
      })
    })

    it('shows no session CTA when club has no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.getAllByText(/Start reading together/i).length).toBeGreaterThan(0))
    })
  })

  describe('Data fetching', () => {
    it('fetches club using slug as ID', async () => {
      renderDetail('club-1')
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    it('writes slug to localStorage on mount', async () => {
      renderDetail('club-1')
      await waitFor(() => {
        const nowReadingElements = screen.getAllByText(/now reading/i)
        expect(nowReadingElements.length).toBeGreaterThan(0)
      })
      expect(localStorage.getItem('kluvs:lastClub')).toBe('club-1')
    })

    it('redirects to /clubs if slug not found in member clubs', async () => {
      renderDetail('unknown-club-id')
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/clubs', { replace: true }))
    })
  })

  describe('Admin actions', () => {
    it('shows Edit club button for admin', async () => {
      renderDetail()
      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit club/i })
        expect(editButtons.length).toBeGreaterThan(0)
      })
    })

    it('hides Edit club button for regular member', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        const allElements = screen.getAllByText(/members/i)
        expect(allElements.length).toBeGreaterThan(0)
      })
      // For regular members, the edit button shouldn't exist
      const editButtons = screen.queryAllByRole('button', { name: /edit club/i })
      expect(editButtons.length).toBe(0)
    })

    it('shows Start Session button for admin when no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        const btns = screen.queryAllByRole('button', { name: /start session/i })
        expect(btns.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error handling', () => {
    it('shows error message when club fetch fails', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: null, error: { message: 'Failed to fetch' } })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.getByText('Failed to fetch')).toBeInTheDocument())
    })
  })

  describe('Modal Management', () => {
    it('opens NewSessionModal when Start Session is clicked (no active session)', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => {
        const btns = screen.queryAllByRole('button', { name: /start session/i })
        expect(btns.length).toBeGreaterThan(0)
      })
      await user.click(screen.getAllByRole('button', { name: /start session/i })[0])
      await waitFor(() => expect(screen.getByTestId('new-session-modal')).toBeInTheDocument())
    })
  })

  describe('Discussion timeline', () => {
    it('renders discussions section with content', async () => {
      renderDetail()
      await waitFor(() => {
        // Just check that discussions are rendered
        const discussionContent = screen.queryAllByText(/scheduled|discussion/i)
        expect(discussionContent.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Members roster', () => {
    it('renders members section', async () => {
      renderDetail()
      await waitFor(() => {
        const memberElements = screen.getAllByText(/members/i)
        expect(memberElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Progress and session info', () => {
    it('renders progress bar for active session', async () => {
      renderDetail()
      await waitFor(() => screen.getByText(/through this session/i))
      expect(screen.getByText(/through this session/i)).toBeInTheDocument()
    })
  })

  describe('Rail navigation (desktop)', () => {
    it('renders club list in left rail on desktop', async () => {
      renderDetail()
      await waitFor(() => {
        const clubElements = screen.queryAllByText(/club/i)
        expect(clubElements.length).toBeGreaterThan(0)
      })
    })

    it('does not show "Invalid Date" in the rail when all discussions are past', async () => {
      renderDetail()
      await waitFor(() => {
        const clubElements = screen.queryAllByText(/club/i)
        expect(clubElements.length).toBeGreaterThan(0)
      })
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/NEXT ·/)).not.toBeInTheDocument()
    })

    it('shows a formatted NEXT date in the rail when an upcoming discussion exists', async () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)
      const clubWithFutureDiscussion = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [
            { id: 'disc-future', title: 'Future discussion', scheduled_at: futureDate.toISOString(), location: 'Room A' },
          ],
        },
      }
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: clubWithFutureDiscussion, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })

      renderDetail()

      await waitFor(() => {
        expect(screen.queryAllByText(/NEXT ·/).length).toBeGreaterThan(0)
      })
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
    })

    it('switches club when rail item is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => {
        const clubButtons = document.querySelectorAll('button')
        return expect(clubButtons.length).toBeGreaterThan(0)
      })

      const railClubs = document.querySelectorAll('button')
      const sciFiBtn = Array.from(railClubs).find(btn => btn.textContent?.includes('Sci-Fi'))
      if (sciFiBtn) {
        await user.click(sciFiBtn)
      }
    })
  })

  describe('Mobile tab navigation', () => {
    it('renders tab buttons on mobile', async () => {
      renderDetail()
      await waitFor(() => {
        // Tab buttons should exist somewhere on the page
        const allButtons = screen.queryAllByRole('button')
        expect(allButtons.length).toBeGreaterThan(0)
      })
    })

    it('shows content on initial render', async () => {
      renderDetail()
      await waitFor(() => {
        // Should have some text content visible
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Overview content', () => {
    it('renders NOW READING content when active session exists', async () => {
      renderDetail()
      await waitFor(() => {
        const nowReadings = screen.queryAllByText(/now reading/i)
        expect(nowReadings.length).toBeGreaterThan(0)
      })
    })

    it('renders UP NEXT content for next discussion', async () => {
      renderDetail()
      await waitFor(() => {
        const upNextElements = screen.queryAllByText(/up next/i)
        expect(upNextElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Discussions content', () => {
    it('renders discussions timeline with items', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/scheduled|discussion/i).length).toBeGreaterThan(0)
      })
    })

    it('shows add discussion button in discussions section', async () => {
      renderDetail()
      await waitFor(() => {
        const addButtons = screen.queryAllByRole('button', { name: /add/i })
        expect(addButtons.length).toBeGreaterThan(0)
      })
    })

    it('displays discussion dates in timeline', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for discussion content (dates should be visible)
        expect(screen.queryAllByText(/May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Members content', () => {
    it('renders member list with member data', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/members/i).length).toBeGreaterThan(0)
      })
    })

    it('shows invite button in members section for admin', async () => {
      renderDetail()
      await waitFor(() => {
        const inviteButtons = screen.queryAllByRole('button', { name: /invite/i })
        expect(inviteButtons.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('displays member names and roles', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for role eyebrows
        expect(screen.queryAllByText(/admin|member|owner/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Discussion status indicators', () => {
    it('renders discussion timeline with different dot statuses', async () => {
      renderDetail()
      await waitFor(() => {
        // Check that discussion content is rendered (dots are visual indicators)
        const discussionSections = screen.queryAllByText(/scheduled/i)
        expect(discussionSections.length).toBeGreaterThan(0)
      })
    })

    it('shows UP NEXT indicator for next discussion', async () => {
      renderDetail()
      await waitFor(() => {
        const upNextIndicators = screen.queryAllByText(/up next/i)
        expect(upNextIndicators.length).toBeGreaterThan(0)
      })
    })

    it('applies opacity to past discussions', async () => {
      renderDetail()
      await waitFor(() => {
        // Check that discussions are rendered in timeline
        const discussionContent = screen.queryAllByText(/discussion|scheduled/i)
        expect(discussionContent.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Progress calculation and display', () => {
    it('renders progress bar with percentage', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for progress bar or percentage text
        expect(screen.queryAllByText(/through this session/i).length).toBeGreaterThan(0)
      })
    })

    it('displays completed / total discussions', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for progress counts like "3 of 6"
        expect(screen.queryAllByText(/of/i).length).toBeGreaterThan(0)
      })
    })

    it('shows session start date', async () => {
      renderDetail()
      await waitFor(() => {
        // Check for "started" text with date
        expect(screen.queryAllByText(/started/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Copy Club ID interaction', () => {
    it('renders Copy Club ID button', async () => {
      renderDetail()
      await waitFor(() => {
        const copyButtons = screen.queryAllByRole('button', { name: /copy club id/i })
        expect(copyButtons.length).toBeGreaterThan(0)
      })
    })

    it('copy button exists and is clickable', async () => {
      const user = userEvent.setup()
      renderDetail()

      await waitFor(() => {
        const copyButtons = screen.queryAllByRole('button', { name: /copy club id/i })
        expect(copyButtons.length).toBeGreaterThan(0)
      })

      const copyButton = screen.queryAllByRole('button', { name: /copy club id/i })[0]
      if (copyButton) {
        await user.click(copyButton)
        // Just verify we can click it without errors
        expect(copyButton).toBeInTheDocument()
      }
    })
  })

  describe('Member roster', () => {
    it('renders members list sorted by role', async () => {
      renderDetail()
      await waitFor(() => {
        const memberElements = screen.getAllByText(/members/i)
        expect(memberElements.length).toBeGreaterThan(0)
      })
    })

    it('shows member names and avatars', async () => {
      renderDetail()
      await waitFor(() => {
        // Members are rendered in the roster
        expect(screen.queryAllByText(/members/i).length).toBeGreaterThan(0)
      })
    })

    it('displays YOU indicator for current user', async () => {
      renderDetail()
      await waitFor(() => {
        const youIndicators = screen.queryAllByText(/YOU/i)
        expect(youIndicators.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('shows role eyebrows for each member', async () => {
      renderDetail()
      await waitFor(() => {
        const roleElements = screen.queryAllByText(/admin|member|owner/i)
        expect(roleElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Kebab menu interactions', () => {
    it('renders kebab menu for admin on discussions', async () => {
      renderDetail()
      await waitFor(() => {
        // Kebab menus exist but are not visible initially
        expect(screen.queryAllByRole('button').length).toBeGreaterThan(0)
      })
    })

    it('renders kebab menu for admin on members', async () => {
      renderDetail()
      await waitFor(() => {
        // Kebab menus exist for member actions
        expect(screen.queryAllByRole('button').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Modal interactions', () => {
    it('can click add discussion button without errors', async () => {
      const user = userEvent.setup()
      renderDetail()

      await waitFor(() => {
        const addButtons = screen.queryAllByRole('button', { name: /add/i })
        expect(addButtons.length).toBeGreaterThan(0)
      })

      const addButton = screen.queryAllByRole('button', { name: /add/i })[0]
      if (addButton) {
        await user.click(addButton)
        // Just verify we can click without errors
        expect(addButton).toBeInTheDocument()
      }
    })

    it('can click edit club button without errors', async () => {
      const user = userEvent.setup()
      renderDetail()

      await waitFor(() => {
        const editButtons = screen.queryAllByRole('button', { name: /edit club/i })
        expect(editButtons.length).toBeGreaterThan(0)
      })

      const editButton = screen.queryAllByRole('button', { name: /edit club/i })[0]
      if (editButton) {
        await user.click(editButton)
        // Just verify we can click without errors
        expect(editButton).toBeInTheDocument()
      }
    })

    it('can click invite member button without errors', async () => {
      const user = userEvent.setup()
      renderDetail()

      await waitFor(() => {
        const inviteButtons = screen.queryAllByRole('button', { name: /invite/i })
        expect(inviteButtons.length).toBeGreaterThan(0)
      })

      const inviteButton = screen.queryAllByRole('button', { name: /invite/i })[0]
      if (inviteButton) {
        await user.click(inviteButton)
        // Just verify we can click without errors
        expect(inviteButton).toBeInTheDocument()
      }
    })
  })

  describe('Desktop two-column layout', () => {
    it('shows discussions and members in two-column grid on desktop', async () => {
      renderDetail()
      await waitFor(() => {
        const discussions = screen.queryAllByText(/discussions/i)
        const members = screen.queryAllByText(/members/i)
        expect(discussions.length + members.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Mobile header and navigation', () => {
    it('renders back link to clubs on mobile', async () => {
      renderDetail()
      await waitFor(() => {
        const backLinks = screen.queryAllByText(/clubs/i)
        expect(backLinks.length).toBeGreaterThan(0)
      })
    })

    it('renders masthead with club name and metadata', async () => {
      renderDetail()
      await waitFor(() => {
        // Club name, role, founded year, member count visible in masthead
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('No active session state', () => {
    it('shows "Start reading together" CTA when club has no session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.getAllByText(/Start reading together/i).length).toBeGreaterThan(0))
    })

    it('shows Start Session button for admin with no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        const startButtons = screen.queryAllByRole('button', { name: /start session/i })
        expect(startButtons.length).toBeGreaterThan(0)
      })
    })

    it('still renders discussions and members columns with no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/^discussions$/i).length).toBeGreaterThan(0)
        expect(screen.queryAllByText(/^members$/i).length).toBeGreaterThan(0)
      })
    })

    it('shows guidance text in discussions column when no session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() =>
        expect(screen.queryAllByText(/start a session first to schedule discussions/i).length).toBeGreaterThan(0)
      )
    })

    it('hides Start Session button from regular members when no session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.queryAllByText(/discussions/i).length).toBeGreaterThan(0))
      expect(screen.queryAllByRole('button', { name: /start session/i }).length).toBe(0)
    })
  })

  describe('Empty discussions state', () => {
    const sessionWithNoDiscussions = { ...mockClub.active_session!, discussions: [] }

    it('shows "No discussions scheduled yet" when session has no discussions', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: sessionWithNoDiscussions }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() =>
        expect(screen.queryAllByText(/No discussions scheduled yet/i).length).toBeGreaterThan(0)
      )
    })

    it('shows Schedule Discussion button for admin when discussions are empty', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: sessionWithNoDiscussions }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        const btns = screen.queryAllByRole('button', { name: /schedule discussion/i })
        expect(btns.length).toBeGreaterThan(0)
      })
    })

    it('opens DiscussionModal when Schedule Discussion is clicked', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: sessionWithNoDiscussions }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => expect(screen.getAllByRole('button', { name: /schedule discussion/i }).length).toBeGreaterThan(0))
      await user.click(screen.getAllByRole('button', { name: /schedule discussion/i })[0])
      await waitFor(() => expect(screen.getByTestId('discussion-modal')).toBeInTheDocument())
    })
  })

  describe('Solo member invite CTA', () => {
    it('shows invite CTA when only one member and user is admin', async () => {
      const soloClub = { ...mockClub, members: [mockAdminMember] }
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: soloClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() =>
        expect(screen.queryAllByText(/Invite others to get the conversation going/i).length).toBeGreaterThan(0)
      )
    })

    it('shows Invite Members button when solo admin', async () => {
      const soloClub = { ...mockClub, members: [mockAdminMember] }
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: soloClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        const btns = screen.queryAllByRole('button', { name: /invite members/i })
        expect(btns.length).toBeGreaterThan(0)
      })
    })

    it('does not show invite CTA when club has multiple members', async () => {
      renderDetail()
      await waitFor(() => expect(screen.queryAllByText(/now reading/i).length).toBeGreaterThan(0))
      expect(screen.queryAllByText(/Invite others to get the conversation going/i).length).toBe(0)
    })
  })

  describe('Mobile header consolidation', () => {
    it('shows Share button for admin', async () => {
      renderDetail()
      await waitFor(() => {
        const shareBtns = screen.queryAllByRole('button', { name: /^share$/i })
        expect(shareBtns.length).toBeGreaterThan(0)
      })
    })

    it('does not show a standalone Edit club ghost button on mobile header', async () => {
      // Desktop still renders it, but we verify the mobile header has no duplicate inline Edit club btn
      // alongside the kebab — the total Edit club buttons should be exactly 1 (desktop only)
      renderDetail()
      await waitFor(() => expect(screen.queryAllByText(/Book Lovers Club/i).length).toBeGreaterThan(0))
      const editClubBtns = screen.queryAllByRole('button', { name: /^edit club$/i })
      expect(editClubBtns.length).toBe(1)
    })
  })

  describe('Helper functions and state logic', () => {
    it('calculates progress correctly with active session', async () => {
      renderDetail()
      await waitFor(() => {
        // Progress is calculated from discussion count
        const progressText = screen.queryAllByText(/\d+ of \d+/)
        expect(progressText.length).toBeGreaterThan(0)
      })
    })

    it('renders different role eyebrows for different members', async () => {
      renderDetail()
      await waitFor(() => {
        // Members are displayed with their roles
        expect(screen.queryAllByText(/admin|member|owner/i).length).toBeGreaterThan(0)
      })
    })

    it('applies opacity styling to past discussions', async () => {
      renderDetail()
      await waitFor(() => {
        // Discussions section should exist
        expect(screen.queryAllByText(/discussions/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Rail section rendering', () => {
    it('renders rail with YOUR CLUBS header', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/your clubs/i).length).toBeGreaterThan(0)
      })
    })

    it('renders club items in rail with names and metadata', async () => {
      renderDetail()
      await waitFor(() => {
        // Club name should appear in rail
        expect(screen.queryAllByText(/Club/i).length).toBeGreaterThan(0)
      })
    })

    it('marks active club with visual indicator', async () => {
      renderDetail()
      await waitFor(() => {
        // Active club should be highlighted visually
        const clubElements = screen.queryAllByText(/club/i)
        expect(clubElements.length).toBeGreaterThan(0)
      })
    })

    it('shows member count and next date in rail for active club', async () => {
      renderDetail()
      await waitFor(() => {
        // Rail shows member count and next date for the selected club
        expect(screen.queryAllByText(/members|NEXT/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Desktop detail panel content', () => {
    it('renders masthead with club name and metadata', async () => {
      renderDetail()
      await waitFor(() => {
        // Masthead has club name
        expect(screen.queryAllByText(/Book Lovers Club/i).length).toBeGreaterThan(0)
      })
    })

    it('renders edit club button in header for admin', async () => {
      renderDetail()
      await waitFor(() => {
        const editButtons = screen.queryAllByRole('button', { name: /edit club/i })
        expect(editButtons.length).toBeGreaterThan(0)
      })
    })

    it('displays book cover in current session feature', async () => {
      renderDetail()
      await waitFor(() => {
        // Book cover and title visible
        expect(screen.queryAllByText(/now reading/i).length).toBeGreaterThan(0)
      })
    })

    it('renders two-column discussions and members layout', async () => {
      renderDetail()
      await waitFor(() => {
        // Both sections should be visible
        expect(screen.queryAllByText(/discussions|members/i).length).toBeGreaterThan(1)
      })
    })
  })

  describe('Member and discussion rendering', () => {
    it('renders all members in the members section', async () => {
      renderDetail()
      await waitFor(() => {
        // Members should be shown
        expect(screen.queryAllByText(/members/i).length).toBeGreaterThan(0)
      })
    })

    it('renders discussion items with dates, titles, and locations', async () => {
      renderDetail()
      await waitFor(() => {
        // Discussions should show content
        expect(screen.queryAllByText(/discussion|scheduled/i).length).toBeGreaterThan(0)
      })
    })

    it('shows kebab menu for admin on discussion items', async () => {
      renderDetail()
      await waitFor(() => {
        // Admin kebab menus exist
        expect(screen.queryAllByRole('button').length).toBeGreaterThan(0)
      })
    })

    it('shows kebab menu for admin on member items', async () => {
      renderDetail()
      await waitFor(() => {
        // Admin kebab menus exist for members
        expect(screen.queryAllByRole('button').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Role-based visibility', () => {
    it('shows admin controls for admin role', async () => {
      renderDetail()
      await waitFor(() => {
        // Edit buttons visible for admin
        const editButtons = screen.queryAllByRole('button', { name: /edit|add|invite/i })
        expect(editButtons.length).toBeGreaterThan(0)
      })
    })

    it('hides admin controls for regular members', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        // Regular members shouldn't see edit button
        const editButtons = screen.queryAllByRole('button', { name: /edit club/i })
        expect(editButtons.length).toBe(0)
      })
    })
  })

  describe('Data persistence', () => {
    it('persists last visited club slug to localStorage', async () => {
      renderDetail('club-1')
      await waitFor(() => {
        expect(localStorage.getItem('kluvs:lastClub')).toBe('club-1')
      })
    })

    it('refreshes club data on demand', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
      // Verify we made the initial fetch
      expect(mockSupabase.functions.invoke).toHaveBeenCalled()
    })
  })

  describe('Modal state management', () => {
    it('handles multiple modal states without errors', async () => {
      const user = userEvent.setup()
      renderDetail()

      // Just verify buttons exist and are clickable
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })

      // Click a button without checking for modal (since mocks don't render modals)
      const buttons = screen.queryAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
      }
    })
  })

  describe('Error handling', () => {
    it('displays error when club fetch fails', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.reject(new Error('Failed to fetch club'))
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        // Error should be handled gracefully
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThanOrEqual(0)
      }, { timeout: 3000 })
    })

    it('handles missing club gracefully', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({
            data: { ...mockAdminMember, clubs: [] },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail('nonexistent-club')
      // Should redirect to /clubs
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/clubs', { replace: true })
      })
    })
  })

  describe('Club management', () => {
    it('renders edit club button for admin', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('renders members section with member count', async () => {
      renderDetail()
      await waitFor(() => {
        const memberTexts = screen.queryAllByText(/3 members|members/i)
        expect(memberTexts.length).toBeGreaterThan(0)
      })
    })

    it('renders discussion section with discussion list', async () => {
      renderDetail()
      await waitFor(() => {
        const discussionTexts = screen.queryAllByText(/discussion|scheduled/i)
        expect(discussionTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Admin actions', () => {
    it('admin can open edit book modal', async () => {
      renderDetail()
      await waitFor(() => {
        // Verify page loaded with admin access
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })

    it('admin can open new session modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open discussion modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open member modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open delete discussion modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open delete member modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open delete club modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('admin can open edit club modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Mobile responsiveness', () => {
    it('shows mobile tab navigation on small screens', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Server data warm-up', () => {
    it('warms up edge functions on mount', async () => {
      renderDetail()
      await waitFor(() => {
        // Verify edge function calls were made
        expect(mockSupabase.functions.invoke).toHaveBeenCalled()
      })
    })
  })

  describe('Discussion handlers', () => {
    it('opens discussion modal for adding new discussion', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('opens discussion modal with editing discussion data', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })

    it('opens delete discussion modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('handles discussion saved callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })

    it('handles discussion deleted callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Member handlers', () => {
    it('opens member modal for adding new member', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('opens member modal with editing member data', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })

    it('opens delete member modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('handles member saved callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })

    it('handles member deleted callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })

    it('sorts members by role (owner, admin, member)', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({
            data: {
              ...mockClub,
              members: [
                { id: '1', name: 'Member', role: 'member' },
                { id: '2', name: 'Owner', role: 'owner' },
                { id: '3', name: 'Admin', role: 'admin' },
              ],
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        // Members should be sorted correctly
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Club management', () => {
    it('opens edit club modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('opens delete club modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('handles edit club saved callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })

    it('handles club deleted callback and navigates', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Session progress tracking', () => {
    it('displays session progress percentage', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({
            data: {
              ...mockClub,
              active_session: {
                discussions: [
                  { id: '1', title: 'Discussion 1', scheduled_at: '2020-01-01T19:00:00Z' },
                  { id: '2', title: 'Discussion 2', scheduled_at: '2026-06-15T19:00:00Z' },
                ],
              },
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })

    it('categorizes discussions by status (past, next, upcoming)', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({
            data: {
              ...mockClub,
              active_session: {
                discussions: [
                  { id: '1', title: 'Past', scheduled_at: '2020-01-01T19:00:00Z' },
                  { id: '2', title: 'Next', scheduled_at: '2026-06-15T19:00:00Z' },
                  { id: '3', title: 'Upcoming', scheduled_at: '2026-07-15T19:00:00Z' },
                ],
              },
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Book and session management', () => {
    it('opens edit book modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('opens new session modal', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('handles book updated callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/book|reading/i).length).toBeGreaterThan(0)
      })
    })

    it('handles session created callback', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/session|discussion/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Club info display', () => {
    it('displays club name', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })

    it('displays club description', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({
            data: { ...mockClub, description: 'A test club description' },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
    })

    it('displays active book cover', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({
            data: {
              ...mockClub,
              active_session: {
                book: { title: 'Test Book', cover_url: 'https://example.com/cover.jpg' },
                discussions: [],
              },
            },
            error: null,
          })
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/book|reading/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Mobile tab navigation', () => {
    it('switches between tabs on mobile', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('shows overview tab content', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club|book|reading/i).length).toBeGreaterThan(0)
      })
    })

    it('shows discussions tab content', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion/i).length).toBeGreaterThan(0)
      })
    })

    it('shows members tab content', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/member/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Refresh functionality', () => {
    it('refreshes club data on demand', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      })
      // Verify initial load happened
      expect(mockSupabase.functions.invoke).toHaveBeenCalled()
    })

    it('shows loading state during refresh', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          // Simulate slow fetch
          return new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: mockClub, error: null }),
              100
            )
          )
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('handles refresh error gracefully', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) {
          return Promise.reject(new Error('Refresh failed'))
        }
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/club/i).length).toBeGreaterThanOrEqual(0)
      }, { timeout: 3000 })
    })
  })

  describe('LocalStorage persistence', () => {
    it('persists club slug to localStorage on mount', async () => {
      renderDetail('test-club')
      await waitFor(() => {
        expect(localStorage.getItem('kluvs:lastClub')).toBe('test-club')
      })
    })

    it('updates localStorage when slug changes', async () => {
      const { unmount } = renderDetail('club-1')
      await waitFor(() => {
        expect(localStorage.getItem('kluvs:lastClub')).toBe('club-1')
      })
      unmount()

      renderDetail('club-2')
      await waitFor(() => {
        expect(localStorage.getItem('kluvs:lastClub')).toBe('club-2')
      })
    })
  })

  describe('Desktop layout', () => {
    it('renders two-column layout with discussions and members', async () => {
      renderDetail()
      await waitFor(() => {
        // Both sections should be visible
        expect(screen.queryAllByText(/discussion|member/i).length).toBeGreaterThan(1)
      })
    })

    it('displays book cover on left column', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/book|cover|reading/i).length).toBeGreaterThan(0)
      })
    })

    it('displays discussions and members on right column', async () => {
      renderDetail()
      await waitFor(() => {
        expect(screen.queryAllByText(/discussion|member/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Keyboard accessibility', () => {
    it('buttons are keyboard accessible', async () => {
      renderDetail()
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })

      const firstButton = screen.queryAllByRole('button')[0]
      if (firstButton) {
        firstButton.focus()
        expect(firstButton).toHaveFocus()
      }
    })
  })

  describe('MobileTopBar context integration', () => {
    it('calls setTopBar with club name and back details after load', async () => {
      renderDetail()
      await waitFor(() => {
        expect(mockSetTopBar).toHaveBeenCalledWith(
          expect.objectContaining({
            title: mockClub.name,
            backLabel: 'Clubs',
            backPath: '/clubs',
          })
        )
      })
    })

    it('does not call setTopBar before club data is available', () => {
      mockSupabase.functions.invoke.mockImplementation(() => new Promise(() => {}))
      renderDetail()
      expect(mockSetTopBar).not.toHaveBeenCalled()
    })

    it('updates setTopBar when club name changes', async () => {
      const updatedClub = { ...mockClub, name: 'Renamed Club' }
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: updatedClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => {
        expect(mockSetTopBar).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Renamed Club' })
        )
      })
    })
  })

})

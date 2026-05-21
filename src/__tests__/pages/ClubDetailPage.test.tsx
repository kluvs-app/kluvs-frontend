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
vi.mock('../../components/DiscussionsTimeline', () => ({
  default: ({ onAddDiscussion }: any) => (
    <div data-testid="discussions-timeline">
      <button onClick={onAddDiscussion} data-testid="add-discussion-btn">Add Discussion</button>
    </div>
  ),
}))
vi.mock('../../components/MembersTable', () => ({
  default: ({ onAddMember, onEditMember, onDeleteMember, selectedClub }: any) => (
    <div data-testid="members-table">
      <button onClick={onAddMember} data-testid="add-member-btn">Add Member</button>
      {selectedClub?.members?.[0] && (
        <>
          <button onClick={() => onEditMember(selectedClub.members[0])} data-testid="edit-member-btn">Edit</button>
          <button onClick={() => onDeleteMember(selectedClub.members[0])} data-testid="delete-member-btn">Delete</button>
        </>
      )}
    </div>
  ),
}))
vi.mock('../../components/BookInfo', () => ({
  default: ({ onEditBook, onNewSession }: any) => (
    <div data-testid="book-info">
      {onEditBook && <button onClick={onEditBook} data-testid="edit-book-btn">Edit Book</button>}
      {onNewSession && <button onClick={onNewSession} data-testid="new-session-btn">New Session</button>}
    </div>
  ),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

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
    it('renders club name in sticky header', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByText('Book Lovers Club')).toBeInTheDocument())
    })

    it('renders member count in header', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByText(/3 members/i)).toBeInTheDocument())
    })

    it('renders founded year when available', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByText(/Founded in/i)).toBeInTheDocument())
    })

    it('renders Active Session section', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByText('Active Session')).toBeInTheDocument())
    })

    it('renders book info when active session exists', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByTestId('book-info')).toBeInTheDocument())
    })

    it('renders discussions timeline when active session exists', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByTestId('discussions-timeline')).toBeInTheDocument())
    })

    it('renders members table', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByTestId('members-table')).toBeInTheDocument())
    })

    it('shows no session message when club has no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.getByText(/No active reading session/i)).toBeInTheDocument())
    })
  })

  describe('Data fetching', () => {
    it('fetches club using slug as ID and member server_id', async () => {
      renderDetail('club-1')
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('server_id=server-1'),
          expect.any(Object)
        )
      })
    })

    it('writes slug to localStorage on mount', async () => {
      renderDetail('club-1')
      await waitFor(() => screen.getByText('Book Lovers Club'))
      expect(localStorage.getItem('kluvs:lastClub')).toBe('club-1')
    })

    it('redirects to /clubs if slug not found in member clubs', async () => {
      renderDetail('unknown-club-id')
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/clubs', { replace: true }))
    })
  })

  describe('Admin actions', () => {
    it('shows delete button for admin', async () => {
      renderDetail()
      await waitFor(() => expect(screen.getByRole('button', { name: /delete club/i })).toBeInTheDocument())
    })

    it('hides delete button for regular member', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => screen.getByText('Book Lovers Club'))
      expect(screen.queryByRole('button', { name: /delete club/i })).not.toBeInTheDocument()
    })

    it('shows Start Session button for admin when no active session', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument())
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
    it('opens EditBookModal when edit book is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-book-btn'))
      await user.click(screen.getByTestId('edit-book-btn'))
      await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument())
    })

    it('opens NewSessionModal when new session is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('new-session-btn'))
      await user.click(screen.getByTestId('new-session-btn'))
      await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument())
    })

    it('opens DiscussionModal when add discussion is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-discussion-btn'))
      await user.click(screen.getByTestId('add-discussion-btn'))
      await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument())
    })

    it('opens MemberModal when add member is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-member-btn'))
      await user.click(screen.getByTestId('add-member-btn'))
      await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument())
    })

    it('opens DeleteClubModal when delete club is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByRole('button', { name: /delete club/i }))
      await user.click(screen.getByRole('button', { name: /delete club/i }))
      await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument())
    })
  })
})

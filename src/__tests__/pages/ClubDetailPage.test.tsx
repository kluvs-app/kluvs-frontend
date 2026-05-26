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
  default: ({ onAddDiscussion, onEditDiscussion, onDeleteDiscussion }: any) => (
    <div data-testid="discussions-timeline">
      <button onClick={onAddDiscussion} data-testid="add-discussion-btn">Add Discussion</button>
      <button onClick={() => onEditDiscussion?.({ id: 'disc-1', title: 'Test', date: '2025-01-01' })} data-testid="edit-discussion-btn">Edit Discussion</button>
      <button onClick={() => onDeleteDiscussion?.({ id: 'disc-1', title: 'Test', date: '2025-01-01' })} data-testid="delete-discussion-btn">Delete Discussion</button>
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
  default: ({ isOpen, onDiscussionSaved, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="discussion-modal">
      <button onClick={onDiscussionSaved} data-testid="modal-discussion-save">Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/MemberModal', () => ({
  default: ({ isOpen, onMemberSaved, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="member-modal">
      <button onClick={onMemberSaved} data-testid="modal-member-save">Save</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteMemberModal', () => ({
  default: ({ isOpen, onMemberDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-member-modal">
      <button onClick={onMemberDeleted} data-testid="modal-member-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteDiscussionModal', () => ({
  default: ({ isOpen, onDiscussionDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-discussion-modal">
      <button onClick={onDiscussionDeleted} data-testid="modal-discussion-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('../../components/modals/DeleteClubModal', () => ({
  default: ({ isOpen, onClubDeleted, onClose }: any) => isOpen ? (
    <div role="dialog" data-testid="delete-club-modal">
      <button onClick={onClubDeleted} data-testid="modal-club-delete">Confirm</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
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
      await waitFor(() => screen.getByText('Book Lovers Club'))
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
      await waitFor(() => expect(screen.getByRole('button', { name: /edit club/i })).toBeInTheDocument())
    })

    it('hides Edit club button for regular member', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockRegularMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: mockClub, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderDetail()
      await waitFor(() => screen.getByText('Book Lovers Club'))
      expect(screen.queryByRole('button', { name: /edit club/i })).not.toBeInTheDocument()
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
      await waitFor(() => expect(screen.getByTestId('edit-book-modal')).toBeInTheDocument())
    })

    it('opens NewSessionModal when new session is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('new-session-btn'))
      await user.click(screen.getByTestId('new-session-btn'))
      await waitFor(() => expect(screen.getByTestId('new-session-modal')).toBeInTheDocument())
    })

    it('opens NewSessionModal when Start Session is clicked (no active session)', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('member?user_id=')) return Promise.resolve({ data: mockAdminMember, error: null })
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: { ...mockClub, active_session: null }, error: null })
        if (endpoint === 'server') return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByRole('button', { name: /start session/i }))
      await user.click(screen.getByRole('button', { name: /start session/i }))
      await waitFor(() => expect(screen.getByTestId('new-session-modal')).toBeInTheDocument())
    })

    it('opens DiscussionModal when add discussion is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-discussion-btn'))
      await user.click(screen.getByTestId('add-discussion-btn'))
      await waitFor(() => expect(screen.getByTestId('discussion-modal')).toBeInTheDocument())
    })

    it('opens DiscussionModal when edit discussion is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-discussion-btn'))
      await user.click(screen.getByTestId('edit-discussion-btn'))
      await waitFor(() => expect(screen.getByTestId('discussion-modal')).toBeInTheDocument())
    })

    it('opens DeleteDiscussionModal when delete discussion is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-discussion-btn'))
      await user.click(screen.getByTestId('delete-discussion-btn'))
      await waitFor(() => expect(screen.getByTestId('delete-discussion-modal')).toBeInTheDocument())
    })

    it('opens MemberModal when add member is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-member-btn'))
      await user.click(screen.getByTestId('add-member-btn'))
      await waitFor(() => expect(screen.getByTestId('member-modal')).toBeInTheDocument())
    })

    it('opens MemberModal when edit member is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-member-btn'))
      await user.click(screen.getByTestId('edit-member-btn'))
      await waitFor(() => expect(screen.getByTestId('member-modal')).toBeInTheDocument())
    })

    it('opens DeleteMemberModal when delete member is clicked', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-member-btn'))
      await user.click(screen.getByTestId('delete-member-btn'))
      await waitFor(() => expect(screen.getByTestId('delete-member-modal')).toBeInTheDocument())
    })

    it('opens DeleteClubModal when delete club is clicked via Edit club modal', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByRole('button', { name: /edit club/i }))
      await user.click(screen.getByRole('button', { name: /edit club/i }))
      await waitFor(() => screen.getByRole('button', { name: /delete club…/i }))
      await user.click(screen.getByRole('button', { name: /delete club…/i }))
      await waitFor(() => expect(screen.getByTestId('delete-club-modal')).toBeInTheDocument())
    })

    it('navigates to /clubs after club is deleted', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByRole('button', { name: /edit club/i }))
      await user.click(screen.getByRole('button', { name: /edit club/i }))
      await waitFor(() => screen.getByRole('button', { name: /delete club…/i }))
      await user.click(screen.getByRole('button', { name: /delete club…/i }))
      await waitFor(() => screen.getByTestId('modal-club-delete'))
      await user.click(screen.getByTestId('modal-club-delete'))
      expect(mockNavigate).toHaveBeenCalledWith('/clubs', { replace: true })
    })
  })

  describe('Refresh (refreshClub)', () => {
    it('calls club API again after onBookUpdated', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-book-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('edit-book-btn'))
      await waitFor(() => screen.getByTestId('modal-book-save'))
      await user.click(screen.getByTestId('modal-book-save'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('calls club API again after onSessionCreated', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('new-session-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('new-session-btn'))
      await waitFor(() => screen.getByTestId('modal-session-save'))
      await user.click(screen.getByTestId('modal-session-save'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('calls club API again after onDiscussionSaved', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-discussion-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('add-discussion-btn'))
      await waitFor(() => screen.getByTestId('modal-discussion-save'))
      await user.click(screen.getByTestId('modal-discussion-save'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('calls club API again after onMemberSaved', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-member-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('add-member-btn'))
      await waitFor(() => screen.getByTestId('modal-member-save'))
      await user.click(screen.getByTestId('modal-member-save'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('calls club API again after onMemberDeleted', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-member-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('delete-member-btn'))
      await waitFor(() => screen.getByTestId('modal-member-delete'))
      await user.click(screen.getByTestId('modal-member-delete'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('calls club API again after onDiscussionDeleted', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-discussion-btn'))
      vi.clearAllMocks()
      mockSupabase.functions.invoke.mockResolvedValue({ data: mockClub, error: null })
      await user.click(screen.getByTestId('delete-discussion-btn'))
      await waitFor(() => screen.getByTestId('modal-discussion-delete'))
      await user.click(screen.getByTestId('modal-discussion-delete'))
      await waitFor(() =>
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          expect.objectContaining({ method: 'GET' })
        )
      )
    })

    it('closes EditBookModal via onClose', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-book-btn'))
      await user.click(screen.getByTestId('edit-book-btn'))
      await waitFor(() => screen.getByTestId('edit-book-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('edit-book-modal')).not.toBeInTheDocument()
    })

    it('closes DiscussionModal via onClose and resets editingDiscussion', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-discussion-btn'))
      await user.click(screen.getByTestId('add-discussion-btn'))
      await waitFor(() => screen.getByTestId('discussion-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('discussion-modal')).not.toBeInTheDocument()
    })

    it('closes MemberModal via onClose and resets editingMember', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('add-member-btn'))
      await user.click(screen.getByTestId('add-member-btn'))
      await waitFor(() => screen.getByTestId('member-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('member-modal')).not.toBeInTheDocument()
    })

    it('closes DeleteMemberModal via onClose and resets memberToDelete', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-member-btn'))
      await user.click(screen.getByTestId('delete-member-btn'))
      await waitFor(() => screen.getByTestId('delete-member-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('delete-member-modal')).not.toBeInTheDocument()
    })

    it('closes DeleteDiscussionModal via onClose', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('delete-discussion-btn'))
      await user.click(screen.getByTestId('delete-discussion-btn'))
      await waitFor(() => screen.getByTestId('delete-discussion-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('delete-discussion-modal')).not.toBeInTheDocument()
    })

    it('closes DeleteClubModal via onClose', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByRole('button', { name: /edit club/i }))
      await user.click(screen.getByRole('button', { name: /edit club/i }))
      await waitFor(() => screen.getByRole('button', { name: /delete club…/i }))
      await user.click(screen.getByRole('button', { name: /delete club…/i }))
      await waitFor(() => screen.getByTestId('delete-club-modal'))
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByTestId('delete-club-modal')).not.toBeInTheDocument()
    })

    it('shows error when refreshClub fails', async () => {
      const user = userEvent.setup()
      renderDetail()
      await waitFor(() => screen.getByTestId('edit-book-btn'))
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('club?id=')) return Promise.resolve({ data: null, error: { message: 'Refresh failed' } })
        return Promise.resolve({ data: null, error: null })
      })
      await user.click(screen.getByTestId('edit-book-btn'))
      await waitFor(() => screen.getByTestId('modal-book-save'))
      await user.click(screen.getByTestId('modal-book-save'))
      await waitFor(() => expect(screen.getByText('Refresh failed')).toBeInTheDocument())
    })
  })
})

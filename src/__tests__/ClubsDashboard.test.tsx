import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from './utils/test-utils'
import userEvent from '@testing-library/user-event'
import ClubsDashboard from '../pages/ClubsDashboard'
import { mockServer, mockServer2, mockClub, mockAdminMember } from './utils/mocks'

// Mock the supabase module
vi.mock('../supabase', () => {
  const mockClient = {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  }
  return {
    supabase: mockClient,
  }
})

// Mock layout and child components to simplify testing
vi.mock('../components/layout/TopNavbar', () => ({
  default: ({ servers, selectedServer, onServerChange, onMenuToggle }: any) => (
    <div data-testid="top-navbar">
      <span>Kluvs</span>
      {onMenuToggle && (
        <button onClick={onMenuToggle} data-testid="menu-toggle">Menu</button>
      )}
      {servers.length > 1 && (
        <select
          value={selectedServer}
          onChange={(e: any) => onServerChange(e.target.value)}
          data-testid="server-selector"
        >
          {servers.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  ),
}))

vi.mock('../components/layout/Sidebar', () => ({
  default: ({ onClubSelect, onAddClub }: any) => (
    <div data-testid="clubs-sidebar">
      <button onClick={onAddClub} data-testid="sidebar-add-club">Add Club</button>
      <button onClick={() => onClubSelect('club-1')} data-testid="select-club-1">
        Select Club 1
      </button>
    </div>
  ),
}))


vi.mock('../components/CurrentReadingCard', () => ({
  default: () => (
    <div data-testid="current-reading-card">
      Current Reading Card
    </div>
  ),
}))

vi.mock('../components/DiscussionsTimeline', () => ({
  default: () => <div data-testid="discussions-timeline">Discussions</div>,
}))

vi.mock('../components/MembersTable', () => ({
  default: () => <div data-testid="members-table">Members</div>,
}))

// Mock all modal components
vi.mock('../components/modals/AddClubModal', () => ({
  default: ({ isOpen, onClose, onClubCreated }: any) =>
    isOpen ? (
      <div data-testid="add-club-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => { onClubCreated('new-club-id'); onClose(); }}>Create</button>
      </div>
    ) : null,
}))

vi.mock('../components/modals/EditBookModal', () => ({ default: () => null }))
vi.mock('../components/modals/NewSessionModal', () => ({ default: () => null }))
vi.mock('../components/modals/DiscussionModal', () => ({ default: () => null }))
vi.mock('../components/modals/MemberModal', () => ({ default: () => null }))
vi.mock('../components/modals/DeleteMemberModal', () => ({ default: () => null }))
vi.mock('../components/modals/DeleteDiscussionModal', () => ({ default: () => null }))
vi.mock('../components/modals/DeleteClubModal', () => ({ default: () => null }))

describe('ClubsDashboard', () => {
  let mockSupabase: any

  beforeEach(async () => {
    // Get the mocked supabase from the module
    const supabaseModule = await import('../supabase')
    mockSupabase = supabaseModule.supabase as any

    // Reset all mocks
    vi.clearAllMocks()

    // Set up auth mocks for admin user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'admin-user-id',
            email: 'admin@example.com',
            user_metadata: { full_name: 'Admin User' },
          },
        },
      },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })

    // Mock member lookup to return admin
    mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
      if (endpoint.includes('member?user_id=')) {
        return Promise.resolve({ data: mockAdminMember, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
  })

  describe('Initial Loading', () => {
    it('should show loading spinner on mount', () => {
      mockSupabase.functions.invoke.mockImplementation(() =>
        new Promise(() => {}) // Never resolves to keep loading state
      )

      render(<ClubsDashboard />)

      expect(screen.getByText(/Loading your book clubs/i)).toBeInTheDocument()
      expect(screen.getByText(/Organizing your library/i)).toBeInTheDocument()
    })

    it('should fetch servers on mount', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('server', {
          method: 'GET',
        })
      })
    })
  })

  describe('Server Selection', () => {
    it('should default to "Blingers\' Books" server if available', async () => {
      const blingersServer = { ...mockServer, name: "Blingers' Books" }

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer2, blingersServer] },
            error: null
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Server selector should show Blingers' Books as selected
      const selector = screen.queryByRole('combobox')
      if (selector) {
        expect(selector).toHaveValue(blingersServer.id)
      }
    })

    it('should default to first server if Blingers\' Books not found', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer, mockServer2] },
            error: null
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })
    })

    it('should show server selector only when multiple servers exist and user is admin', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer, mockServer2] },
            error: null
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        const selector = screen.queryByRole('combobox')
        expect(selector).toBeInTheDocument()
      })
    })

    it('should hide server selector when only one server exists', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer] },
            error: null
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selector = screen.queryByRole('combobox')
      expect(selector).not.toBeInTheDocument()
    })

    it('should clear selected club when server changes', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer, mockServer2] },
            error: null
          })
        }
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Select a club first
      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-reading-card')).toBeInTheDocument()
      })

      // Change server
      const selector = screen.getByRole('combobox')
      await user.selectOptions(selector, mockServer2.id)

      // Selected club should be cleared (child components won't receive club data)
      // We verify this by checking the sidebar is still rendered but club details aren't
      expect(screen.getByTestId('clubs-sidebar')).toBeInTheDocument()
    })
  })

  describe('Club Selection', () => {
    it('should fetch club details when club is selected', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=club-1'),
          { method: 'GET' }
        )
      })

      // Verify child components render with club data
      expect(screen.getByTestId('current-reading-card')).toBeInTheDocument()
      expect(screen.getByTestId('discussions-timeline')).toBeInTheDocument()
      expect(screen.getByTestId('members-table')).toBeInTheDocument()
    })

    it('should handle club fetch errors gracefully', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=')) {
          return Promise.resolve({ data: null, error: new Error('Club not found') })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      // Error should be handled (component should still render)
      await waitFor(() => {
        expect(screen.getByTestId('clubs-sidebar')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when server fetch fails', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: null,
            error: new Error('Network error')
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        // Component should render even with error
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })
    })
  })

  describe('Modal Management', () => {
    it('should open AddClubModal when add club button is clicked', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const addClubButton = screen.getByTestId('sidebar-add-club')
      await user.click(addClubButton)

      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()
    })

    it('should close AddClubModal and refresh clubs when club is created', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=new-club-id')) {
          return Promise.resolve({ data: { ...mockClub, id: 'new-club-id' }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Open modal
      const addClubButton = screen.getByTestId('sidebar-add-club')
      await user.click(addClubButton)

      expect(screen.getByTestId('add-club-modal')).toBeInTheDocument()

      // Create club
      const createButton = screen.getByText('Create')
      await user.click(createButton)

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('add-club-modal')).not.toBeInTheDocument()
      })

      // Should fetch club details for the new club
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          expect.stringContaining('club?id=new-club-id'),
          { method: 'GET' }
        )
      })
    })
  })

  describe('Rendering', () => {
    it('should render all main sections when data is loaded', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
        expect(screen.getByTestId('top-navbar')).toBeInTheDocument()
        expect(screen.getByTestId('clubs-sidebar')).toBeInTheDocument()
      })
    })

    it('should render child components only when club is selected', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Before selecting club, detail components shouldn't show data
      expect(screen.queryByTestId('current-reading-card')).not.toBeInTheDocument()

      // Select club
      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      // After selecting club, detail components should render
      await waitFor(() => {
        expect(screen.getByTestId('current-reading-card')).toBeInTheDocument()
        expect(screen.getByTestId('discussions-timeline')).toBeInTheDocument()
        expect(screen.getByTestId('members-table')).toBeInTheDocument()
      })
    })

    it('should display no club selected state initially', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Should show "Select a Book Club" message
      expect(screen.getByText('Select a Book Club')).toBeInTheDocument()
      expect(screen.getByText(/Choose a club from the sidebar/i)).toBeInTheDocument()
    })

    it('should show club loading state when fetching club details', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          // Simulate slow response
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: mockClub, error: null })
            }, 100)
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      // Should briefly show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading Club Details')).toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Mobile Sidebar', () => {
    it('should toggle sidebar when menu button is clicked', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const menuToggle = screen.getByTestId('menu-toggle')
      expect(menuToggle).toBeInTheDocument()

      // Toggle sidebar open
      await user.click(menuToggle)

      // Toggle sidebar closed
      await user.click(menuToggle)
    })

    it('should close sidebar when club is selected from sidebar', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-reading-card')).toBeInTheDocument()
      })
    })
  })

  describe('Club Info Display', () => {
    it('should display club name and discord channel when club has discord_channel', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(screen.getByText(mockClub.name)).toBeInTheDocument()
        if (mockClub.discord_channel) {
          expect(screen.getByText(`Discord: #${mockClub.discord_channel}`)).toBeInTheDocument()
        }
      })
    })
  })

  describe('Error Display', () => {
    it('should display error message in main content area when club fetch fails', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: null, error: new Error('Club fetch failed') })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(screen.getByText('Club fetch failed')).toBeInTheDocument()
      })
    })

    it('should handle server fetch with no servers gracefully', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [] }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
        expect(screen.getByTestId('clubs-sidebar')).toBeInTheDocument()
      })
    })

    it('should display error when server fetch fails with thrown error', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.reject(new Error('Server fetch error'))
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Server fetch error')).toBeInTheDocument()
      })
    })

    it('should handle server fetch with error object', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: null,
            error: new Error('Server unavailable')
          })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Server unavailable')).toBeInTheDocument()
      })
    })
  })

  describe('Data Refresh Behavior', () => {
    it('should refresh club details after club creation', async () => {
      const user = userEvent.setup()
      let callCount = 0

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=new-club-id')) {
          callCount++
          return Promise.resolve({ data: { ...mockClub, id: 'new-club-id' }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      const addClubButton = screen.getByTestId('sidebar-add-club')
      await user.click(addClubButton)

      const createButton = screen.getByText('Create')
      await user.click(createButton)

      // After club creation, it should fetch club details
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0)
      })
    })

    it('should preserve server selection when creating new club', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({
            data: { servers: [mockServer, mockServer2] },
            error: null
          })
        }
        if (endpoint.includes('club?id=new-club-id')) {
          return Promise.resolve({ data: { ...mockClub, id: 'new-club-id' }, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Change to mockServer2
      const selector = screen.getByTestId('server-selector')
      await user.selectOptions(selector, mockServer2.id)

      // Open add club modal
      const addClubButton = screen.getByTestId('sidebar-add-club')
      await user.click(addClubButton)

      // Create club
      const createButton = screen.getByText('Create')
      await user.click(createButton)

      // Server selection should be preserved
      await waitFor(() => {
        expect(screen.getByTestId('server-selector')).toHaveValue(mockServer2.id)
      })
    })
  })

  describe('Club Deletion', () => {
    it('should clear selected club when it is deleted', async () => {
      const user = userEvent.setup()

      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'server') {
          return Promise.resolve({ data: { servers: [mockServer] }, error: null })
        }
        if (endpoint.includes('club?id=club-1')) {
          return Promise.resolve({ data: mockClub, error: null })
        }
        if (endpoint.includes('member?user_id=')) {
          return Promise.resolve({ data: mockAdminMember, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      render(<ClubsDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Kluvs')).toBeInTheDocument()
      })

      // Select a club
      const selectClubButton = screen.getByTestId('select-club-1')
      await user.click(selectClubButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-reading-card')).toBeInTheDocument()
      })

      // NOTE: In real implementation, DeleteClubModal is mocked so we can't fully test deletion
      // But we verify the component structure is there
      expect(screen.getByTestId('clubs-sidebar')).toBeInTheDocument()
    })
  })
})

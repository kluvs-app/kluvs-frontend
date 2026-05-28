import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import JoinPage from '../../pages/JoinPage'

vi.mock('../../supabase', () => {
  const mockClient = {
    functions: { invoke: vi.fn() },
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
  }
})

// Mock the global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderJoinPage(token = 'test-token-abc') {
  return render(
    <MemoryRouter initialEntries={[`/join/${token}`]}>
      <ThemeProvider>
        <Routes>
          <Route path="/join/:token" element={<JoinPage />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('JoinPage', () => {
  let mockSupabase: any

  beforeEach(async () => {
    const supabaseModule = await import('../../supabase')
    mockSupabase = supabaseModule.supabase as any
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Default: valid invite, no session
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, club: { id: 'club-1', name: 'Book Lovers Club' } }),
    })

    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
    mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true, club_id: 'club-1' }, error: null })
  })

  describe('Loading state', () => {
    it('should show spinner while fetching invite', () => {
      mockFetch.mockReturnValue(new Promise(() => {})) // never resolves
      renderJoinPage()
      expect(document.querySelector('.kluvs-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading invite…')).toBeInTheDocument()
    })
  })

  describe('Valid invite — unauthenticated', () => {
    it('should render club name for valid token', async () => {
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Book Lovers Club')).toBeInTheDocument()
      })
    })

    it('should render "You\'re invited" eyebrow', async () => {
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText("You're invited")).toBeInTheDocument()
      })
    })

    it('should render Discord and Google sign-in buttons', async () => {
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue with Discord/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
      })
    })

    it('should call fetch with correct URL and headers', async () => {
      renderJoinPage('test-token-abc')
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('test-token-abc'),
          expect.objectContaining({
            headers: expect.objectContaining({ apikey: expect.any(String) }),
          })
        )
      })
    })
  })

  describe('Invalid invite', () => {
    it('should show "Invite Expired" for a 404 response with backend error body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Invalid or expired invite' }),
      })
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Invite Expired')).toBeInTheDocument()
        expect(screen.getByText(/no longer valid/i)).toBeInTheDocument()
      })
    })

    it('should show "Invite Expired" when valid is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ valid: false }),
      })
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Invite Expired')).toBeInTheDocument()
      })
    })

    it('should show "Something Went Wrong" on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      })
    })

    it('should show "Club Not Found" when backend reports club not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Club not found' }),
      })
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Club Not Found')).toBeInTheDocument()
      })
    })
  })

  describe('OAuth flow — unauthenticated', () => {
    it('should trigger Discord OAuth with correct redirectTo when Discord button is clicked', async () => {
      const user = userEvent.setup()
      renderJoinPage('test-token-abc')
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue with Discord/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Continue with Discord/i }))
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'discord',
          options: expect.objectContaining({
            redirectTo: expect.stringContaining('test-token-abc'),
          }),
        })
      })
    })

    it('should trigger Google OAuth with correct redirectTo when Google button is clicked', async () => {
      const user = userEvent.setup()
      renderJoinPage('test-token-abc')
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /Continue with Google/i }))
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.objectContaining({
            redirectTo: expect.stringContaining('test-token-abc'),
          }),
        })
      })
    })
  })

  describe('Auto-join — authenticated', () => {
    it('should auto-join and navigate to /app when user has a session on mount', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' }, access_token: 'token' } },
      })
      renderJoinPage()
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'join',
          expect.objectContaining({ body: expect.objectContaining({ token: 'test-token-abc' }) })
        )
        expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true })
      })
    })

    it('should navigate to /app when already a member (400 error)', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' }, access_token: 'token' } },
      })
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Already a member' },
      })
      renderJoinPage()
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true })
      })
    })

    it('should show a generic error for join failures other than "already a member"', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' }, access_token: 'token' } },
      })
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Club is private' },
      })
      renderJoinPage()
      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
        expect(screen.getByText(/Please try again/i)).toBeInTheDocument()
      })
    })
  })

  describe('Layout', () => {
    it('should render Header', async () => {
      renderJoinPage()
      // Header typically contains the Kluvs logo
      await waitFor(() => {
        const imgs = document.querySelectorAll('img[alt="Kluvs"]')
        expect(imgs.length).toBeGreaterThan(0)
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import BooksPage from '../../pages/BooksPage'
import type { Book } from '../../types'

// ── Supabase mock ──────────────────────────────────────────────────────────────

vi.mock('../../supabase', () => {
  const mockClient = {
    auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
    getAvatarUrl: (path: string) => `https://example.com/${path}`,
  }
})

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockSearchResult: Book = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  year: 1925,
  isbn: '978-0-7432-7356-5',
  page_count: 180,
  external_google_id: 'gatsby-google-id',
  image_url: 'https://example.com/gatsby.jpg',
}

const mockSearchResult2: Book = {
  title: '1984',
  author: 'George Orwell',
  year: 1949,
  external_google_id: '1984-google-id',
}

const mockRegisteredBook: Book = {
  ...mockSearchResult,
  id: 42,
}

// ── Setup ──────────────────────────────────────────────────────────────────────

let mockSupabase: any

beforeEach(async () => {
  vi.useFakeTimers()

  const mod = await import('../../supabase')
  mockSupabase = (mod.supabase as any)
  vi.clearAllMocks()

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mockSupabase.functions.invoke.mockResolvedValue({ data: [], error: null })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPage() {
  return render(<MemoryRouter><BooksPage /></MemoryRouter>)
}

/** Fire change on the search input then flush the 400ms debounce + promises. */
async function typeAndSearch(query: string) {
  const input = screen.getByRole('textbox', { name: /search for a book/i })
  fireEvent.change(input, { target: { value: query } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400)
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('BooksPage', () => {

  describe('Initial render', () => {
    it('renders the Books heading', () => {
      renderPage()
      expect(screen.getByText('Books')).toBeInTheDocument()
    })

    it('renders the search input', () => {
      renderPage()
      expect(screen.getByRole('textbox', { name: /search for a book/i })).toBeInTheDocument()
    })

    it('shows the empty search prompt by default', () => {
      renderPage()
      expect(screen.getByText(/search for a book to get started/i)).toBeInTheDocument()
    })

    it('does not show any results initially', () => {
      renderPage()
      expect(screen.queryByText('The Great Gatsby')).not.toBeInTheDocument()
    })
  })

  describe('Search', () => {
    it('calls invokeFunction with the encoded query after debounce', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ data: [mockSearchResult], error: null })
      renderPage()
      await typeAndSearch('gatsby')

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('book?q='),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('displays search results', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ data: [mockSearchResult, mockSearchResult2], error: null })
      renderPage()
      await typeAndSearch('gatsby')

      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
      expect(screen.getByText('1984')).toBeInTheDocument()
    })

    it('accepts books wrapped in an object response shape', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { books: [mockSearchResult] },
        error: null,
      })
      renderPage()
      await typeAndSearch('gatsby')

      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
    })

    it('shows no-results message when search returns empty', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ data: [], error: null })
      renderPage()
      await typeAndSearch('xyznotfound')

      expect(screen.getByText(/no books found/i)).toBeInTheDocument()
    })

    it('shows error message when search throws', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'))
      renderPage()
      await typeAndSearch('gatsby')

      expect(screen.getByText(/search failed/i)).toBeInTheDocument()
    })

    it('does not call invokeFunction with a book search when query is blank', async () => {
      renderPage()
      await typeAndSearch('   ')

      expect(mockSupabase.functions.invoke).not.toHaveBeenCalledWith(
        expect.stringContaining('book?q='),
        expect.anything()
      )
    })
  })

  describe('Book selection and detail', () => {
    async function renderWithResults() {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await typeAndSearch('gatsby')
    }

    async function selectBook() {
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })
    }

    it('shows detail panel after selecting a book', async () => {
      await renderWithResults()
      await selectBook()

      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()
    })

    it('POSTs to the book endpoint on selection', async () => {
      await renderWithResults()
      await selectBook()

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'book',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            title: 'The Great Gatsby',
            external_google_id: 'gatsby-google-id',
          }),
        })
      )
    })

    it('shows "In library" badge after successful upsert', async () => {
      await renderWithResults()
      await selectBook()

      expect(screen.getByText(/in library/i)).toBeInTheDocument()
    })

    it('shows year and page count metadata tiles', async () => {
      await renderWithResults()
      await selectBook()

      // Label text is unique to the detail metadata tiles
      expect(screen.getByText('Year')).toBeInTheDocument()
      expect(screen.getByText('Pages')).toBeInTheDocument()
    })

    it('shows book metadata in the detail view', async () => {
      await renderWithResults()
      await selectBook()

      // ISBN only appears in the detail panel, not in list results
      expect(screen.getByText('978-0-7432-7356-5')).toBeInTheDocument()
    })

    it('back button returns to list view', async () => {
      await renderWithResults()
      await selectBook()
      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /results/i }))
      })

      expect(screen.queryByRole('heading', { name: /the great gatsby/i })).not.toBeInTheDocument()
    })

    it('keeps the book displayed even when upsert fails', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.reject(new Error('upsert failed'))
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await typeAndSearch('gatsby')

      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()
    })
  })
})

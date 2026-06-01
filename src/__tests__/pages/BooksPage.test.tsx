import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import BooksPage from '../../pages/BooksPage'
import type { Book } from '../../types'
import type { GBVolumeInfo, KGPerson } from '../../services/googleBooks'

// ── googleBooks service mock ───────────────────────────────────────────────────
// getAuthor has an early return when API_KEY is absent (which it always is in CI),
// so we mock the module to control its return value directly.

const mockGetVolume = vi.fn<(id: string) => Promise<GBVolumeInfo | null>>()
const mockGetAuthor = vi.fn<(name: string) => Promise<KGPerson | null>>()

vi.mock('../../services/googleBooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../services/googleBooks')>()
  return {
    ...mod,
    getVolume: (id: string) => mockGetVolume(id),
    getAuthor: (name: string) => mockGetAuthor(name),
    getWikipediaAuthorInfo: () => Promise.resolve({ imageUrl: null, extract: null }),
    searchVolumes: () => Promise.resolve([]),
  }
})

// ── fetch mock (kept for any remaining direct fetch usage) ─────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function fetchFail() {
  return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) } as Response)
}

const mockVolumeInfo: GBVolumeInfo = {
  title: 'The Great Gatsby',
  subtitle: 'A Story of the Jazz Age',
  authors: ['F. Scott Fitzgerald'],
  publisher: 'Scribner',
  publishedDate: '1925-04-10',
  description: '<b>A tale of the American Dream.</b>',
  pageCount: 180,
  categories: ['Fiction', 'Classic literature'],
  averageRating: 3.9,
  ratingsCount: 54321,
  language: 'en',
}

const mockKGPerson: KGPerson = {
  name: 'Francis Scott Fitzgerald',
  description: 'American novelist',
  detailedDescription: {
    articleBody: 'Francis Scott Key Fitzgerald was an American novelist.',
  },
}

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

  // Default: service functions return nothing
  mockGetVolume.mockResolvedValue(null)
  mockGetAuthor.mockResolvedValue(null)
  mockFetch.mockResolvedValue(fetchFail())
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
      expect(screen.getByText(/start typing\./i)).toBeInTheDocument()
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

    it('shows Published and Pages labels in the details section', async () => {
      await renderWithResults()
      await selectBook()

      // Label text is unique to the detail metadata rows
      expect(screen.getByText('Published')).toBeInTheDocument()
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

  describe('Selection guard', () => {
    it('does not POST again when the same book is re-selected', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await typeAndSearch('gatsby')

      // Click the list button (first DOM match — panel is CSS-hidden but still in DOM)
      await act(async () => {
        fireEvent.click(screen.getAllByText('The Great Gatsby')[0])
        await vi.advanceTimersByTimeAsync(0)
      })
      const firstCount = mockSupabase.functions.invoke.mock.calls.filter(
        ([ep]: [string]) => ep === 'book'
      ).length

      await act(async () => {
        fireEvent.click(screen.getAllByText('The Great Gatsby')[0])
        await vi.advanceTimersByTimeAsync(0)
      })
      const secondCount = mockSupabase.functions.invoke.mock.calls.filter(
        ([ep]: [string]) => ep === 'book'
      ).length

      expect(secondCount).toBe(firstCount)
    })
  })

  describe('Google Books enrichment (getVolume)', () => {
    async function renderAndSelect() {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      renderPage()
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(100)
      })
    }

    it('calls getVolume with the book external_google_id on selection', async () => {
      await renderAndSelect()
      expect(mockGetVolume).toHaveBeenCalledWith('gatsby-google-id')
    })

    it('shows the subtitle from volumeInfo', async () => {
      await renderAndSelect()
      expect(screen.getByText('A Story of the Jazz Age')).toBeInTheDocument()
    })

    it('shows the description stripped of HTML', async () => {
      await renderAndSelect()
      expect(screen.getByText('A tale of the American Dream.')).toBeInTheDocument()
    })

    it('shows genre chips from categories', async () => {
      await renderAndSelect()
      expect(screen.getByText('Fiction')).toBeInTheDocument()
    })

    it('does not show a star rating (Google ratings are not surfaced)', async () => {
      await renderAndSelect()
      expect(screen.queryByText(/★/)).not.toBeInTheDocument()
    })

    it('still shows the book when getVolume fails', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()
    })
  })

  describe('Author section (getAuthor)', () => {
    async function renderAndSelectWithAuthor() {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      mockGetAuthor.mockResolvedValue(mockKGPerson)
      renderPage()
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(500)
      })
    }

    it('shows the author name when getAuthor returns data', async () => {
      await renderAndSelectWithAuthor()
      expect(screen.getByText('Francis Scott Fitzgerald')).toBeInTheDocument()
    })

    it('shows the author descriptor eyebrow', async () => {
      await renderAndSelectWithAuthor()
      expect(screen.getByText('American novelist')).toBeInTheDocument()
    })

    it('shows the author bio', async () => {
      await renderAndSelectWithAuthor()
      expect(screen.getByText(/Francis Scott Key Fitzgerald/)).toBeInTheDocument()
    })

    it('does not show the author section when getAuthor returns null', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      renderPage()
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(screen.queryByText(/about the author/i)).not.toBeInTheDocument()
    })
  })
})

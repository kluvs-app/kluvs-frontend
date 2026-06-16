import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import BooksPage from '../../pages/BooksPage'
import type { Book, ShelfEntry } from '../../types'
import type { GBVolumeInfo, GBVolume, KGPerson } from '../../services/googleBooks'

// ── googleBooks service mock ───────────────────────────────────────────────────

const mockGetVolume = vi.fn<(id: string) => Promise<GBVolumeInfo | null>>()
const mockGetAuthor = vi.fn<(name: string) => Promise<KGPerson | null>>()
const mockSearchVolumes = vi.fn()

vi.mock('../../services/googleBooks', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../services/googleBooks')>()
  return {
    ...mod,
    getVolume: (id: string) => mockGetVolume(id),
    getAuthor: (name: string) => mockGetAuthor(name),
    getWikipediaAuthorInfo: () => Promise.resolve({ imageUrl: null, extract: null }),
    searchVolumes: (...args: any[]) => mockSearchVolumes(...args),
  }
})

// ── fetch mock ─────────────────────────────────────────────────────────────────

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

const mockKGPersonWithImage: KGPerson = {
  ...mockKGPerson,
  image: { contentUrl: 'https://example.com/fitzgerald.jpg' },
}

const mockAuthorBook: GBVolume = {
  id: 'tender-is-the-night',
  volumeInfo: {
    title: 'Tender Is the Night',
    authors: ['F. Scott Fitzgerald'],
    publishedDate: '1934',
    pageCount: 320,
  },
}

// ── MobileTopBarContext mock ───────────────────────────────────────────────────

const mockSetTopBar = vi.fn()
const mockResetTopBar = vi.fn()

vi.mock('../../contexts/MobileTopBarContext', () => ({
  useMobileTopBar: () => ({ setTopBar: mockSetTopBar, resetTopBar: mockResetTopBar, state: {} }),
}))

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

  mockSetTopBar.mockClear()
  mockResetTopBar.mockClear()

  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mockSupabase.functions.invoke.mockResolvedValue({ data: [], error: null })

  mockGetVolume.mockResolvedValue(null)
  mockGetAuthor.mockResolvedValue(null)
  mockSearchVolumes.mockResolvedValue([])
  mockFetch.mockResolvedValue(fetchFail())
})

afterEach(() => {
  vi.useRealTimers()
})

function renderPage() {
  return render(<MemoryRouter><BooksPage /></MemoryRouter>)
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

async function renderAndWait() {
  const utils = renderPage()
  await flush()
  return utils
}

// The header search icon and the "Search for a book" empty-state CTA share an
// accessible name — always grab the header icon (rendered first in the DOM).
async function openSearch() {
  const buttons = screen.getAllByRole('button', { name: /search for a book/i })
  await act(async () => {
    fireEvent.click(buttons[0])
  })
}

async function typeAndSearch(query: string) {
  await openSearch()
  const input = screen.getByRole('textbox', { name: /search for a book/i })
  fireEvent.change(input, { target: { value: query } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400)
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('BooksPage', () => {

  describe('Initial render — My Shelf', () => {
    it('renders the My Shelf heading', async () => {
      await renderAndWait()
      expect(screen.getByRole('heading', { name: /my shelf/i })).toBeInTheDocument()
    })

    it('renders the search icon button', async () => {
      await renderAndWait()
      expect(screen.getAllByRole('button', { name: /search for a book/i }).length).toBeGreaterThan(0)
    })

    it('fetches shelves via GET /shelf on mount', async () => {
      await renderAndWait()
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'shelf',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('shows the empty state when there are no shelved books', async () => {
      await renderAndWait()
      expect(screen.getByText(/nothing shelved yet/i)).toBeInTheDocument()
    })

    it('does not show any results initially', async () => {
      await renderAndWait()
      expect(screen.queryByText('The Great Gatsby')).not.toBeInTheDocument()
    })

    it('shows error message when shelves fetch fails', async () => {
      mockSupabase.functions.invoke.mockRejectedValue(new Error('network'))
      await renderAndWait()
      expect(screen.getByText(/could not load shelves/i)).toBeInTheDocument()
    })

    it('empty-state CTA switches to the search view', async () => {
      await renderAndWait()
      await act(async () => {
        fireEvent.click(screen.getByText('Search for a book'))
      })
      expect(screen.getByRole('button', { name: /back to my shelf/i })).toBeInTheDocument()
      expect(screen.getByText(/start typing\./i)).toBeInTheDocument()
    })

    it('shows shelved books grouped by shelf section with counts', async () => {
      const entries: ShelfEntry[] = [
        { shelf: 'want_to_read', updated_at: '2026-01-01T00:00:00Z', source: 'manual', book: { ...mockRegisteredBook, id: 1, title: 'Book A' } },
        { shelf: 'read', updated_at: '2026-01-02T00:00:00Z', source: 'manual', book: { ...mockRegisteredBook, id: 2, title: 'Book B' } },
      ]
      mockSupabase.functions.invoke.mockResolvedValue({ data: entries, error: null })
      await renderAndWait()

      expect(screen.getByText('Book A')).toBeInTheDocument()
      expect(screen.getByText('Book B')).toBeInTheDocument()
      expect(screen.getByText('Want to Read')).toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    it('shows a Currently Reading section ahead of the other shelves', async () => {
      const entries: ShelfEntry[] = [
        { shelf: 'want_to_read', updated_at: '2026-01-01T00:00:00Z', source: 'manual', book: { ...mockRegisteredBook, id: 1, title: 'Book A' } },
        { shelf: 'currently_reading', updated_at: '2026-01-02T00:00:00Z', source: 'session', book: { ...mockRegisteredBook, id: 2, title: 'Book B' } },
      ]
      mockSupabase.functions.invoke.mockResolvedValue({ data: entries, error: null })
      await renderAndWait()

      const headings = screen.getAllByText(/currently reading|want to read/i)
      expect(headings[0]).toHaveTextContent(/currently reading/i)
    })

    it('shows a "Reading with Kluvs" ribbon on session-sourced shelved covers', async () => {
      const entries: ShelfEntry[] = [
        { shelf: 'currently_reading', updated_at: '2026-01-01T00:00:00Z', source: 'session', book: { ...mockRegisteredBook, id: 1, title: 'Book A' } },
        { shelf: 'read', updated_at: '2026-01-02T00:00:00Z', source: 'manual', book: { ...mockRegisteredBook, id: 2, title: 'Book B' } },
      ]
      mockSupabase.functions.invoke.mockResolvedValue({ data: entries, error: null })
      await renderAndWait()

      expect(screen.getByLabelText(/reading with kluvs/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^read with kluvs$/i)).not.toBeInTheDocument()
    })

    it('clicking a shelved book opens the detail overlay', async () => {
      const shelvedGatsby: Book = { ...mockRegisteredBook }
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'shelf') return Promise.resolve({ data: [{ shelf: 'read', book: shelvedGatsby }], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()
    })
  })

  describe('Search', () => {
    it('opening search shows the "Start typing" empty state', async () => {
      await renderAndWait()
      await openSearch()
      expect(screen.getByText(/start typing\./i)).toBeInTheDocument()
    })

    it('the back button returns to My Shelf', async () => {
      await renderAndWait()
      await openSearch()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /back to my shelf/i }))
      })
      expect(screen.getByRole('heading', { name: /my shelf/i })).toBeInTheDocument()
      expect(screen.getByText(/nothing shelved yet/i)).toBeInTheDocument()
    })

    it('calls invokeFunction with the encoded query after debounce', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockResolvedValue({ data: [mockSearchResult], error: null })
      await typeAndSearch('gatsby')

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('book?q='),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('displays search results', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockResolvedValue({ data: [mockSearchResult, mockSearchResult2], error: null })
      await typeAndSearch('gatsby')

      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
      expect(screen.getByText('1984')).toBeInTheDocument()
    })

    it('accepts books wrapped in an object response shape', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { books: [mockSearchResult] },
        error: null,
      })
      await typeAndSearch('gatsby')

      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
    })

    it('shows no-results message when search returns empty', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockResolvedValue({ data: [], error: null })
      await typeAndSearch('xyznotfound')

      expect(screen.getByText(/no matches/i)).toBeInTheDocument()
    })

    it('shows error message when search throws', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'))
      await typeAndSearch('gatsby')

      expect(screen.getByText(/search failed/i)).toBeInTheDocument()
    })

    it('does not call invokeFunction with a book search when query is blank', async () => {
      await renderAndWait()
      await typeAndSearch('   ')

      expect(mockSupabase.functions.invoke).not.toHaveBeenCalledWith(
        expect.stringContaining('book?q='),
        expect.anything()
      )
    })
  })

  describe('Book selection and detail', () => {
    async function renderWithResults() {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
    }

    async function selectBook() {
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })
    }

    it('shows detail overlay after selecting a book', async () => {
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

      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Pages')).toBeInTheDocument()
    })

    it('shows book metadata in the detail view', async () => {
      await renderWithResults()
      await selectBook()

      expect(screen.getByText('978-0-7432-7356-5')).toBeInTheDocument()
    })

    it('calls setTopBar with title "Book", backLabel "Search", and an onBack fn when a book is selected from search', async () => {
      await renderWithResults()
      await selectBook()

      expect(mockSetTopBar).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book',
          backLabel: 'Search',
          onBack: expect.any(Function),
        })
      )
    })

    it('calls setTopBar with backLabel "My Shelf" when a book is selected from My Shelf', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'shelf') return Promise.resolve({ data: [{ shelf: 'read', book: mockRegisteredBook }], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await renderAndWait()
      await selectBook()

      expect(mockSetTopBar).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Book', backLabel: 'My Shelf' })
      )
    })

    it('onBack callback from setTopBar closes the detail overlay', async () => {
      await renderWithResults()
      await selectBook()
      expect(screen.getByRole('heading', { name: /the great gatsby/i })).toBeInTheDocument()

      const { onBack } = mockSetTopBar.mock.calls[mockSetTopBar.mock.calls.length - 1][0]
      await act(async () => { onBack() })

      expect(screen.queryByRole('heading', { name: /the great gatsby/i })).not.toBeInTheDocument()
    })

    it('desktop close button closes the detail overlay', async () => {
      await renderWithResults()
      await selectBook()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
      })

      expect(screen.queryByRole('heading', { name: /the great gatsby/i })).not.toBeInTheDocument()
    })

    it('keeps the book displayed even when upsert fails', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.reject(new Error('upsert failed'))
        return Promise.resolve({ data: null, error: null })
      })
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
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')

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
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
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

    it('still shows the book when getVolume fails', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
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
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      mockGetAuthor.mockResolvedValue(mockKGPerson)
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
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(screen.queryByText(/about the author/i)).not.toBeInTheDocument()
    })

    it('renders author photo when authorInfo has image.contentUrl', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      mockGetAuthor.mockResolvedValue(mockKGPersonWithImage)
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(500)
      })
      const photo = document.querySelector('img[alt="Francis Scott Fitzgerald"]') as HTMLImageElement
      expect(photo).toBeInTheDocument()
      expect(photo.src).toContain('fitzgerald.jpg')
    })

    it('hides author photo when the image errors', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      mockGetAuthor.mockResolvedValue(mockKGPersonWithImage)
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(500)
      })
      const photo = document.querySelector('img[alt="Francis Scott Fitzgerald"]') as HTMLImageElement
      expect(photo).toBeInTheDocument()
      await act(async () => { fireEvent.error(photo) })
      expect(document.querySelector('img[alt="Francis Scott Fitzgerald"]')).not.toBeInTheDocument()
    })
  })

  describe('Like feature', () => {
    async function renderWithRegisteredBook() {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
    }

    async function selectBook() {
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })
    }

    it('renders a like button after selecting a registered book', async () => {
      await renderWithRegisteredBook()
      await selectBook()

      expect(screen.getByRole('button', { name: /like this book/i })).toBeInTheDocument()
    })

    it('fetches like status via GET /like?book_id= after book is registered', async () => {
      await renderWithRegisteredBook()
      await selectBook()

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringMatching(/^like\?book_id=42$/),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('like button is disabled when the book has no id', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: { ...mockSearchResult, id: undefined }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      expect(screen.getByRole('button', { name: /like this book/i })).toBeDisabled()
    })

    it('POSTs to /like and optimistically toggles liked state on click', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint === 'like') return Promise.resolve({ data: { success: true, liked: true }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      const likeButton = screen.getByRole('button', { name: /like this book/i })
      await act(async () => {
        fireEvent.click(likeButton)
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'like',
        expect.objectContaining({ method: 'POST', body: { book_id: 42 } })
      )
    })

    it('reverts optimistic like state when POST /like fails', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint === 'like') return Promise.resolve({ data: null, error: new Error('toggle failed') })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      const likeButton = () => screen.getByRole('button', { name: /like this book/i })
      expect(likeButton()).toHaveAttribute('aria-pressed', 'false')

      await act(async () => {
        fireEvent.click(likeButton())
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /like this book/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('shows liked state when GET /like returns liked: true', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: true }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      expect(screen.getByRole('button', { name: /unlike this book/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /unlike this book/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('reverts optimistic like state when POST /like throws a network error', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint === 'like') return Promise.reject(new Error('network error'))
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /like this book/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /like this book/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('resets like state when a different book is selected', async () => {
      await renderAndWait()
      let likeGetCallCount = 0
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult, mockSearchResult2], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) {
          likeGetCallCount++
          return Promise.resolve({ data: { success: true, liked: likeGetCallCount === 1 }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')

      await act(async () => {
        fireEvent.click(screen.getAllByText('The Great Gatsby')[0])
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /unlike this book/i })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByText('1984'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /like this book/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /like this book/i })).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Shelf feature', () => {
    async function renderWithRegisteredBook(shelfGetResponse: { shelf: string | null } = { shelf: null }) {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, ...shelfGetResponse }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
    }

    async function selectBook() {
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })
    }

    async function openShelfDropdown() {
      const trigger = screen.getByRole('button', { name: /add to shelf|shelf:/i })
      await act(async () => { fireEvent.click(trigger) })
    }

    it('shows a "Read with Kluvs" badge in the detail panel for session-sourced entries', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'shelf') return Promise.resolve({ data: [{ shelf: 'read', updated_at: '2026-01-01T00:00:00Z', source: 'session', book: mockRegisteredBook }], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: 'read' }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getAllByLabelText(/read with kluvs/i).length).toBeGreaterThan(0)
    })

    it('does not show a "with Kluvs" badge for manually-shelved entries', async () => {
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint === 'shelf') return Promise.resolve({ data: [{ shelf: 'read', updated_at: '2026-01-01T00:00:00Z', source: 'manual', book: mockRegisteredBook }], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: 'read' }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.queryByLabelText(/with kluvs/i)).not.toBeInTheDocument()
    })

    it('renders the shelf button after selecting a registered book', async () => {
      await renderWithRegisteredBook()
      await selectBook()
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument()
    })

    it('shelf button is disabled when book has no id', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: { ...mockSearchResult, id: undefined }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeDisabled()
    })

    it('fetches shelf status via GET /shelf?book_id= after book is registered', async () => {
      await renderWithRegisteredBook()
      await selectBook()
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringMatching(/^shelf\?book_id=42$/),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('shows current shelf label on the button when GET /shelf returns a value', async () => {
      await renderWithRegisteredBook({ shelf: 'want_to_read' })
      await selectBook()
      expect(screen.getByRole('button', { name: /shelf: want to read/i })).toBeInTheDocument()
    })

    it('opens the dropdown on button click and shows all options', async () => {
      await renderWithRegisteredBook()
      await selectBook()
      await openShelfDropdown()

      const listbox = screen.getByRole('listbox', { name: /select shelf/i })
      expect(within(listbox).getByRole('option', { name: /none/i })).toBeInTheDocument()
      expect(within(listbox).getByRole('option', { name: /currently reading/i })).toBeInTheDocument()
      expect(within(listbox).getByRole('option', { name: /want to read/i })).toBeInTheDocument()
      expect(within(listbox).getByRole('option', { name: /^read$/i })).toBeInTheDocument()
      expect(within(listbox).getByRole('option', { name: /not finished/i })).toBeInTheDocument()
    })

    it('active option shows a checkmark (aria-selected=true)', async () => {
      await renderWithRegisteredBook({ shelf: 'read' })
      await selectBook()
      await openShelfDropdown()

      const listbox = screen.getByRole('listbox', { name: /select shelf/i })
      expect(within(listbox).getByRole('option', { name: /^read$/i })).toHaveAttribute('aria-selected', 'true')
      expect(within(listbox).getByRole('option', { name: /none/i })).toHaveAttribute('aria-selected', 'false')
    })

    it('closes the dropdown after selecting an option', async () => {
      await renderWithRegisteredBook()
      await selectBook()
      await openShelfDropdown()

      const listbox = screen.getByRole('listbox', { name: /select shelf/i })
      await act(async () => {
        fireEvent.click(within(listbox).getByRole('option', { name: /want to read/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('POSTs to /shelf when a non-None option is selected', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: null }, error: null })
        if (endpoint === 'shelf') return Promise.resolve({ data: { success: true, shelf: 'read' }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()
      await openShelfDropdown()

      await act(async () => {
        fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /^read$/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'shelf',
        expect.objectContaining({ method: 'POST', body: { book_id: 42, shelf: 'read' } })
      )
    })

    it('DELETEs /shelf when None option is selected while shelf is set', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: null }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()
      await openShelfDropdown()

      await act(async () => {
        fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /none/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringMatching(/^shelf\?book_id=42$/),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('optimistically updates shelf state and confirms from server response', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: null }, error: null })
        if (endpoint === 'shelf') return Promise.resolve({ data: { success: true, shelf: 'not_finished' }, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()
      await openShelfDropdown()

      await act(async () => {
        fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /not finished/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /shelf: not finished/i })).toBeInTheDocument()
    })

    it('reverts shelf state when POST /shelf fails', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) return Promise.resolve({ data: { success: true, shelf: null }, error: null })
        if (endpoint === 'shelf') return Promise.resolve({ data: null, error: new Error('shelf failed') })
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')
      await selectBook()

      // No shelf set → button shows "Add to shelf"
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument()

      await openShelfDropdown()
      await act(async () => {
        fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /^read$/i }))
        await vi.advanceTimersByTimeAsync(0)
      })

      // Reverted — back to "Add to shelf"
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument()
    })

    it('resets shelf state when a different book is selected', async () => {
      await renderAndWait()
      let shelfGetCount = 0
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult, mockSearchResult2], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        if (endpoint.startsWith('like?book_id=')) return Promise.resolve({ data: { success: true, liked: false }, error: null })
        if (endpoint.startsWith('shelf?book_id=')) {
          shelfGetCount++
          return Promise.resolve({ data: { success: true, shelf: shelfGetCount === 1 ? 'read' : null }, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })
      await typeAndSearch('gatsby')

      await act(async () => {
        fireEvent.click(screen.getAllByText('The Great Gatsby')[0])
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /shelf: read/i })).toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByText('1984'))
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument()
    })
  })

  describe('"More by this author" section', () => {
    async function renderAndSelectWithAuthorBooks() {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q=')) return Promise.resolve({ data: [mockSearchResult], error: null })
        if (endpoint === 'book') return Promise.resolve({ data: mockRegisteredBook, error: null })
        return Promise.resolve({ data: null, error: null })
      })
      mockGetVolume.mockResolvedValue(mockVolumeInfo)
      mockGetAuthor.mockResolvedValue(mockKGPerson)
      mockSearchVolumes.mockResolvedValue([mockAuthorBook])
      await typeAndSearch('gatsby')
      await act(async () => {
        fireEvent.click(screen.getByText('The Great Gatsby'))
        await vi.advanceTimersByTimeAsync(500)
      })
    }

    it('renders the "More by" section when searchVolumes returns books', async () => {
      await renderAndSelectWithAuthorBooks()
      expect(screen.getByText(/more by/i)).toBeInTheDocument()
    })

    it('shows the related book title in the carousel', async () => {
      await renderAndSelectWithAuthorBooks()
      expect(screen.getByText('Tender Is the Night')).toBeInTheDocument()
    })

    it('clicking a related book selects it', async () => {
      await renderAndSelectWithAuthorBooks()
      await act(async () => {
        fireEvent.click(screen.getByText('Tender Is the Night'))
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'book',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ title: 'Tender Is the Night' }),
        })
      )
    })
  })

  describe('Infinite scroll and back-to-top', () => {
    function makeBooks(n: number): Book[] {
      return Array.from({ length: n }, (_, i) => ({
        title: `Book ${i + 1}`,
        author: 'Some Author',
        external_google_id: `book-id-${i}`,
      }))
    }

    it('loads next page when scroll fires near the bottom', async () => {
      await renderAndWait()
      mockSupabase.functions.invoke.mockImplementation((endpoint: string) => {
        if (endpoint.includes('book?q='))
          return Promise.resolve({ data: { books: makeBooks(12), total: 24 }, error: null })
        return Promise.resolve({ data: [], error: null })
      })

      await typeAndSearch('fantasy')

      // In jsdom scrollHeight=0, innerHeight=768 → distanceFromBottom=-768 < 400, always triggers
      await act(async () => {
        fireEvent.scroll(window)
        await vi.advanceTimersByTimeAsync(0)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('offset=12'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('calls window.scrollTo when back-to-top button is clicked', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      await renderAndWait()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /back to top/i }))
      })

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      scrollToSpy.mockRestore()
    })

    it('shows back-to-top button as visible after scrolling past 400px', async () => {
      await renderAndWait()

      Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
      await act(async () => { fireEvent.scroll(window) })

      expect(screen.getByRole('button', { name: /back to top/i })).toHaveClass('opacity-100')

      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    })
  })
})

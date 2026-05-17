import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookSearchInput from '../../components/BookSearchInput'
import { mockBook } from '../utils/mocks'

const mockInvoke = vi.fn()
vi.mock('../../supabase', () => ({
  invokeFunction: (...args: unknown[]) => mockInvoke(...args),
}))

const mockSearchResults = [
  { id: undefined, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, external_google_id: 'abc123', image_url: 'https://example.com/hobbit.jpg' },
  { id: undefined, title: 'Fellowship of the Ring', author: 'J.R.R. Tolkien', year: 1954, external_google_id: 'def456' },
]
const mockRegisteredBook = { id: 7, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937 }

// Fire a change event on the search input and advance through the 400ms debounce.
// Uses fireEvent (synchronous) to avoid userEvent's keystroke-delay timers conflicting
// with fake timers, then flushes via act so the async invokeFunction promise settles.
const triggerSearch = async (query: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: query } })
  await act(async () => { vi.advanceTimersByTime(400) })
}

describe('BookSearchInput', () => {
  const defaultProps = { onSelect: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should show search input when no initialBook', () => {
      render(<BookSearchInput {...defaultProps} />)
      expect(screen.getByRole('textbox', { name: /search for a book/i })).toBeInTheDocument()
    })

    it('should show selected book display when initialBook is provided', () => {
      render(<BookSearchInput {...defaultProps} initialBook={mockBook} />)
      expect(screen.getByText(mockBook.title)).toBeInTheDocument()
      expect(screen.getByText(mockBook.author)).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should show clear button when book is selected', () => {
      render(<BookSearchInput {...defaultProps} initialBook={mockBook} />)
      expect(screen.getByRole('button', { name: /clear book selection/i })).toBeInTheDocument()
    })

    it('should show book cover image when initialBook has image_url', () => {
      const bookWithImage = { ...mockBook, image_url: 'https://example.com/cover.jpg' }
      render(<BookSearchInput {...defaultProps} initialBook={bookWithImage} />)
      expect(screen.getByRole('img', { name: mockBook.title })).toHaveAttribute('src', 'https://example.com/cover.jpg')
    })

    it('should hide clear button when disabled', () => {
      render(<BookSearchInput {...defaultProps} initialBook={mockBook} disabled />)
      expect(screen.queryByRole('button', { name: /clear book selection/i })).not.toBeInTheDocument()
    })
  })

  describe('Search Behavior', () => {
    it('should call GET /book with query param after debounce', async () => {
      mockInvoke.mockResolvedValue({ data: mockSearchResults, error: null })
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('Tolkien')

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.stringContaining('book?q='),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should not search when query is empty or whitespace', async () => {
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('   ')

      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('should show results in dropdown after successful search', async () => {
      mockInvoke.mockResolvedValue({ data: mockSearchResults, error: null })
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('Tolkien')

      expect(screen.getByText('The Hobbit')).toBeInTheDocument()
      expect(screen.getByText('Fellowship of the Ring')).toBeInTheDocument()
    })

    it('should show "No books found" when search returns empty', async () => {
      mockInvoke.mockResolvedValue({ data: [], error: null })
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('xyznotabook')

      expect(screen.getByText(/no books found/i)).toBeInTheDocument()
    })

    it('should show error when search fails', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Search failed') })
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('Tolkien')

      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument()
    })

    it('should handle wrapped { books: [] } response format', async () => {
      mockInvoke.mockResolvedValue({ data: { books: mockSearchResults }, error: null })
      render(<BookSearchInput {...defaultProps} />)

      await triggerSearch('Tolkien')

      expect(screen.getByText('The Hobbit')).toBeInTheDocument()
    })
  })

  describe('Book Selection', () => {
    const setupWithResults = async () => {
      mockInvoke
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: mockRegisteredBook, error: null })
      render(<BookSearchInput {...defaultProps} />)
      await triggerSearch('Tolkien')
    }

    it('should show selected book immediately after clicking a result (optimistic)', async () => {
      await setupWithResults()

      await act(async () => {
        fireEvent.click(screen.getByText('The Hobbit'))
      })

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should call onSelect with registered book id after POST /book', async () => {
      await setupWithResults()

      await act(async () => {
        fireEvent.click(screen.getByText('The Hobbit'))
      })

      expect(defaultProps.onSelect).toHaveBeenCalledWith(7, mockRegisteredBook)
    })

    it('should POST to /book with correct method on selection', async () => {
      await setupWithResults()

      await act(async () => {
        fireEvent.click(screen.getByText('The Hobbit'))
      })

      expect(mockInvoke).toHaveBeenCalledWith(
        'book',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should show error and revert when POST /book fails with no id', async () => {
      mockInvoke
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('Registration failed') })
      render(<BookSearchInput {...defaultProps} />)
      await triggerSearch('Tolkien')

      await act(async () => {
        fireEvent.click(screen.getByText('The Hobbit'))
      })

      expect(screen.getByText('Failed to register book. Please try again.')).toBeInTheDocument()
    })
  })

  describe('Clear Behavior', () => {
    it('should reset to search input when clear button is clicked', () => {
      render(<BookSearchInput {...defaultProps} initialBook={mockBook} />)
      fireEvent.click(screen.getByRole('button', { name: /clear book selection/i }))
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should not call onSelect when cleared', () => {
      render(<BookSearchInput {...defaultProps} initialBook={mockBook} />)
      fireEvent.click(screen.getByRole('button', { name: /clear book selection/i }))
      expect(defaultProps.onSelect).not.toHaveBeenCalled()
    })
  })
})

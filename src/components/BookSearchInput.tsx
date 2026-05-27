import { useState, useEffect, useRef, useCallback } from 'react'
import { invokeFunction } from '../supabase'
import type { Book } from '../types'
import KluvsSpinner from './KluvsSpinner'

interface BookSearchInputProps {
  onSelect: (bookId: number, book: Book) => void
  initialBook?: Book | null
  disabled?: boolean
}

export default function BookSearchInput({ onSelect, initialBook, disabled }: BookSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Book[]>([])
  const [searching, setSearching] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(initialBook ?? null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchError, setSearchError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      const { data, error } = await invokeFunction<Book[] | { books?: Book[] }>(`book?q=${encodeURIComponent(q.trim())}`, {
        method: 'GET',
      })
      if (error) throw error
      const books = Array.isArray(data) ? data : (data as { books?: Book[] })?.books ?? []
      setResults(books)
      setShowDropdown(true)
    } catch {
      setSearchError('Search failed. Please try again.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setSearchError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleSelect = async (book: Book) => {
    setShowDropdown(false)
    setQuery('')
    setSearchError('')
    // Show the book immediately so the UI responds right away
    setSelectedBook(book)
    setRegistering(true)
    try {
      const { data, error } = await invokeFunction<Book | { book?: Book }>('book', {
        method: 'POST',
        body: {
          title: book.title,
          author: book.author,
          year: book.year,
          isbn: book.isbn,
          image_url: book.image_url,
          external_google_id: book.external_google_id,
        },
      })
      if (error) throw error
      const registered = (data && 'title' in data ? data : (data as { book?: Book })?.book) as Book
      const finalBook = registered ?? book
      setSelectedBook(finalBook)
      onSelect(finalBook.id!, finalBook)
    } catch {
      // If the book already has an id (came pre-registered), still use it
      if (book.id != null) {
        onSelect(book.id, book)
      } else {
        setSelectedBook(null)
        setSearchError('Failed to register book. Please try again.')
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleClear = () => {
    setSelectedBook(null)
    setQuery('')
    setResults([])
  }

  const isDisabled = disabled || registering

  return (
    <div ref={containerRef} className="relative">
      {selectedBook ? (
        <div className="flex items-center gap-3 bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3">
          {selectedBook.image_url && (
            <img
              src={selectedBook.image_url}
              alt={selectedBook.title}
              className="h-12 w-8 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-text-primary)] font-medium truncate">{selectedBook.title}</p>
            <p className="text-[var(--color-text-secondary)] text-sm truncate">{selectedBook.author}</p>
          </div>
          {!isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
              aria-label="Clear book selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search by title or author..."
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-10"
            disabled={isDisabled}
            aria-label="Search for a book"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
            {searching || registering ? (
              <KluvsSpinner size={16} aria-label="Searching" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {searchError && (
        <p className="text-red-500 text-xs mt-1">{searchError}</p>
      )}

      {showDropdown && results.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-[var(--color-bg-raised)] border border-[var(--color-divider)] rounded-card shadow-lg max-h-72 overflow-y-auto"
          role="listbox"
          aria-label="Book search results"
        >
          {results.map((book, i) => (
            <li key={book.external_google_id ?? i}>
              <button
                type="button"
                onClick={() => handleSelect(book)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-elevated)] transition-colors text-left"
                role="option"
                aria-selected={false}
              >
                {book.image_url ? (
                  <img
                    src={book.image_url}
                    alt={book.title}
                    className="h-12 w-8 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-8 bg-[var(--color-bg-elevated)] rounded flex-shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text-primary)] font-medium truncate">{book.title}</p>
                  <p className="text-[var(--color-text-secondary)] text-sm truncate">{book.author}</p>
                  {book.year && (
                    <p className="text-[var(--color-text-secondary)] text-xs">{book.year}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && !searching && results.length === 0 && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--color-bg-raised)] border border-[var(--color-divider)] rounded-card shadow-lg px-4 py-3">
          <p className="text-[var(--color-text-secondary)] text-sm">No books found for "{query}"</p>
        </div>
      )}
    </div>
  )
}

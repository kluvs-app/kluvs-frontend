import { useState, useRef, useCallback } from 'react'
import { invokeFunction } from '../supabase'
import type { Book } from '../types'

const MS = "0 -960 960 960"

const BOOK_SVG_PATH = "M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z"

function BookPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-[var(--color-bg-elevated)] rounded flex items-center justify-center flex-shrink-0 ${className}`}>
      <svg className="w-1/2 h-1/2 text-[var(--color-text-secondary)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
  )
}

export default function BooksPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Book[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [upserting, setUpserting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    setSearchError('')
    try {
      const { data, error } = await invokeFunction<Book[] | { books?: Book[] }>(
        `book?q=${encodeURIComponent(q.trim())}`,
        { method: 'GET' }
      )
      if (error) throw error
      const books = Array.isArray(data) ? data : (data as { books?: Book[] })?.books ?? []
      setResults(books)
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
    setSelectedBook(book)
    setUpserting(true)
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
      if (registered) setSelectedBook(registered)
    } catch {
      // Keep selected book displayed even if upsert fails
    } finally {
      setUpserting(false)
    }
  }

  const metaFields = selectedBook
    ? [
        { label: 'Year',    value: selectedBook.year?.toString() },
        { label: 'Pages',   value: selectedBook.page_count?.toString() },
        { label: 'ISBN',    value: selectedBook.isbn, mono: true as const },
        { label: 'Edition', value: selectedBook.edition },
      ].filter(m => m.value)
    : []

  return (
    <div className="flex lg:h-screen lg:overflow-hidden">

      {/* ── List panel ── */}
      <div className={`flex flex-col w-full lg:w-80 lg:shrink-0 lg:border-r lg:border-[var(--color-divider)] lg:overflow-y-auto ${selectedBook ? 'hidden lg:flex' : 'flex'}`}>

        {/* Search header */}
        <div className="px-4 pt-6 pb-4 border-b border-[var(--color-divider)]">
          <h1 className="text-page-heading font-serif font-bold text-[var(--color-text-primary)] mb-3">
            Books
          </h1>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by title or author…"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              aria-label="Search for a book"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {searching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" aria-label="Searching" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
          {searchError && <p className="text-red-500 text-xs mt-1.5">{searchError}</p>}
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--color-text-secondary)] opacity-40" viewBox={MS} fill="currentColor">
                  <path d={BOOK_SVG_PATH} />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">Search for a book to get started</p>
            </div>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <p className="px-4 py-6 text-sm text-[var(--color-text-secondary)] italic">
              No books found for "{query}"
            </p>
          )}

          {results.map((book, i) => {
            const isActive = !!selectedBook?.external_google_id &&
              selectedBook.external_google_id === book.external_google_id
            return (
              <button
                key={book.external_google_id ?? i}
                onClick={() => handleSelect(book)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--color-divider)] last:border-b-0 transition-colors text-left ${
                  isActive
                    ? 'bg-primary/[0.07] shadow-[inset_3px_0_0_#D16D30]'
                    : 'hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                {book.image_url ? (
                  <img src={book.image_url} alt="" className="h-14 w-10 object-cover rounded flex-shrink-0" />
                ) : (
                  <BookPlaceholder className="h-14 w-10" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate leading-tight ${isActive ? 'text-primary' : 'text-[var(--color-text-primary)]'}`}>
                    {book.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{book.author}</p>
                  {book.year && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{book.year}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div className={`flex-1 lg:overflow-y-auto ${selectedBook ? 'block' : 'hidden lg:block'}`}>
        {selectedBook ? (
          <div className="px-6 py-6">
            {/* Mobile back */}
            <button
              onClick={() => setSelectedBook(null)}
              className="lg:hidden inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Results
            </button>

            {upserting && (
              <div className="flex items-center gap-2 mb-4 text-sm text-[var(--color-text-secondary)]">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary border-t-transparent" />
                Saving…
              </div>
            )}

            {/* Cover + title block */}
            <div className="flex gap-5 mb-6">
              {selectedBook.image_url ? (
                <img
                  src={selectedBook.image_url}
                  alt={selectedBook.title}
                  className="h-40 w-28 object-cover rounded-lg shadow-md flex-shrink-0"
                />
              ) : (
                <BookPlaceholder className="h-40 w-28 rounded-lg" />
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)] leading-snug">
                  {selectedBook.title}
                </h2>
                <p className="text-base text-[var(--color-text-secondary)] mt-1">{selectedBook.author}</p>
                {selectedBook.id != null && (
                  <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    In library
                  </span>
                )}
              </div>
            </div>

            {/* Metadata tiles */}
            {metaFields.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {metaFields.map(({ label, value, mono }) => (
                  <div key={label} className="bg-[var(--color-bg-elevated)] rounded-card px-4 py-3">
                    <p className="text-xs text-[var(--color-text-secondary)] mb-0.5">{label}</p>
                    <p className={`text-sm font-medium text-[var(--color-text-primary)] ${mono ? 'font-mono' : ''}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop-only empty state */
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-8">
            <div className="h-16 w-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-text-secondary)] opacity-40" viewBox={MS} fill="currentColor">
                <path d={BOOK_SVG_PATH} />
              </svg>
            </div>
            <p className="font-medium text-[var(--color-text-primary)]">Select a book</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Search above and pick a title to see details
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

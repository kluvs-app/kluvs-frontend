import { useState, useRef, useCallback } from 'react'
import { invokeFunction } from '../supabase'
import {
  getVolume,
  getAuthor,
  bestCoverUrl,
  extractYear,
  stripHtml,
  preferredIsbn,
  displayLanguage,
  formatRatingCount,
  type GBVolumeInfo,
  type KGPerson,
} from '../services/googleBooks'
import type { Book } from '../types'
import KluvsSpinner from '../components/KluvsSpinner'

// ── Sub-components ────────────────────────────────────────────────────────────

function Cover({ url, title, className }: { url?: string; title: string; className?: string }) {
  if (url) return <img src={url} alt={title} className={`object-cover rounded-xl shadow-lg ${className}`} />
  return (
    <div className={`bg-[var(--color-bg-elevated)] rounded-xl flex items-center justify-center ${className}`}>
      <svg className="w-1/3 h-1/3 text-[var(--color-text-secondary)] opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    </div>
  )
}

function StarRating({ value, count }: { value: number; count?: number }) {
  const filled = Math.round(value)
  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-base leading-none tracking-tight">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? 'text-primary' : 'text-[var(--color-text-secondary)] opacity-30'}>★</span>
        ))}
      </span>
      <span className="text-sm text-[var(--color-text-secondary)]">
        {value.toFixed(1)}{count ? ` · ${formatRatingCount(count)} ratings` : ''}
      </span>
    </div>
  )
}

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-[var(--color-bg-elevated)] rounded animate-pulse ${className}`} />
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MS = "0 -960 960 960"
const BOOK_SVG_PATH = "M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<Book[]>([])
  const [searching, setSearching]       = useState(false)
  const [searchError, setSearchError]   = useState('')
  const [selectedBook, setSelectedBook]   = useState<Book | null>(null)
  const [volumeInfo, setVolumeInfo]       = useState<GBVolumeInfo | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [authorInfo, setAuthorInfo]       = useState<KGPerson | null>(null)
  const [loadingAuthor, setLoadingAuthor] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeId    = useRef<string | null>(null) // guards against stale detail responses

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

  const handleSelect = (book: Book) => {
    if (book.external_google_id && book.external_google_id === selectedBook?.external_google_id) return

    setSelectedBook(book)
    setVolumeInfo(null)
    setAuthorInfo(null)

    const id = book.external_google_id
    if (id) activeId.current = id

    // Fetch volume detail and author info in parallel
    if (id) {
      setLoadingDetail(true)
      getVolume(id).then(vi => {
        if (activeId.current !== id) return
        setVolumeInfo(vi)
        setLoadingDetail(false)
      })
    }

    if (book.author) {
      const primaryAuthor = book.author.split(/\s*(?:,|&| and )\s*/i)[0].trim()
      setLoadingAuthor(true)
      getAuthor(primaryAuthor).then(person => {
        if (id && activeId.current !== id) return
        setAuthorInfo(person)
        setLoadingAuthor(false)
      })
    }

    // Upsert to backend in the background (don't block the UI)
    invokeFunction<Book | { book?: Book }>('book', {
      method: 'POST',
      body: {
        title:              book.title,
        author:             book.author,
        year:               book.year,
        isbn:               book.isbn,
        image_url:          book.image_url,
        external_google_id: book.external_google_id,
      },
    }).then(({ data, error }) => {
      if (!error) {
        const saved = (data && 'title' in data ? data : (data as { book?: Book })?.book) as Book | undefined
        if (saved) setSelectedBook(saved)
      }
    }).catch(() => {})
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const vi          = volumeInfo
  const coverUrl    = bestCoverUrl(vi?.imageLinks, selectedBook?.image_url)
  const title       = selectedBook?.title ?? ''
  const subtitle    = vi?.subtitle
  const authors     = vi?.authors?.join(', ') ?? selectedBook?.author ?? ''
  const year        = extractYear(vi?.publishedDate, selectedBook?.year)
  const pages       = (vi?.pageCount ?? selectedBook?.page_count)?.toLocaleString()
  const publisher   = vi?.publisher ?? selectedBook?.publisher
  const isbn        = preferredIsbn(vi?.industryIdentifiers) ?? selectedBook?.isbn
  const language    = displayLanguage(vi?.language) ?? selectedBook?.language
  const edition     = selectedBook?.edition
  const description = vi?.description ? stripHtml(vi.description) : selectedBook?.description
  const categories  = (vi?.categories ?? selectedBook?.categories ?? []).slice(0, 5)
  const rating      = vi?.averageRating
  const ratingCount = vi?.ratingsCount

  const metaRows = [
    { label: 'Published', value: year },
    { label: 'Pages',     value: pages },
    { label: 'Publisher', value: publisher },
    { label: 'ISBN',      value: isbn, mono: true as const },
    { label: 'Language',  value: language },
    { label: 'Edition',   value: edition },
  ].filter(m => m.value)

  return (
    <div className="flex lg:h-screen lg:overflow-hidden">

      {/* ── List panel ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-col w-full lg:w-80 lg:shrink-0 lg:border-r lg:border-[var(--color-divider)] lg:overflow-y-auto ${selectedBook ? 'hidden lg:flex' : 'flex'}`}>

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
                <KluvsSpinner size={16} aria-label="Searching" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
          {searchError && <p className="text-red-500 text-xs mt-1.5">{searchError}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-[var(--color-text-secondary)] opacity-40" viewBox={MS} fill="currentColor">
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
                  <div className="h-14 w-10 rounded bg-[var(--color-bg-elevated)] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate leading-tight ${isActive ? 'text-primary' : 'text-[var(--color-text-primary)]'}`}>
                    {book.title}
                  </p>
                  {book.author && <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{book.author}</p>}
                  {book.year   && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{book.year}</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      <div className={`flex-1 lg:overflow-y-auto ${selectedBook ? 'block' : 'hidden lg:block'}`}>
        {selectedBook ? (
          <div className="px-6 py-6 lg:px-10 lg:py-10">

            {/* Mobile back */}
            <button
              onClick={() => setSelectedBook(null)}
              className="lg:hidden inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Results
            </button>

            {/* ── Hero: cover + identity ────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-8 lg:gap-10 mb-10">

              <Cover
                url={coverUrl}
                title={title}
                className="w-36 h-52 sm:w-44 sm:h-64 lg:w-52 lg:h-[312px] self-start shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h2 className="text-3xl lg:text-4xl font-serif font-bold italic text-[var(--color-text-primary)] leading-tight">
                  {title}
                </h2>

                {subtitle && (
                  <p className="text-lg text-[var(--color-text-secondary)] mt-1 font-serif leading-snug">
                    {subtitle}
                  </p>
                )}

                <p className={`text-lg font-medium text-[var(--color-text-secondary)] ${subtitle ? 'mt-3' : 'mt-2'}`}>
                  {loadingDetail && !vi?.authors
                    ? <Shimmer className="h-5 w-48 inline-block" />
                    : authors
                  }
                </p>

                {(year || pages || publisher) && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    {[year, pages && `${pages} pages`, publisher].filter(Boolean).join(' · ')}
                  </p>
                )}

                {rating != null && <StarRating value={rating} count={ratingCount} />}

                {loadingDetail && categories.length === 0 ? (
                  <div className="flex gap-2 mt-4">
                    <Shimmer className="h-6 w-20 rounded-full" />
                    <Shimmer className="h-6 w-16 rounded-full" />
                    <Shimmer className="h-6 w-24 rounded-full" />
                  </div>
                ) : categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {categories.map(c => (
                      <span key={c} className="px-3 py-1 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] text-xs text-[var(--color-text-secondary)]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── About ────────────────────────────────────────────────────── */}
            <section className="mb-10">
              <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                About
              </p>
              {loadingDetail && !description ? (
                <div className="space-y-2">
                  {[100, 90, 95, 85, 70].map(w => (
                    <Shimmer key={w} className={`h-4`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : description ? (
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)] italic">No description available.</p>
              )}
            </section>

            {/* ── Details ──────────────────────────────────────────────────── */}
            {(metaRows.length > 0 || loadingDetail) && (
              <section className="mb-8">
                <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  Details
                </p>
                {loadingDetail && metaRows.length === 0 ? (
                  <div className="divide-y divide-[var(--color-divider)]">
                    {[40, 28, 48, 64].map(w => (
                      <div key={w} className="flex gap-6 py-3">
                        <Shimmer className="h-4 w-24 shrink-0" />
                        <Shimmer className={`h-4 w-${w}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <dl className="divide-y divide-[var(--color-divider)]">
                    {metaRows.map(({ label, value, mono }) => (
                      <div key={label} className="flex gap-6 py-3">
                        <dt className="text-sm text-[var(--color-text-secondary)] w-24 shrink-0">{label}</dt>
                        <dd className={`text-sm text-[var(--color-text-primary)] font-medium ${mono ? 'font-mono' : ''}`}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            )}

            {/* ── About the Author ─────────────────────────────────────────── */}
            {(loadingAuthor || authorInfo) && (
              <>
                <hr className="border-[var(--color-divider)] mb-8" />
                <section>
                  <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                    About the Author
                  </p>
                  {loadingAuthor && !authorInfo ? (
                    <div className="flex gap-4">
                      <Shimmer className="h-16 w-16 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <Shimmer className="h-3.5 w-32" />
                        <Shimmer className="h-3.5 w-full" />
                        <Shimmer className="h-3.5 w-5/6" />
                        <Shimmer className="h-3.5 w-4/6" />
                      </div>
                    </div>
                  ) : authorInfo && (
                    <div className="flex gap-4">
                      {authorInfo.image?.contentUrl && (
                        <img
                          src={authorInfo.image.contentUrl}
                          alt={authorInfo.name ?? ''}
                          className="h-16 w-16 rounded-full object-cover shrink-0"
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {authorInfo.name && (
                          <p className="text-base font-serif font-bold text-[var(--color-text-primary)] mb-1">
                            {authorInfo.name}
                          </p>
                        )}
                        {authorInfo.description && (
                          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wide">
                            {authorInfo.description}
                          </p>
                        )}
                        {authorInfo.detailedDescription?.articleBody && (
                          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                            {authorInfo.detailedDescription.articleBody}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

          </div>
        ) : (
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

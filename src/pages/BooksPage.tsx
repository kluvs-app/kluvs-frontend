import { useState, useRef, useCallback, Fragment } from 'react'
import { invokeFunction } from '../supabase'
import {
  getVolume,
  getAuthor,
  bestCoverUrl,
  extractYear,
  stripHtml,
  preferredIsbn,
  displayLanguage,
  type GBVolumeInfo,
  type KGPerson,
} from '../services/googleBooks'
import type { Book } from '../types'
import KluvsSpinner from '../components/KluvsSpinner'

// ── Sub-components ────────────────────────────────────────────────────────────

function Cover({ url, title, className }: { url?: string | null; title: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !url || failed
  return (
    <div
      className={`rounded-sm overflow-hidden shrink-0 relative flex items-end justify-center ${className}`}
      style={showPlaceholder ? {
        background: 'repeating-linear-gradient(135deg, var(--color-bg-elevated) 0, var(--color-bg-elevated) 5px, var(--color-divider) 5px, var(--color-divider) 10px)',
        boxShadow: '0 3px 8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.02)',
      } : {
        boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
      }}
    >
      {!showPlaceholder && (
        <img
          src={url!}
          alt={title}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {showPlaceholder && (
        <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--color-text-meta)] pb-1.5 opacity-70 relative z-10">
          cover
        </span>
      )}
    </div>
  )
}

function StackedCoverPlaceholder({ size }: { size: 'sm' | 'lg' }) {
  const sm = size === 'sm'
  const w = sm ? 62 : 112
  const h = sm ? 88 : 160
  const containerW = sm ? 110 : 220
  const containerH = sm ? 110 : 200
  const covers = sm
    ? [{ tilt: -6, x: -22, y: 2, z: 1 }, { tilt: 3, x: 0, y: -2, z: 2 }, { tilt: 9, x: 22, y: 2, z: 3 }]
    : [{ tilt: -7, x: -46, y: 4, z: 1 }, { tilt: 4, x: 0, y: -4, z: 2 }, { tilt: 10, x: 46, y: 4, z: 3 }]
  return (
    <div style={{ position: 'relative', width: containerW, height: containerH, flexShrink: 0 }}>
      {covers.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: c.z,
        }}>
          <div style={{
            width: w, height: h, borderRadius: 2, overflow: 'hidden',
            transform: `translate(${c.x}px, ${c.y}px) rotate(${c.tilt}deg)`,
            transformOrigin: 'center center',
            boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)',
            background: 'repeating-linear-gradient(135deg, var(--color-bg-elevated) 0, var(--color-bg-elevated) 5px, var(--color-divider) 5px, var(--color-divider) 10px)',
          }} />
        </div>
      ))}
    </div>
  )
}


function MetaDot() {
  return <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-meta)] shrink-0 inline-block" />
}

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-[var(--color-bg-elevated)] rounded animate-pulse ${className}`} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<Book[]>([])
  const [searching, setSearching]       = useState(false)
  const [searchError, setSearchError]   = useState('')
  const [selectedBook, setSelectedBook]   = useState<Book | null>(null)
  const [volumeInfo, setVolumeInfo]       = useState<GBVolumeInfo | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [authorInfo, setAuthorInfo]         = useState<KGPerson | null>(null)
  const [loadingAuthor, setLoadingAuthor]   = useState(false)
  const [authorPhotoFailed, setAuthorPhotoFailed] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeId    = useRef<string | null>(null)

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
    setAuthorPhotoFailed(false)

    const id = book.external_google_id
    if (id) activeId.current = id

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

    invokeFunction<Book | { book?: Book }>('book', {
      method: 'POST',
      body: {
        title:              book.title,
        author:             book.author,
        year:               book.year,
        isbn:               book.isbn,
        image_url:          book.image_url,
        external_google_id: book.external_google_id,
        edition:            book.edition,
        page_count:         book.page_count,
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

  const metaItems = [year, pages && `${pages} pages`, publisher].filter((v): v is string => !!v)

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
      <div className={`flex flex-col w-full lg:w-[22%] lg:min-w-[280px] lg:max-w-[420px] lg:shrink-0 lg:border-r lg:border-[var(--color-divider)] lg:overflow-y-auto ${selectedBook ? 'hidden lg:flex' : 'flex'}`}>

        <div className="px-[22px] pt-[28px] pb-[22px] border-b border-[var(--color-divider)]">
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-[10px]">
            Library
          </span>
          <h1 className="font-serif font-medium text-[38px] leading-none tracking-[-0.02em] text-[var(--color-text-primary)] mb-[22px]">
            Books
          </h1>
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by title or author…"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-2.5 pr-10 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              aria-label="Search for a book"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-primary transition-colors">
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
            <div className="flex flex-col items-center justify-center py-10 px-8 text-center gap-6">
              <StackedCoverPlaceholder size="sm" />
              <div>
                <p className="font-serif italic font-medium text-[24px] leading-none tracking-[-0.008em] text-[var(--color-text-secondary)] mb-[10px]">
                  Start typing.
                </p>
                <p className="text-[12px] text-[var(--color-text-meta)] leading-[1.5] max-w-[220px] mx-auto">
                  Find a book by title or author. We'll pull the cover, the blurb, and a note on the author.
                </p>
              </div>
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
                className={`relative w-full flex items-center gap-3.5 px-[22px] py-[14px] border-b border-[var(--color-divider)] last:border-b-0 transition-colors text-left ${
                  isActive
                    ? 'bg-primary/[0.06]'
                    : 'hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                )}
                <Cover
                  url={book.image_url}
                  title={book.title}
                  className="w-[42px] h-[60px]"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-serif italic font-medium text-[18px] leading-[1.15] tracking-[-0.008em] truncate ${isActive ? 'text-primary' : 'text-[var(--color-text-primary)]'}`}>
                    {book.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    {book.author && (
                      <span className="text-[12px] text-[var(--color-text-secondary)] truncate flex-1 min-w-0">
                        {book.author}
                      </span>
                    )}
                    {book.year && (
                      <span className={`text-[10px] font-medium uppercase tracking-[0.14em] shrink-0 ${isActive ? 'text-primary' : 'text-[var(--color-text-secondary)]'}`}>
                        {book.year}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      <div className={`flex-1 lg:overflow-y-auto ${selectedBook ? 'block' : 'hidden lg:block'}`}>
        {selectedBook ? (
          <div className="px-[22px] pt-6 pb-12 lg:px-[56px] lg:pt-[40px] lg:pb-[64px]">
            <div className="max-w-[1300px] mx-auto">

              {/* Mobile back */}
              <button
                onClick={() => setSelectedBook(null)}
                className="lg:hidden inline-flex items-center gap-1.5 text-[13px] text-primary font-medium mb-6"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Results
              </button>

              {/* ── Hero: cover + identity ──────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-[18px] sm:gap-[40px] mb-[44px]">

                <Cover
                  url={coverUrl}
                  title={title}
                  className="w-[108px] h-[158px] sm:w-[148px] sm:h-[214px] lg:w-[188px] lg:h-[272px] self-start"
                />

                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-[14px]">
                    Book
                  </span>

                  <h2 className="font-serif italic font-medium text-[30px] sm:text-[38px] lg:text-[44px] xl:text-[56px] leading-none tracking-[-0.018em] text-[var(--color-text-primary)] text-pretty">
                    {title}
                  </h2>

                  {subtitle && (
                    <p className="font-serif font-normal text-[19px] leading-[1.3] text-[var(--color-text-secondary)] mt-2 max-w-[460px]">
                      {subtitle}
                    </p>
                  )}

                  <p className="text-[16px] font-medium text-[var(--color-text-secondary)] tracking-[0.005em] mt-[18px]">
                    {loadingDetail && !vi?.authors
                      ? <Shimmer className="h-5 w-48 inline-block" />
                      : authors
                    }
                  </p>

                  {/* Meta row — dot-separated eyebrows */}
                  {metaItems.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap mt-[18px]">
                      {metaItems.map((item, i) => (
                        <Fragment key={i}>
                          {i > 0 && <MetaDot />}
                          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                            {item}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  )}

                  {/* Categories */}
                  {loadingDetail && categories.length === 0 ? (
                    <div className="flex gap-2 mt-[22px]">
                      <Shimmer className="h-6 w-20 rounded-full" />
                      <Shimmer className="h-6 w-16 rounded-full" />
                      <Shimmer className="h-6 w-24 rounded-full" />
                    </div>
                  ) : categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-[22px]">
                      {categories.map(c => (
                        <span key={c} className="px-[11px] py-[5px] rounded-full border border-[var(--color-divider)] text-[11px] font-medium tracking-[0.04em] text-[var(--color-text-secondary)] whitespace-nowrap">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-[var(--color-divider)] mb-9" />

              {/* ── Details | About ──────────────────────────────────────────── */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 mb-10">

                {/* Details — left column */}
                {(metaRows.length > 0 || loadingDetail) && (
                  <section>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2">
                      Details
                    </span>
                    {loadingDetail && metaRows.length === 0 ? (
                      <div className="divide-y divide-[var(--color-divider)]">
                        {[160, 112, 192, 256].map(w => (
                          <div key={w} className="flex gap-6 py-[12px]">
                            <Shimmer className="h-4 shrink-0" style={{ width: 110 }} />
                            <Shimmer className="h-4" style={{ width: w }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <dl className="divide-y divide-[var(--color-divider)]">
                        {metaRows.map(({ label, value, mono }) => (
                          <div key={label} className="flex gap-6 py-[12px]">
                            <dt className="text-[13px] text-[var(--color-text-secondary)] shrink-0" style={{ width: 110 }}>
                              {label}
                            </dt>
                            <dd className={`text-[13px] text-[var(--color-text-primary)] font-medium tracking-[0.005em] ${mono ? 'font-mono tracking-[0.01em]' : ''}`}>
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </section>
                )}

                {/* About — right column */}
                <section className="mt-8 lg:mt-0">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-4">
                    About
                  </span>
                  {loadingDetail && !description ? (
                    <div className="space-y-2">
                      {[100, 90, 95, 85, 70].map(w => (
                        <Shimmer key={w} className="h-4" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ) : description ? (
                    <p className="text-[14px] text-[var(--color-text-primary)] leading-[1.7] tracking-[0.005em] whitespace-pre-line">
                      {description}
                    </p>
                  ) : (
                    <p className="text-[14px] text-[var(--color-text-secondary)] italic">No description available.</p>
                  )}
                </section>

              </div>

              {/* ── About the Author ─────────────────────────────────────────── */}
              {(loadingAuthor || authorInfo) && (
                <>
                  <hr className="border-[var(--color-divider)] mb-9" />
                  <section>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-[18px]">
                      About the Author
                    </span>
                    {loadingAuthor && !authorInfo ? (
                      <div className="flex gap-5">
                        <Shimmer className="h-[72px] w-[72px] rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                          <Shimmer className="h-3.5 w-32" />
                          <Shimmer className="h-3.5 w-full" />
                          <Shimmer className="h-3.5 w-5/6" />
                          <Shimmer className="h-3.5 w-4/6" />
                        </div>
                      </div>
                    ) : authorInfo && (
                      <div className="flex gap-5">
                        {authorInfo.image?.contentUrl && !authorPhotoFailed && (
                          <img
                            src={authorInfo.image.contentUrl}
                            alt={authorInfo.name ?? ''}
                            className="h-[72px] w-[72px] rounded-full object-cover shrink-0"
                            onError={() => setAuthorPhotoFailed(true)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          {authorInfo.name && (
                            <p className="font-serif font-medium text-[22px] leading-[1.1] tracking-[-0.008em] text-[var(--color-text-primary)]">
                              {authorInfo.name}
                            </p>
                          )}
                          {authorInfo.description && (
                            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mt-2 mb-[10px]">
                              {authorInfo.description}
                            </span>
                          )}
                          {authorInfo.detailedDescription?.articleBody && (
                            <p className="text-[13px] text-[var(--color-text-primary)] leading-[1.65] tracking-[0.005em] max-w-[65ch]">
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
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center px-8">
            <StackedCoverPlaceholder size="lg" />
            <p className="font-serif italic font-medium text-[38px] leading-none tracking-[-0.012em] text-[var(--color-text-primary)] mt-7 mb-[14px]">
              Pick a title.
            </p>
            <p className="text-[14px] text-[var(--color-text-secondary)] leading-[1.6] max-w-[320px]">
              Search any title or author from the panel on the left. Pick a result to see the blurb, the details, and a note on the author.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

import { useState, useRef, useCallback, useEffect, Fragment } from 'react'
import { invokeFunction } from '../supabase'
import { useMobileTopBar } from '../contexts/MobileTopBarContext'
import {
  getVolume,
  getAuthor,
  getWikipediaAuthorInfo,
  searchVolumes,
  bestCoverUrl,
  extractYear,
  stripHtml,
  preferredIsbn,
  displayLanguage,
  type GBVolumeInfo,
  type GBVolume,
  type KGPerson,
} from '../services/googleBooks'
import type { Book, LikeStatus, ShelfValue, ShelfStatus, ShelfEntry } from '../types'
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

// ── Shelf dropdown ────────────────────────────────────────────────────────────

const SHELF_OPTIONS: Array<{ value: ShelfValue | null; label: string }> = [
  { value: null,            label: 'None' },
  { value: 'want_to_read',  label: 'Want to Read' },
  { value: 'read',          label: 'Read' },
  { value: 'not_finished',  label: 'Not Finished' },
]

const SHELF_LABELS: Record<ShelfValue, string> = {
  want_to_read: 'Want to Read',
  read:         'Read',
  not_finished: 'Not Finished',
}

function ShelfButton({ shelf, onShelfChange, disabled }: {
  shelf: ShelfValue | null
  onShelfChange: (v: ShelfValue | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-label={shelf ? `Shelf: ${SHELF_LABELS[shelf]}` : 'Add to shelf'}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-btn border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          shelf
            ? 'border-primary text-primary'
            : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {/* Bookmark icon */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill={shelf ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {shelf && <span>{SHELF_LABELS[shelf]}</span>}
        {/* Chevron */}
        <svg
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select shelf"
          className="absolute top-full left-0 mt-1.5 z-20 min-w-[180px] py-1 rounded-xl border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] shadow-xl overflow-hidden"
        >
          {SHELF_OPTIONS.map(({ value, label }) => {
            const isActive = shelf === value
            return (
              <button
                key={label}
                role="option"
                aria-selected={isActive}
                onClick={() => { onShelfChange(value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                  isActive
                    ? 'text-primary bg-primary/[0.06]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Shelves panel ─────────────────────────────────────────────────────────────

const SHELF_SECTIONS: Array<{ value: ShelfValue; label: string }> = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'read',         label: 'Read' },
  { value: 'not_finished', label: 'Not Finished' },
]

function ShelvesPanel({
  entries,
  loading,
  error,
  selectedBook,
  onSelect,
  onGoToSearch,
}: {
  entries: ShelfEntry[]
  loading: boolean
  error: string
  selectedBook: Book | null
  onSelect: (book: Book) => void
  onGoToSearch: () => void
}) {
  if (loading) {
    return (
      <div className="px-[22px] py-6 space-y-8">
        {[1, 2].map(i => (
          <div key={i}>
            <Shimmer className="h-3 w-24 mb-4" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="shrink-0 flex flex-col gap-2">
                  <Shimmer className="w-[68px] h-[98px] rounded-sm" />
                  <Shimmer className="h-2.5 w-[52px]" />
                  <Shimmer className="h-2.5 w-[36px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="px-[22px] py-6 text-sm text-[var(--color-text-secondary)] italic">{error}</p>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-8 text-center gap-6">
        <StackedCoverPlaceholder size="sm" />
        <div className="flex flex-col items-center gap-4">
          <div>
            <p className="font-serif italic font-medium text-[24px] leading-none tracking-[-0.008em] text-[var(--color-text-secondary)] mb-[10px]">
              Nothing shelved yet.
            </p>
            <p className="text-[12px] text-[var(--color-text-meta)] leading-[1.5] max-w-[200px] mx-auto">
              Save books as you find them — they'll live here by shelf.
            </p>
          </div>
          <button
            onClick={onGoToSearch}
            className="text-sm font-medium px-4 py-2 rounded-btn bg-primary hover:bg-primary-hover text-white transition-colors"
          >
            Search for a book
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-5 space-y-7">
      {SHELF_SECTIONS.map(({ value, label }) => {
        const books = entries.filter(e => e.shelf === value).map(e => e.book)
        if (!books.length) return null
        return (
          <div key={value}>
            <div className="flex items-baseline gap-2 px-[22px] mb-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                {label}
              </span>
              <span className="text-[10px] text-[var(--color-text-meta)] tabular-nums">{books.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 px-[22px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {books.map(book => {
                const isActive = !!selectedBook?.id && book.id === selectedBook.id
                return (
                  <button
                    key={book.id ?? book.title}
                    onClick={() => onSelect(book)}
                    className="shrink-0 w-[68px] text-left group"
                  >
                    <div className={`mb-[7px] rounded-sm overflow-hidden transition-all ${
                      isActive
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-[var(--color-bg)]'
                        : 'group-hover:opacity-75'
                    }`}>
                      <Cover url={book.image_url} title={book.title} className="w-[68px] h-[98px]" />
                    </div>
                    <p className={`text-[11px] leading-[1.3] line-clamp-2 font-medium ${
                      isActive ? 'text-primary' : 'text-[var(--color-text-primary)]'
                    }`}>
                      {book.title}
                    </p>
                    {book.year && (
                      <p className="text-[10px] text-[var(--color-text-meta)] mt-0.5">{book.year}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
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
  const [wikipediaImage, setWikipediaImage]       = useState<string | null>(null)
  const [wikipediaExtract, setWikipediaExtract]   = useState<string | null>(null)
  const [authorBooks, setAuthorBooks]       = useState<GBVolume[]>([])
  const [loadingAuthorBooks, setLoadingAuthorBooks] = useState(false)
  const [liked, setLiked]           = useState(false)
  const [shelf, setShelf]           = useState<ShelfValue | null>(null)
  const [activeTab, setActiveTab]   = useState<'search' | 'shelves'>('search')
  const [shelvedBooks, setShelvedBooks]     = useState<ShelfEntry[]>([])
  const [loadingShelves, setLoadingShelves] = useState(false)
  const [shelvesError, setShelvesError]     = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeId    = useRef<string | null>(null)

  const { setTopBar, resetTopBar } = useMobileTopBar()
  useEffect(() => {
    if (selectedBook) {
      setTopBar({ title: selectedBook.title, backLabel: 'Books', onBack: () => setSelectedBook(null) })
    } else {
      resetTopBar()
    }
    return resetTopBar
  }, [selectedBook?.title, setTopBar, resetTopBar])

  // Fetch all shelved books when Shelves tab becomes active
  useEffect(() => {
    if (activeTab !== 'shelves') return
    setLoadingShelves(true)
    setShelvesError('')
    invokeFunction<ShelfEntry[] | { shelves?: ShelfEntry[] }>('shelf', { method: 'GET' })
      .then(({ data, error }) => {
        if (error) throw error
        const raw: any[] = Array.isArray(data) ? data : (data as any)?.shelves ?? []
        // Normalize both { shelf, book } and flat { shelf, ...bookFields } shapes
        const entries: ShelfEntry[] = raw.map(e =>
          e.book ? e : { shelf: e.shelf, book: e }
        )
        setShelvedBooks(entries)
      })
      .catch(() => setShelvesError('Could not load shelves.'))
      .finally(() => setLoadingShelves(false))
  }, [activeTab])

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
    setWikipediaImage(null)
    setWikipediaExtract(null)
    setAuthorBooks([])
    setLoadingAuthorBooks(false)
    setLiked(false)
    setShelf(null)

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
      Promise.all([
        getAuthor(primaryAuthor),
        getWikipediaAuthorInfo(primaryAuthor),
      ]).then(([person, wiki]) => {
        if (id && activeId.current !== id) return
        setAuthorInfo(person)
        setWikipediaImage(wiki.imageUrl)
        setWikipediaExtract(wiki.extract)
        setLoadingAuthor(false)
      })

      setLoadingAuthorBooks(true)
      searchVolumes(`inauthor:"${primaryAuthor}"`, 10).then(vols => {
        if (id && activeId.current !== id) return
        setAuthorBooks(vols.filter(v => v.id !== id))
        setLoadingAuthorBooks(false)
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
        if (saved) {
          setSelectedBook(saved)
          if (saved.id) {
            invokeFunction<{ success: boolean } & LikeStatus>('like?book_id=' + saved.id, { method: 'GET' })
              .then(({ data: likeData, error: likeError }) => {
                if (!likeError && likeData) {
                  setLiked(likeData.liked)
                }
              }).catch(() => {})
            invokeFunction<{ success: boolean } & ShelfStatus>('shelf?book_id=' + saved.id, { method: 'GET' })
              .then(({ data: shelfData, error: shelfError }) => {
                if (!shelfError && shelfData) {
                  setShelf(shelfData.shelf)
                }
              }).catch(() => {})
          }
        }
      }
    }).catch(() => {})
  }

  const handleToggleLike = () => {
    if (!selectedBook?.id) return
    const bookId = selectedBook.id
    const prevLiked = liked
    setLiked(!prevLiked)
    invokeFunction<{ success: boolean } & LikeStatus>('like', {
      method: 'POST',
      body: { book_id: bookId },
    }).then(({ data, error }) => {
      if (!error && data) {
        setLiked(data.liked)
      } else {
        setLiked(prevLiked)
      }
    }).catch(() => {
      setLiked(prevLiked)
    })
  }

  const handleShelfChange = (value: ShelfValue | null) => {
    if (!selectedBook?.id) return
    const bookId = selectedBook.id
    const prevShelf = shelf
    const prevShelvedBooks = shelvedBooks

    setShelf(value)

    // Optimistically sync the shelves panel
    if (value === null) {
      setShelvedBooks(prev => prev.filter(e => e.book.id !== bookId))
    } else {
      setShelvedBooks(prev => {
        const idx = prev.findIndex(e => e.book.id === bookId)
        const entry: ShelfEntry = { shelf: value, book: selectedBook }
        if (idx >= 0) return prev.map((e, i) => i === idx ? entry : e)
        return [...prev, entry]
      })
    }

    if (value === null) {
      invokeFunction<{ success: boolean } & ShelfStatus>('shelf?book_id=' + bookId, { method: 'DELETE' })
        .then(({ error }) => {
          if (error) { setShelf(prevShelf); setShelvedBooks(prevShelvedBooks) }
        }).catch(() => {
          setShelf(prevShelf)
          setShelvedBooks(prevShelvedBooks)
        })
    } else {
      invokeFunction<{ success: boolean } & ShelfStatus>('shelf', {
        method: 'POST',
        body: { book_id: bookId, shelf: value },
      }).then(({ data, error }) => {
        if (!error && data) {
          setShelf(data.shelf)
        } else {
          setShelf(prevShelf)
          setShelvedBooks(prevShelvedBooks)
        }
      }).catch(() => {
        setShelf(prevShelf)
        setShelvedBooks(prevShelvedBooks)
      })
    }
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

        {/* Header: eyebrow, title, tab bar */}
        <div className="px-[22px] pt-[28px] border-b border-[var(--color-divider)] shrink-0">
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-[10px]">
            Library
          </span>
          <h1 className="font-serif font-medium text-[38px] leading-none tracking-[-0.02em] text-[var(--color-text-primary)] mb-[18px]">
            Books
          </h1>

          {/* Tab bar — negative bottom margin overlaps the divider so active border sits flush */}
          <div className="flex -mb-px">
            {(['search', 'shelves'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-[13px] mr-5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab === 'search' ? 'Search' : 'Shelves'}
              </button>
            ))}
          </div>
        </div>

        {/* Search tab */}
        {activeTab === 'search' && (
          <>
            <div className="px-[22px] py-[18px] border-b border-[var(--color-divider)] shrink-0">
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
          </>
        )}

        {/* Shelves tab */}
        {activeTab === 'shelves' && (
          <div className="flex-1 overflow-y-auto">
            <ShelvesPanel
              entries={shelvedBooks}
              loading={loadingShelves}
              error={shelvesError}
              selectedBook={selectedBook}
              onSelect={handleSelect}
              onGoToSearch={() => setActiveTab('search')}
            />
          </div>
        )}
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 lg:overflow-y-auto ${selectedBook ? 'block' : 'hidden lg:block'}`}>
        {selectedBook ? (
          <div className="px-[22px] pt-6 pb-12 lg:px-[56px] lg:pt-[40px] lg:pb-[64px]">
            <div className="max-w-[1300px] mx-auto">

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

                  {/* Like + Shelf */}
                  <div className="mt-[22px] flex flex-wrap items-center gap-3">
                    <button
                      onClick={selectedBook?.id ? handleToggleLike : undefined}
                      disabled={!selectedBook?.id}
                      aria-label={liked ? 'Unlike this book' : 'Like this book'}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-btn border border-[var(--color-divider)] hover:border-[var(--color-text-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{liked ? '♥' : '♡'}</span>
                    </button>

                    <ShelfButton
                      shelf={shelf}
                      onShelfChange={handleShelfChange}
                      disabled={!selectedBook?.id}
                    />
                  </div>
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
                    <p className="text-[14px] text-[var(--color-text-primary)] leading-[1.7] tracking-[0.005em] whitespace-pre-line break-words">
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
                        {(wikipediaImage || authorInfo.image?.contentUrl) && !authorPhotoFailed && (
                          <img
                            src={wikipediaImage ?? authorInfo.image!.contentUrl!}
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
                          {(wikipediaExtract || authorInfo.detailedDescription?.articleBody) && (
                            <p className="text-[13px] text-[var(--color-text-primary)] leading-[1.65] tracking-[0.005em] max-w-[65ch]">
                              {wikipediaExtract ?? authorInfo.detailedDescription!.articleBody}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* ── More by this author ───────────────────────────────────────── */}
              {(loadingAuthorBooks || authorBooks.length > 0) && (
                <>
                  <hr className="border-[var(--color-divider)] my-9" />
                  <section>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-4">
                      More by {selectedBook?.author?.split(/\s*(?:,|&| and )\s*/i)[0]}
                    </span>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                      {loadingAuthorBooks && authorBooks.length === 0
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2 shrink-0 w-[96px]">
                              <Shimmer className="w-[96px] h-[138px] rounded-sm" />
                              <Shimmer className="h-3 w-4/5" />
                              <Shimmer className="h-3 w-1/2" />
                            </div>
                          ))
                        : authorBooks.map(vol => {
                            const vi = vol.volumeInfo
                            const coverUrl = bestCoverUrl(vi.imageLinks)
                            const year = extractYear(vi.publishedDate)
                            const book: Book = {
                              title: vi.title,
                              author: vi.authors?.join(', ') ?? '',
                              year: year ? parseInt(year) : undefined,
                              isbn: preferredIsbn(vi.industryIdentifiers),
                              image_url: coverUrl,
                              external_google_id: vol.id,
                              page_count: vi.pageCount,
                            }
                            return (
                              <button
                                key={vol.id}
                                onClick={() => handleSelect(book)}
                                className="flex flex-col gap-2 shrink-0 w-[96px] text-left group"
                              >
                                <Cover
                                  url={coverUrl}
                                  title={vi.title}
                                  className="w-[96px] h-[138px] group-hover:opacity-80 transition-opacity"
                                />
                                <p className="text-[12px] text-[var(--color-text-primary)] leading-[1.3] line-clamp-2 font-medium">
                                  {vi.title}
                                </p>
                                {year && (
                                  <p className="text-[11px] text-[var(--color-text-secondary)]">{year}</p>
                                )}
                              </button>
                            )
                          })
                      }
                    </div>
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

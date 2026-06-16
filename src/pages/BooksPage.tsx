import { useState, useRef, useCallback, useEffect } from 'react'
import { invokeFunction } from '../supabase'
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
import { useMobileTopBar } from '../contexts/MobileTopBarContext'
import BookCard from '../components/BookCard'
import CoverSlot from '../components/ui/CoverSlot'
import KluvsReadBadge from '../components/KluvsReadBadge'
import { SHELF_OPTIONS, SHELF_LABELS, SHELF_SECTIONS } from '../constants/shelves'

// ── Sub-components ────────────────────────────────────────────────────────────

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

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`bg-[var(--color-bg-elevated)] rounded animate-pulse ${className}`} />
}

// ── Pills ─────────────────────────────────────────────────────────────────────

function LikePill({ liked, onClick, disabled }: {
  liked: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={liked ? 'Unlike this book' : 'Like this book'}
      aria-pressed={liked}
      className={`flex items-center justify-center w-9 h-9 rounded-full border shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        liked
          ? 'border-primary text-primary'
          : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-4.35-9.5-8.5C.93 9.36 2.5 6 5.6 6 7.6 6 9 7.1 12 10c3-2.9 4.4-4 6.4-4 3.1 0 4.67 3.36 3.1 6.5C19 16.65 12 21 12 21z" />
      </svg>
    </button>
  )
}

function ShelfPill({ shelf, onShelfChange, disabled }: {
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
        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          shelf
            ? 'border-primary text-primary'
            : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {/* Bookmark icon */}
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill={shelf ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>{shelf ? SHELF_LABELS[shelf] : 'Add to Shelf'}</span>
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

// ── Grid ──────────────────────────────────────────────────────────────────────

function BookGrid({ books, search, onSelect, badgeFor }: {
  books: Book[]
  search?: boolean
  onSelect: (book: Book) => void
  badgeFor?: (book: Book) => { label: string } | undefined
}) {
  return (
    <div className={`grid grid-cols-4 ${search ? 'lg:grid-cols-6' : 'lg:grid-cols-8'} gap-x-2.5 gap-y-5 lg:gap-x-4 lg:gap-y-7`}>
      {books.map((book, i) => (
        <BookCard
          key={book.id ?? book.external_google_id ?? i}
          title={book.title}
          year={book.year}
          author={search ? book.author : undefined}
          imageUrl={book.image_url}
          onClick={() => onSelect(book)}
          badge={badgeFor?.(book)}
        />
      ))}
    </div>
  )
}

function GridShimmer({ search, count }: { search?: boolean; count: number }) {
  return (
    <div className={`grid grid-cols-4 ${search ? 'lg:grid-cols-6' : 'lg:grid-cols-8'} gap-x-2.5 gap-y-5 lg:gap-x-4 lg:gap-y-7`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Shimmer className="w-full aspect-[2/3] rounded-sm" />
          <Shimmer className="h-2.5 w-4/5" />
          <Shimmer className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [view, setView]                 = useState<'shelf' | 'search'>('shelf')
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
  const [shelvedBooks, setShelvedBooks]     = useState<ShelfEntry[]>([])
  const [loadingShelves, setLoadingShelves] = useState(true)
  const [shelvesError, setShelvesError]     = useState('')
  const [searchPage, setSearchPage]         = useState(0)
  const [hasMore, setHasMore]               = useState(false)
  const [loadingMore, setLoadingMore]       = useState(false)
  const [showBackToTop, setShowBackToTop]   = useState(false)

  const PAGE_SIZE = 12

  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeId       = useRef<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Scroll state ref — always current, readable synchronously inside event handlers
  const scrollStateRef = useRef({ hasMore: false, loadingMore: false, page: 0, query: '' })

  const { setTopBar, resetTopBar } = useMobileTopBar()

  // Focus the search input once it slides into view
  useEffect(() => {
    if (view === 'search') searchInputRef.current?.focus()
  }, [view])

  // Fetch shelved books on mount — "My Shelf" is the default view
  useEffect(() => {
    setLoadingShelves(true)
    setShelvesError('')
    invokeFunction<ShelfEntry[] | { shelves?: ShelfEntry[] }>('shelf', { method: 'GET' })
      .then(({ data, error }) => {
        if (error) throw error
        const raw: Array<ShelfEntry | ({ shelf: ShelfValue } & Book)> = Array.isArray(data) ? data : (data as { shelves?: ShelfEntry[] })?.shelves ?? []
        // Normalize both { shelf, book } and flat { shelf, ...bookFields } shapes
        const entries: ShelfEntry[] = raw.map(e =>
          'book' in e ? e : { shelf: e.shelf, updated_at: '', source: 'manual', book: e }
        )
        setShelvedBooks(entries)
      })
      .catch(() => setShelvesError('Could not load shelves.'))
      .finally(() => setLoadingShelves(false))
  }, [])

  const search = useCallback(async (q: string, page = 0) => {
    if (!q.trim()) { setResults([]); setHasMore(false); return }
    if (page === 0) setSearching(true)
    else setLoadingMore(true)
    setSearchError('')
    try {
      const offset = page * PAGE_SIZE
      const { data, error } = await invokeFunction<{ books?: Book[]; total?: number }>(
        `book?q=${encodeURIComponent(q.trim())}&limit=${PAGE_SIZE}&offset=${offset}`,
        { method: 'GET' }
      )
      if (error) throw error
      const books = Array.isArray(data) ? data : (data as { books?: Book[] })?.books ?? []
      const total = Array.isArray(data) ? null : (data as { total?: number })?.total ?? null
      setResults(prev => page === 0 ? books : [...prev, ...books])
      setHasMore(total != null ? offset + books.length < total : books.length === PAGE_SIZE)
    } catch {
      if (page === 0) { setSearchError('Search failed. Please try again.'); setResults([]) }
      setHasMore(false)
    } finally {
      setSearching(false)
      setLoadingMore(false)
    }
  }, [])

  // Keep scroll state ref always current so the handler never reads stale closures
  scrollStateRef.current = { hasMore, loadingMore, page: searchPage, query }

  // Scroll listener — infinite load + back-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)

      if (view !== 'search') return
      const { hasMore, loadingMore, page, query } = scrollStateRef.current
      if (!hasMore || loadingMore) return
      const distanceFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      if (distanceFromBottom < 400) {
        scrollStateRef.current.loadingMore = true // immediate guard against double-fire
        const nextPage = page + 1
        setSearchPage(nextPage)
        search(query, nextPage)
      }
    }

    // Check immediately — content may not fill the screen on first load
    const t = setTimeout(handleScroll, 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [view, search])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setSearchError('')
    setSearchPage(0)
    setHasMore(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val, 0), 400)
  }

  const goToSearch = () => setView('search')
  const backFromSearch = () => {
    setView('shelf')
    setQuery('')
    setResults([])
    setSearchError('')
    setSearchPage(0)
    setHasMore(false)
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
        const entry: ShelfEntry = { shelf: value, updated_at: new Date().toISOString(), source: 'manual', book: selectedBook }
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

  const closeDetail = () => setSelectedBook(null)

  // Drive the global mobile top bar while the detail overlay is open
  useEffect(() => {
    if (selectedBook) {
      setTopBar({ title: 'Book', backLabel: view === 'search' ? 'Search' : 'My Shelf', onBack: closeDetail })
    } else {
      resetTopBar()
    }
    return resetTopBar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBook, view])

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

  const selectedEntry = shelvedBooks.find(e =>
    (selectedBook?.id != null && e.book.id === selectedBook.id) ||
    (!!selectedBook?.external_google_id && e.book.external_google_id === selectedBook.external_google_id)
  )
  const kluvsBadgeLabel = selectedEntry?.source === 'session'
    ? (shelf === 'currently_reading' ? 'Reading with Kluvs' : shelf === 'read' ? 'Read with Kluvs' : null)
    : null

  const metaRows = [
    { label: 'Published', value: year },
    { label: 'Pages',     value: pages },
    { label: 'Publisher', value: publisher },
    { label: 'ISBN',      value: isbn, mono: true as const },
    { label: 'Language',  value: language },
    { label: 'Edition',   value: edition },
  ].filter(m => m.value)

  const hasShelvedBooks = shelvedBooks.length > 0

  return (
    <div className="relative">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="relative px-[22px] lg:px-10 pt-7 lg:pt-9 pb-6 min-h-[78px] lg:min-h-[86px]">

        {/* My Shelf header */}
        <div className={`flex items-start justify-between gap-4 transition-opacity duration-150 ${view === 'search' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div>
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2">
              Library
            </span>
            <h1 className="font-serif font-medium text-[32px] lg:text-[38px] leading-none tracking-[-0.02em] text-[var(--color-text-primary)]">
              My Shelf
            </h1>
          </div>
          <button
            onClick={goToSearch}
            aria-label="Search for a book"
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-btn border border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Search header — slides/fades in from the search button's position */}
        <div
          className={`absolute inset-x-[22px] lg:inset-x-10 top-7 lg:top-9 flex items-center gap-3 origin-right transition-all duration-200 ease-out ${
            view === 'search' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 pointer-events-none'
          }`}
        >
          <button
            onClick={backFromSearch}
            aria-label="Back to My Shelf"
            className="flex items-center justify-center w-10 h-10 shrink-0 rounded-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors -ml-2"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="relative flex-1 group">
            <input
              ref={searchInputRef}
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
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="px-[22px] lg:px-10 pb-12 lg:pb-16">
        {view === 'shelf' && (
          <>
            {loadingShelves && (
              <div className="space-y-9">
                {[1, 2].map(i => (
                  <div key={i}>
                    <Shimmer className="h-3 w-24 mb-4" />
                    <GridShimmer count={i === 1 ? 4 : 7} />
                  </div>
                ))}
              </div>
            )}

            {!loadingShelves && shelvesError && (
              <p className="text-sm text-[var(--color-text-secondary)] italic">{shelvesError}</p>
            )}

            {!loadingShelves && !shelvesError && !hasShelvedBooks && (
              <div className="flex flex-col items-center justify-center text-center gap-6 py-16 lg:py-24">
                <StackedCoverPlaceholder size="lg" />
                <div>
                  <p className="font-serif italic font-medium text-[28px] lg:text-[34px] leading-none tracking-[-0.012em] text-[var(--color-text-secondary)] mb-[10px]">
                    Nothing shelved yet.
                  </p>
                  <p className="text-[13px] text-[var(--color-text-meta)] leading-[1.6] max-w-[340px] mx-auto">
                    Search for a book and add it to Want to Read, Read, or Not Finished — it'll show up here.
                  </p>
                </div>
                <button
                  onClick={goToSearch}
                  className="text-sm font-medium px-5 py-2.5 rounded-btn bg-primary hover:bg-primary-hover text-white transition-colors"
                >
                  Search for a book
                </button>
              </div>
            )}

            {!loadingShelves && !shelvesError && hasShelvedBooks && (
              <div className="space-y-9 lg:space-y-12">
                {SHELF_SECTIONS.map(({ value, label }) => {
                  const entries = shelvedBooks.filter(e => e.shelf === value)
                  if (!entries.length) return null
                  const sessionBookKeys = new Set(
                    entries.filter(e => e.source === 'session').map(e => e.book.id ?? e.book.external_google_id)
                  )
                  const badgeFor = (book: Book) =>
                    sessionBookKeys.has(book.id ?? book.external_google_id)
                      ? { label: value === 'currently_reading' ? 'Reading with Kluvs' : 'Read with Kluvs' }
                      : undefined
                  return (
                    <div key={value}>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                          {label}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-meta)] tabular-nums">{entries.length}</span>
                      </div>
                      <BookGrid books={entries.map(e => e.book)} onSelect={handleSelect} badgeFor={badgeFor} />
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {view === 'search' && (
          <>
            {searchError && <p className="text-red-500 text-sm mb-4">{searchError}</p>}

            {!query.trim() && (
              <div className="flex flex-col items-center justify-center text-center gap-6 py-16 lg:py-24">
                <StackedCoverPlaceholder size="lg" />
                <div>
                  <p className="font-serif italic font-medium text-[28px] lg:text-[34px] leading-none tracking-[-0.012em] text-[var(--color-text-secondary)] mb-[10px]">
                    Start typing.
                  </p>
                  <p className="text-[13px] text-[var(--color-text-meta)] leading-[1.6] max-w-[340px] mx-auto">
                    Find a book by title or author. We'll pull the cover, the blurb, and a note on the author.
                  </p>
                </div>
              </div>
            )}

            {query.trim() && searching && results.length === 0 && (
              <GridShimmer search count={PAGE_SIZE} />
            )}

            {query.trim() && !searching && results.length === 0 && !searchError && (
              <div className="flex flex-col items-center justify-center text-center gap-6 py-16 lg:py-24">
                <StackedCoverPlaceholder size="lg" />
                <div>
                  <p className="font-serif italic font-medium text-[28px] lg:text-[34px] leading-none tracking-[-0.012em] text-[var(--color-text-secondary)] mb-[10px]">
                    No matches.
                  </p>
                  <p className="text-[13px] text-[var(--color-text-meta)] leading-[1.6] max-w-[340px] mx-auto">
                    No books found for "{query}" — try a different title or author.
                  </p>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <>
                <BookGrid books={results} search onSelect={handleSelect} />
                {loadingMore && <div className="mt-5"><GridShimmer search count={PAGE_SIZE} /></div>}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Detail overlay ────────────────────────────────────────────────── */}
      {selectedBook && (
        <div className="fixed inset-x-0 top-14 bottom-0 lg:inset-0 z-50 lg:flex lg:justify-end">
          {/* Scrim — desktop only, grid stays visible behind it */}
          <div
            className="hidden lg:block absolute inset-0 bg-black/50"
            onClick={closeDetail}
            aria-hidden="true"
          />

          <div className="relative w-full h-full lg:w-[600px] lg:h-full bg-[var(--color-bg)] lg:border-l lg:border-[var(--color-divider)] overflow-y-auto">

            {/* Panel header — desktop only; mobile uses the global top bar */}
            <div className="hidden lg:flex items-center justify-between px-5 lg:px-12 pt-5 lg:pt-6 pb-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                Book
              </span>

              <button
                onClick={closeDetail}
                aria-label="Close"
                className="flex w-8 h-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel body */}
            <div className="px-5 lg:px-12 pb-12 pt-5 lg:pt-2">

              <CoverSlot
                imageUrl={coverUrl}
                alt={title}
                label="cover"
                shadow
                className="w-[120px] sm:w-[148px] aspect-[2/3] mb-[18px]"
              />

              <h2 className="font-serif italic font-medium text-[26px] sm:text-[30px] leading-[1.1] tracking-[-0.014em] text-[var(--color-text-primary)] text-pretty mb-1.5">
                {title}
              </h2>

              {subtitle && (
                <p className="font-serif font-normal text-[15px] leading-[1.3] text-[var(--color-text-secondary)] mb-1.5">
                  {subtitle}
                </p>
              )}

              <p className="text-[14px] text-[var(--color-text-secondary)] tracking-[0.005em] mb-4">
                {loadingDetail && !vi?.authors
                  ? <Shimmer className="h-4 w-40 inline-block" />
                  : [authors, ...metaItems].filter(Boolean).join(' · ')
                }
              </p>

              {/* Categories */}
              {loadingDetail && categories.length === 0 ? (
                <div className="flex gap-2 mb-4">
                  <Shimmer className="h-6 w-20 rounded-full" />
                  <Shimmer className="h-6 w-16 rounded-full" />
                </div>
              ) : categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(c => (
                    <span key={c} className="px-[11px] py-[5px] rounded-full border border-[var(--color-divider)] text-[11px] font-medium tracking-[0.04em] text-[var(--color-text-secondary)] whitespace-nowrap">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Pill row */}
              <div className="flex items-center gap-2.5 mb-7">
                <LikePill liked={liked} onClick={selectedBook?.id ? handleToggleLike : undefined} disabled={!selectedBook?.id} />
                <ShelfPill shelf={shelf} onShelfChange={handleShelfChange} disabled={!selectedBook?.id} />
                {kluvsBadgeLabel && <KluvsReadBadge label={kluvsBadgeLabel} />}
              </div>

              <hr className="border-[var(--color-divider)] mb-6" />

              {/* About */}
              <section className="mb-6">
                <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-3">
                  About
                </span>
                {loadingDetail && !description ? (
                  <div className="space-y-2">
                    {[100, 90, 95, 85, 70].map(w => (
                      <Shimmer key={w} className="h-4" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : description ? (
                  <p className="text-[13px] text-[var(--color-text-primary)] leading-[1.7] tracking-[0.005em] whitespace-pre-line break-words">
                    {description}
                  </p>
                ) : (
                  <p className="text-[13px] text-[var(--color-text-secondary)] italic">No description available.</p>
                )}
              </section>

              {/* Details */}
              {(metaRows.length > 0 || loadingDetail) && (
                <>
                  <hr className="border-[var(--color-divider)] mb-6" />
                  <section className="mb-6">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2">
                      Details
                    </span>
                    {loadingDetail && metaRows.length === 0 ? (
                      <div className="divide-y divide-[var(--color-divider)]">
                        {[160, 112, 192, 256].map(w => (
                          <div key={w} className="flex gap-6 py-[12px]">
                            <Shimmer className="h-4 shrink-0" style={{ width: 90 }} />
                            <Shimmer className="h-4" style={{ width: Math.min(w, 140) }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <dl className="divide-y divide-[var(--color-divider)]">
                        {metaRows.map(({ label, value, mono }) => (
                          <div key={label} className="flex gap-6 py-[12px]">
                            <dt className="text-[13px] text-[var(--color-text-secondary)] shrink-0" style={{ width: 90 }}>
                              {label}
                            </dt>
                            <dd className={`text-[13px] text-[var(--color-text-primary)] font-medium tracking-[0.005em] break-words ${mono ? 'font-mono tracking-[0.01em]' : ''}`}>
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </section>
                </>
              )}

              {/* About the Author */}
              {(loadingAuthor || authorInfo) && (
                <>
                  <hr className="border-[var(--color-divider)] mb-6" />
                  <section className="mb-6">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-[14px]">
                      About the Author
                    </span>
                    {loadingAuthor && !authorInfo ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Shimmer className="h-12 w-12 rounded-full shrink-0" />
                          <Shimmer className="h-3.5 w-32" />
                        </div>
                        <Shimmer className="h-3.5 w-full" />
                        <Shimmer className="h-3.5 w-5/6" />
                        <Shimmer className="h-3.5 w-4/6" />
                      </div>
                    ) : authorInfo && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {(wikipediaImage || authorInfo.image?.contentUrl) && !authorPhotoFailed && (
                            <img
                              src={wikipediaImage ?? authorInfo.image!.contentUrl!}
                              alt={authorInfo.name ?? ''}
                              className="h-12 w-12 rounded-full object-cover shrink-0"
                              onError={() => setAuthorPhotoFailed(true)}
                            />
                          )}
                          <div className="min-w-0">
                            {authorInfo.name && (
                              <p className="font-serif font-medium text-[18px] leading-[1.1] tracking-[-0.008em] text-[var(--color-text-primary)]">
                                {authorInfo.name}
                              </p>
                            )}
                            {authorInfo.description && (
                              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mt-1">
                                {authorInfo.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {(wikipediaExtract || authorInfo.detailedDescription?.articleBody) && (
                          <p className="text-[13px] text-[var(--color-text-primary)] leading-[1.65] tracking-[0.005em]">
                            {wikipediaExtract ?? authorInfo.detailedDescription!.articleBody}
                          </p>
                        )}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* More by this author */}
              {(loadingAuthorBooks || authorBooks.length > 0) && (
                <>
                  <hr className="border-[var(--color-divider)] mb-6" />
                  <section>
                    <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-4">
                      More by {selectedBook?.author?.split(/\s*(?:,|&| and )\s*/i)[0]}
                    </span>
                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {loadingAuthorBooks && authorBooks.length === 0
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-2 shrink-0 w-[80px]">
                              <Shimmer className="w-[80px] h-[116px] rounded-sm" />
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
                              <BookCard
                                key={vol.id}
                                title={vi.title}
                                year={year}
                                imageUrl={coverUrl}
                                onClick={() => handleSelect(book)}
                                compact
                              />
                            )
                          })
                      }
                    </div>
                  </section>
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Back to top ───────────────────────────────────────────────────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] text-[var(--color-text-secondary)] shadow-lg hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-all duration-200 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
        Back to top
      </button>

    </div>
  )
}

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  bestCoverUrl,
  extractYear,
  stripHtml,
  preferredIsbn,
  displayLanguage,
  formatRatingCount,
  searchVolumes,
  getVolume,
  type GBImageLinks,
  type GBIndustryIdentifier,
  type GBVolumeInfo,
  type KGPerson,
} from '../../services/googleBooks'

// ── fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => vi.clearAllMocks())

function ok(data: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as Response)
}
function notOk(status = 400) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) } as Response)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockVolumeInfo: GBVolumeInfo = {
  title: 'Nineteen Eighty-Four',
  subtitle: 'A Novel',
  authors: ['George Orwell'],
  publisher: 'Secker & Warburg',
  publishedDate: '1949-06-08',
  description: '<b>A dystopian novel.</b>',
  industryIdentifiers: [
    { type: 'ISBN_13', identifier: '9780451524935' },
    { type: 'ISBN_10', identifier: '0451524934' },
  ],
  pageCount: 328,
  categories: ['Fiction', 'Classics'],
  averageRating: 4.2,
  ratingsCount: 98765,
  imageLinks: {
    smallThumbnail: 'http://example.com/small.jpg',
    thumbnail:      'http://example.com/thumb.jpg',
    small:          'http://example.com/s.jpg',
    medium:         'http://example.com/m.jpg',
    large:          'http://example.com/l.jpg',
    extraLarge:     'http://example.com/xl.jpg',
  },
  language: 'en',
}

const mockVolume = { id: 'abc123', volumeInfo: mockVolumeInfo }

const mockKGPerson: KGPerson = {
  name: 'George Orwell',
  description: 'English author',
  detailedDescription: { articleBody: 'Eric Arthur Blair, known by his pen name George Orwell.' },
  image: { contentUrl: 'https://upload.wikimedia.org/orwell.jpg' },
}

// ── bestCoverUrl ──────────────────────────────────────────────────────────────

describe('bestCoverUrl', () => {
  it('picks extraLarge when available', () => {
    expect(bestCoverUrl(mockVolumeInfo.imageLinks)).toBe('https://example.com/xl.jpg')
  })

  it('falls back through the resolution chain', () => {
    const links: GBImageLinks = { thumbnail: 'http://example.com/t.jpg', small: 'http://example.com/s.jpg' }
    expect(bestCoverUrl(links)).toBe('https://example.com/s.jpg')
  })

  it('uses fallback string when no imageLinks provided', () => {
    expect(bestCoverUrl(undefined, 'http://example.com/fb.jpg')).toBe('https://example.com/fb.jpg')
  })

  it('normalises http to https', () => {
    expect(bestCoverUrl({ thumbnail: 'http://books.google.com/cover.jpg' })).toMatch(/^https:\/\//)
  })

  it('returns undefined when both args are undefined', () => {
    expect(bestCoverUrl()).toBeUndefined()
  })
})

// ── extractYear ───────────────────────────────────────────────────────────────

describe('extractYear', () => {
  it('extracts a bare 4-digit year', () => {
    expect(extractYear('1949')).toBe('1949')
  })

  it('extracts year from a full ISO date', () => {
    expect(extractYear('1949-06-08')).toBe('1949')
  })

  it('extracts year from a partial date', () => {
    expect(extractYear('1949-06')).toBe('1949')
  })

  it('uses numeric fallback when publishedDate is undefined', () => {
    expect(extractYear(undefined, 1925)).toBe('1925')
  })

  it('returns undefined when both args are undefined', () => {
    expect(extractYear()).toBeUndefined()
  })
})

// ── stripHtml ─────────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes tags', () => {
    expect(stripHtml('<b>Bold</b> text')).toBe('Bold text')
  })

  it('converts <br> to newline', () => {
    expect(stripHtml('Line one<br>Line two')).toBe('Line one\nLine two')
  })

  it('converts <br /> to newline', () => {
    expect(stripHtml('Line one<br />Line two')).toBe('Line one\nLine two')
  })

  it('decodes &amp;', () => {
    expect(stripHtml('Fish &amp; Chips')).toBe('Fish & Chips')
  })

  it('decodes &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>')
  })

  it('decodes &quot; and &#39;', () => {
    expect(stripHtml('Say &quot;hello&quot; and &#39;bye&#39;')).toBe("Say \"hello\" and 'bye'")
  })

  it('trims leading and trailing whitespace', () => {
    expect(stripHtml('  hello  ')).toBe('hello')
  })
})

// ── preferredIsbn ─────────────────────────────────────────────────────────────

describe('preferredIsbn', () => {
  it('returns ISBN-13 when present', () => {
    expect(preferredIsbn(mockVolumeInfo.industryIdentifiers)).toBe('9780451524935')
  })

  it('falls back to ISBN-10 when no ISBN-13', () => {
    const ids: GBIndustryIdentifier[] = [{ type: 'ISBN_10', identifier: '0451524934' }]
    expect(preferredIsbn(ids)).toBe('0451524934')
  })

  it('returns undefined when neither is present', () => {
    const ids: GBIndustryIdentifier[] = [{ type: 'ISSN', identifier: '1234-5678' }]
    expect(preferredIsbn(ids)).toBeUndefined()
  })

  it('returns undefined for undefined input', () => {
    expect(preferredIsbn()).toBeUndefined()
  })
})

// ── displayLanguage ───────────────────────────────────────────────────────────

describe('displayLanguage', () => {
  it('converts "en" to English', () => {
    expect(displayLanguage('en')).toMatch(/english/i)
  })

  it('converts "es" to Spanish', () => {
    expect(displayLanguage('es')).toMatch(/spanish/i)
  })

  it('returns undefined for undefined input', () => {
    expect(displayLanguage(undefined)).toBeUndefined()
  })

  it('returns the raw code when Intl cannot resolve it', () => {
    expect(displayLanguage('zxx')).toBeDefined()
  })
})

// ── formatRatingCount ─────────────────────────────────────────────────────────

describe('formatRatingCount', () => {
  it('returns a string', () => {
    expect(typeof formatRatingCount(12345)).toBe('string')
  })

  it('formats with a thousands separator', () => {
    expect(formatRatingCount(12345)).toMatch(/12.345/)
  })
})

// ── searchVolumes ─────────────────────────────────────────────────────────────

describe('searchVolumes', () => {
  it('returns [] without fetching when query is empty', async () => {
    expect(await searchVolumes('')).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns [] without fetching when query is only whitespace', async () => {
    expect(await searchVolumes('   ')).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls the Google Books volumes endpoint', async () => {
    mockFetch.mockReturnValueOnce(ok({ kind: 'books#volumes', totalItems: 1, items: [mockVolume] }))
    await searchVolumes('1984')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('googleapis.com/books/v1/volumes'))
  })

  it('includes the query in the URL', async () => {
    mockFetch.mockReturnValueOnce(ok({ items: [] }))
    await searchVolumes('george orwell')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=george+orwell'))
  })

  it('returns volumes from the items array', async () => {
    mockFetch.mockReturnValueOnce(ok({ items: [mockVolume] }))
    const result = await searchVolumes('1984')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('abc123')
  })

  it('returns [] when items is absent (zero results)', async () => {
    mockFetch.mockReturnValueOnce(ok({ kind: 'books#volumes', totalItems: 0 }))
    expect(await searchVolumes('xyznotfound')).toEqual([])
  })

  it('caps maxResults at 40', async () => {
    mockFetch.mockReturnValueOnce(ok({ items: [] }))
    await searchVolumes('1984', 99)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('maxResults=40'))
  })

  it('returns [] on a non-ok response', async () => {
    mockFetch.mockReturnValueOnce(notOk(500))
    expect(await searchVolumes('1984')).toEqual([])
  })

  it('returns [] when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'))
    expect(await searchVolumes('1984')).toEqual([])
  })
})

// ── getVolume ─────────────────────────────────────────────────────────────────

describe('getVolume', () => {
  it('calls the correct volumes endpoint with the volume ID', async () => {
    mockFetch.mockReturnValueOnce(ok(mockVolume))
    await getVolume('abc123')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/volumes/abc123'))
  })

  it('returns volumeInfo on success', async () => {
    mockFetch.mockReturnValueOnce(ok(mockVolume))
    const result = await getVolume('abc123')
    expect(result?.title).toBe('Nineteen Eighty-Four')
    expect(result?.authors).toEqual(['George Orwell'])
  })

  it('returns null on a non-ok response', async () => {
    mockFetch.mockReturnValueOnce(notOk(404))
    expect(await getVolume('bad-id')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'))
    expect(await getVolume('abc123')).toBeNull()
  })
})

// ── getAuthor ─────────────────────────────────────────────────────────────────
// API_KEY is evaluated at module load time, so both the no-key and with-key
// paths require a fresh module import after stubbing the env var.

describe('getAuthor — no API key', () => {
  let getAuthorNoKey: (name: string) => Promise<KGPerson | null>

  beforeAll(async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '')
    vi.resetModules()
    const mod = await import('../../services/googleBooks')
    getAuthorNoKey = mod.getAuthor
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns null for an empty name without fetching', async () => {
    expect(await getAuthorNoKey('')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null for a whitespace-only name without fetching', async () => {
    expect(await getAuthorNoKey('   ')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null without fetching when no API key is configured', async () => {
    expect(await getAuthorNoKey('George Orwell')).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('getAuthor — with API key', () => {
  let getAuthorWithKey: (name: string) => Promise<KGPerson | null>

  beforeAll(async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'test-api-key')
    vi.resetModules()
    const mod = await import('../../services/googleBooks')
    getAuthorWithKey = mod.getAuthor
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('calls the Knowledge Graph endpoint', async () => {
    mockFetch.mockReturnValueOnce(ok({ itemListElement: [{ result: mockKGPerson }] }))
    await getAuthorWithKey('George Orwell')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('kgsearch.googleapis.com'))
  })

  it('includes the API key in the request URL', async () => {
    mockFetch.mockReturnValueOnce(ok({ itemListElement: [{ result: mockKGPerson }] }))
    await getAuthorWithKey('George Orwell')
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('key=test-api-key'))
  })

  it('returns the first result as a KGPerson', async () => {
    mockFetch.mockReturnValueOnce(ok({ itemListElement: [{ result: mockKGPerson }] }))
    const result = await getAuthorWithKey('George Orwell')
    expect(result?.name).toBe('George Orwell')
    expect(result?.description).toBe('English author')
    expect(result?.detailedDescription?.articleBody).toContain('Eric Arthur Blair')
  })

  it('returns null when itemListElement is empty', async () => {
    mockFetch.mockReturnValueOnce(ok({ itemListElement: [] }))
    expect(await getAuthorWithKey('Unknown')).toBeNull()
  })

  it('returns null on a non-ok response', async () => {
    mockFetch.mockReturnValueOnce(notOk(403))
    expect(await getAuthorWithKey('George Orwell')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'))
    expect(await getAuthorWithKey('George Orwell')).toBeNull()
  })
})

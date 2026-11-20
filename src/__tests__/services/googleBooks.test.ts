import { describe, it, expect } from 'vitest'
import {
  bestCoverUrl,
  extractYear,
  stripHtml,
  preferredIsbn,
  displayLanguage,
  formatRatingCount,
  type ImageLinks,
  type IndustryIdentifier,
} from '../../services/googleBooks'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockVolumeInfo = {
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

// ── bestCoverUrl ──────────────────────────────────────────────────────────────

describe('bestCoverUrl', () => {
  it('picks extraLarge when available', () => {
    expect(bestCoverUrl(mockVolumeInfo.imageLinks)).toBe('https://example.com/xl.jpg')
  })

  it('falls back through the resolution chain', () => {
    const links: ImageLinks = { thumbnail: 'http://example.com/t.jpg', small: 'http://example.com/s.jpg' }
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

  it('uses fallback when every image link is null', () => {
    const links: ImageLinks = { thumbnail: null, small: null, medium: null, large: null, extraLarge: null }
    expect(bestCoverUrl(links, 'http://example.com/fb.jpg')).toBe('https://example.com/fb.jpg')
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
    const ids: IndustryIdentifier[] = [{ type: 'ISBN_10', identifier: '0451524934' }]
    expect(preferredIsbn(ids)).toBe('0451524934')
  })

  it('returns undefined when neither is present', () => {
    const ids: IndustryIdentifier[] = [{ type: 'ISSN', identifier: '1234-5678' }]
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

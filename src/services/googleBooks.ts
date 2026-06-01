/**
 * Google Books + Knowledge Graph API service
 *
 * Books API docs:          https://developers.google.com/books/docs/v1/reference/volumes
 * Knowledge Graph API docs: https://developers.google.com/knowledge-graph
 *
 * Books API works without a key (up to ~1 000 req/day per IP).
 * Knowledge Graph requires a key — set VITE_GOOGLE_BOOKS_API_KEY in .env.
 * Both APIs can share the same key if enabled in the same Google Cloud project.
 */

const BOOKS_BASE = 'https://www.googleapis.com/books/v1'
const KG_BASE    = 'https://kgsearch.googleapis.com/v1'
const API_KEY    = (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined) || ''

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GBImageLinks {
  smallThumbnail?: string
  thumbnail?: string
  small?: string
  medium?: string
  large?: string
  extraLarge?: string
}

export interface GBIndustryIdentifier {
  type: 'ISBN_10' | 'ISBN_13' | 'ISSN' | 'OTHER'
  identifier: string
}

export interface GBVolumeInfo {
  title: string
  subtitle?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  industryIdentifiers?: GBIndustryIdentifier[]
  pageCount?: number
  printedPageCount?: number
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  maturityRating?: string
  imageLinks?: GBImageLinks
  language?: string
  previewLink?: string
  infoLink?: string
  canonicalVolumeLink?: string
}

export interface GBVolume {
  id: string
  volumeInfo: GBVolumeInfo
}

export interface GBSearchResponse {
  kind: string
  totalItems: number
  items?: GBVolume[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick the highest-resolution cover available and normalise to https. */
export function bestCoverUrl(links?: GBImageLinks, fallback?: string): string | undefined {
  const raw = links
    ? (links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail)
    : fallback
  return raw?.replace('http://', 'https://')
}

/** Extract a 4-digit year from Google's loose publishedDate strings ("1925", "1925-04", "April 1925"). */
export function extractYear(publishedDate?: string, fallback?: number): string | undefined {
  if (publishedDate) {
    const m = publishedDate.match(/\d{4}/)
    if (m) return m[0]
  }
  return fallback?.toString()
}

/** Strip basic HTML tags that appear in Google Books descriptions. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/** Return ISBN-13 preferentially, falling back to ISBN-10. */
export function preferredIsbn(ids?: GBIndustryIdentifier[]): string | undefined {
  return ids?.find(i => i.type === 'ISBN_13')?.identifier
    ?? ids?.find(i => i.type === 'ISBN_10')?.identifier
}

/** Convert a BCP-47 language code to a human-readable name ("en" → "English"). */
export function displayLanguage(code?: string): string | undefined {
  if (!code) return undefined
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code)
  } catch {
    return code
  }
}

/** Format a ratings count for display ("12345" → "12,345"). */
export function formatRatingCount(count: number): string {
  return count.toLocaleString()
}

// ── Internal ──────────────────────────────────────────────────────────────────

function buildUrl(base: string, path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${base}${path}`)
  if (API_KEY) url.searchParams.set('key', API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Search Google Books by title, author, ISBN, or any query string.
 * Returns up to `maxResults` volumes (default 20, max 40).
 */
export async function searchVolumes(query: string, maxResults = 20): Promise<GBVolume[]> {
  if (!query.trim()) return []
  const url = buildUrl(BOOKS_BASE, '/volumes', {
    q:          query.trim(),
    maxResults: String(Math.min(maxResults, 40)),
    printType:  'books',
    orderBy:    'relevance',
  })
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json: GBSearchResponse = await res.json()
    return json.items ?? []
  } catch {
    return []
  }
}

/**
 * Fetch the full volume record for a known Google Books volume ID.
 * Used to enrich a selected book with description, rating, categories, etc.
 */
export async function getVolume(volumeId: string): Promise<GBVolumeInfo | null> {
  try {
    const url = buildUrl(BOOKS_BASE, `/volumes/${encodeURIComponent(volumeId)}`)
    const res = await fetch(url)
    if (!res.ok) return null
    const json: GBVolume = await res.json()
    return json.volumeInfo ?? null
  } catch {
    return null
  }
}

// ── Knowledge Graph ───────────────────────────────────────────────────────────

export interface KGPerson {
  name?: string
  description?: string
  detailedDescription?: {
    articleBody?: string
    url?: string
  }
  image?: {
    contentUrl?: string
  }
}

export interface WikipediaAuthorInfo {
  imageUrl: string | null
  extract: string | null
}

/**
 * Fetch an author's thumbnail and bio extract from Wikipedia.
 * Tries a near-title match first to avoid full-text false positives (e.g. an author's
 * name appearing inside an unrelated article). Falls back to full-text search only if
 * near-match finds nothing, and validates the result shares a word with the query.
 * Free, no key required, CORS-friendly.
 */
export async function getWikipediaAuthorInfo(name: string): Promise<WikipediaAuthorInfo> {
  const empty: WikipediaAuthorInfo = { imageUrl: null, extract: null }
  if (!name.trim()) return empty

  const queryWords = name.trim().toLowerCase().split(/\s+/).filter(w => w.length > 3)

  const findPageTitle = async (srwhat: 'nearmatch' | 'text'): Promise<string | null> => {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name.trim())}&srwhat=${srwhat}&srlimit=1&format=json&origin=*`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const json = await res.json()
    const title: string | undefined = json.query?.search?.[0]?.title
    if (!title) return null
    // For full-text fallback, reject if the title shares no words with the query
    if (srwhat === 'text') {
      const titleLower = title.toLowerCase()
      if (!queryWords.some(w => titleLower.includes(w))) return null
    }
    return title
  }

  try {
    const pageTitle = await findPageTitle('nearmatch') ?? await findPageTitle('text')
    if (!pageTitle) return empty

    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!summaryRes.ok) return empty
    const summaryJson = await summaryRes.json()
    return {
      imageUrl: (summaryJson.thumbnail?.source as string) ?? null,
      extract:  (summaryJson.extract as string) ?? null,
    }
  } catch {
    return empty
  }
}

/**
 * Look up a person (author) in the Google Knowledge Graph.
 * Returns null when no API key is configured — the section simply won't render.
 * Requires VITE_GOOGLE_BOOKS_API_KEY and the Knowledge Graph Search API enabled
 * in the same Google Cloud project.
 */
export async function getAuthor(name: string): Promise<KGPerson | null> {
  if (!name.trim()) return null
  if (!API_KEY) {
    if (import.meta.env.DEV) console.warn('[googleBooks] No API key — skipping Knowledge Graph lookup')
    return null
  }
  const url = buildUrl(KG_BASE, '/entities:search', {
    query: name.trim(),
    types: 'Person',
    limit: '1',
  })
  try {
    const res = await fetch(url)
    if (!res.ok) {
      if (import.meta.env.DEV) console.warn(`[googleBooks] Knowledge Graph ${res.status} for "${name}"`)
      return null
    }
    const json = await res.json()
    const result = (json.itemListElement?.[0]?.result as KGPerson) ?? null
    if (import.meta.env.DEV) console.log('[googleBooks] Author result:', result)
    return result
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[googleBooks] Knowledge Graph fetch failed:', err)
    return null
  }
}

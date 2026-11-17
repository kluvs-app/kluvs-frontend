/**
 * Display helpers for Google Books volume data.
 *
 * All network lookups (Google Books, Knowledge Graph, Wikipedia) go through the
 * `book-enrichment` Edge Function — nothing here calls an external API.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Google Books image links. Fields are null when the backend has no image at that size. */
export interface ImageLinks {
  smallThumbnail?: string | null
  thumbnail?: string | null
  small?: string | null
  medium?: string | null
  large?: string | null
  extraLarge?: string | null
}

export interface IndustryIdentifier {
  type: string
  identifier: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pick the highest-resolution cover available and normalise to https.
 * Uses `fallback` when there are no links or every size is empty.
 */
export function bestCoverUrl(links?: ImageLinks | null, fallback?: string): string | undefined {
  const raw = (links && (links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail))
    || fallback
  return raw?.replace('http://', 'https://')
}

/** Extract a 4-digit year from Google's loose publishedDate strings ("1925", "1925-04", "April 1925"). */
export function extractYear(publishedDate?: string | null, fallback?: number): string | undefined {
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
export function preferredIsbn(ids?: IndustryIdentifier[]): string | undefined {
  return ids?.find(i => i.type === 'ISBN_13')?.identifier
    ?? ids?.find(i => i.type === 'ISBN_10')?.identifier
}

/** Convert a BCP-47 language code to a human-readable name ("en" → "English"). */
export function displayLanguage(code?: string | null): string | undefined {
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

/**
 * Parse a DATE-only string (YYYY-MM-DD) as local midnight.
 * new Date("YYYY-MM-DD") is parsed as UTC midnight, which shifts the date
 * by the user's UTC offset. Appending T00:00:00 forces local time interpretation.
 * Also handles ISO datetime strings by extracting the date part.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const dateOnly = dateStr.split('T')[0]
  const parsed = new Date(dateOnly + 'T00:00:00')
  return isNaN(parsed.getTime()) ? new Date(NaN) : parsed
}

/**
 * Parse an ISO 8601 `scheduled_at` string (with timezone offset) into a Date.
 */
export function parseScheduledAt(scheduledAt: string): Date {
  if (!scheduledAt) return new Date(NaN)
  return new Date(scheduledAt)
}

/**
 * Decompose an ISO 8601 `scheduled_at` string into separate local date
 * (YYYY-MM-DD) and time (HH:mm) values, suitable for populating
 * `<input type="date">` and `<input type="time">` fields.
 */
export function scheduledAtToLocalParts(scheduledAt: string): { date: string; time: string } {
  const parsed = parseScheduledAt(scheduledAt)
  if (isNaN(parsed.getTime())) return { date: '', time: '' }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')

  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

/**
 * Compose separate local date (YYYY-MM-DD) and time (HH:mm) values into an
 * ISO 8601 string with the browser's local timezone offset, e.g.
 * "2026-07-15T18:00:00-07:00". If `time` is omitted, defaults to midnight
 * local time.
 */
export function localPartsToScheduledAt(date: string, time?: string | null): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = (time || '00:00').split(':').map(Number)

  const local = new Date(year, month - 1, day, hours, minutes, 0)

  const offsetMinutes = local.getTimezoneOffset()
  const offsetSign = offsetMinutes <= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const offsetMins = String(absOffset % 60).padStart(2, '0')

  const pad = (n: number) => String(n).padStart(2, '0')
  const datePart = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`
  const timePart = `${pad(local.getHours())}:${pad(local.getMinutes())}:${pad(local.getSeconds())}`

  return `${datePart}T${timePart}${offsetSign}${offsetHours}:${offsetMins}`
}

/**
 * Returns true if the given `scheduled_at` ISO 8601 datetime is strictly
 * before now.
 */
export function isPast(scheduledAt: string): boolean {
  return parseScheduledAt(scheduledAt) < new Date()
}

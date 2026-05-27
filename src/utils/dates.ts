/**
 * Parse a DATE-only string (YYYY-MM-DD) as local midnight.
 * new Date("YYYY-MM-DD") is parsed as UTC midnight, which shifts the date
 * by the user's UTC offset. Appending T00:00:00 forces local time interpretation.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

/**
 * Returns true if the given date (and optional time) is in the past.
 * - With time: compares exact datetime against now.
 * - Date-only: compares calendar day; today is NOT considered past.
 */
export function isPast(dateStr: string, timeStr?: string | null): boolean {
  if (timeStr) {
    return new Date(`${dateStr}T${timeStr}`) < new Date()
  }
  const day = parseLocalDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return day < today
}

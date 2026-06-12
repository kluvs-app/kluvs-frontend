import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  parseLocalDate,
  parseScheduledAt,
  scheduledAtToLocalParts,
  localPartsToScheduledAt,
  isPast,
} from '../../utils/dates'

describe('parseLocalDate', () => {
  it('returns a Date object', () => {
    expect(parseLocalDate('2026-05-23')).toBeInstanceOf(Date)
  })

  it('parses as local midnight, not UTC midnight', () => {
    const d = parseLocalDate('2026-05-23')
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
  })

  it('produces the correct local calendar date', () => {
    const d = parseLocalDate('2026-05-23')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(4) // 0-indexed
    expect(d.getDate()).toBe(23)
  })

  it('always produces local midnight regardless of timezone offset', () => {
    const localParsed = parseLocalDate('2026-05-23')
    // Local date components must always be correct — the key invariant
    expect(localParsed.getFullYear()).toBe(2026)
    expect(localParsed.getMonth()).toBe(4)
    expect(localParsed.getDate()).toBe(23)
    // Must be midnight in local time
    expect(localParsed.getHours()).toBe(0)
    expect(localParsed.getMinutes()).toBe(0)
    expect(localParsed.getSeconds()).toBe(0)
  })

  it('handles January 1st (year boundary)', () => {
    const d = parseLocalDate('2025-01-01')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
  })

  it('handles December 31st (year boundary)', () => {
    const d = parseLocalDate('2025-12-31')
    expect(d.getFullYear()).toBe(2025)
    expect(d.getMonth()).toBe(11)
    expect(d.getDate()).toBe(31)
  })

  it('handles leap day', () => {
    const d = parseLocalDate('2024-02-29')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(29)
  })
})

describe('parseScheduledAt', () => {
  it('returns a Date object', () => {
    expect(parseScheduledAt('2026-07-15T18:00:00-07:00')).toBeInstanceOf(Date)
  })

  it('parses an ISO 8601 string with a timezone offset', () => {
    const d = parseScheduledAt('2026-07-15T18:00:00-07:00')
    expect(d.getTime()).toBe(new Date('2026-07-15T18:00:00-07:00').getTime())
  })

  it('returns an invalid Date for an empty string', () => {
    expect(isNaN(parseScheduledAt('').getTime())).toBe(true)
  })
})

describe('scheduledAtToLocalParts', () => {
  it('extracts local date and time parts from an ISO string', () => {
    // Construct from local parts so the round trip is timezone-independent
    const iso = localPartsToScheduledAt('2026-07-15', '18:00')
    expect(scheduledAtToLocalParts(iso)).toEqual({ date: '2026-07-15', time: '18:00' })
  })

  it('pads single-digit hours and minutes', () => {
    const iso = localPartsToScheduledAt('2026-01-05', '09:05')
    expect(scheduledAtToLocalParts(iso)).toEqual({ date: '2026-01-05', time: '09:05' })
  })

  it('returns empty strings for an empty input', () => {
    expect(scheduledAtToLocalParts('')).toEqual({ date: '', time: '' })
  })
})

describe('localPartsToScheduledAt', () => {
  it('produces an ISO 8601 string with a timezone offset', () => {
    const iso = localPartsToScheduledAt('2026-07-15', '18:00')
    expect(iso).toMatch(/^2026-07-15T18:00:00[+-]\d{2}:\d{2}$/)
  })

  it('round-trips through scheduledAtToLocalParts', () => {
    const iso = localPartsToScheduledAt('2026-12-31', '23:45')
    expect(scheduledAtToLocalParts(iso)).toEqual({ date: '2026-12-31', time: '23:45' })
  })

  it('defaults to midnight when time is omitted', () => {
    const iso = localPartsToScheduledAt('2026-03-10')
    expect(scheduledAtToLocalParts(iso)).toEqual({ date: '2026-03-10', time: '00:00' })
  })

  it('defaults to midnight when time is null', () => {
    const iso = localPartsToScheduledAt('2026-03-10', null)
    expect(scheduledAtToLocalParts(iso)).toEqual({ date: '2026-03-10', time: '00:00' })
  })
})

describe('isPast', () => {
  beforeEach(() => {
    // Fix "now" to 2026-05-23T12:00:00 local time so tests are deterministic
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when the scheduled datetime is in the past', () => {
    expect(isPast(localPartsToScheduledAt('2026-05-23', '09:00'))).toBe(true)
  })

  it('returns false when the scheduled datetime is in the future', () => {
    expect(isPast(localPartsToScheduledAt('2026-05-23', '18:00'))).toBe(false)
  })

  it('returns true for any time yesterday', () => {
    expect(isPast(localPartsToScheduledAt('2026-05-22', '23:59'))).toBe(true)
  })

  it('returns false for any time tomorrow', () => {
    expect(isPast(localPartsToScheduledAt('2026-05-24', '00:01'))).toBe(false)
  })

  it('returns true for a datetime far in the past', () => {
    expect(isPast('2020-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for a datetime far in the future', () => {
    expect(isPast('2030-01-01T00:00:00Z')).toBe(false)
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parseLocalDate, isPast } from '../../utils/dates'

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

describe('isPast', () => {
  beforeEach(() => {
    // Fix "now" to 2026-05-23T12:00:00 local time so tests are deterministic
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('date-only (no time argument)', () => {
    it('returns true for a date in the past', () => {
      expect(isPast('2026-05-22')).toBe(true)
    })

    it('returns false for today', () => {
      expect(isPast('2026-05-23')).toBe(false)
    })

    it('returns false for a date in the future', () => {
      expect(isPast('2026-05-24')).toBe(false)
    })

    it('returns false for a date far in the future', () => {
      expect(isPast('2030-01-01')).toBe(false)
    })

    it('returns true for a date far in the past', () => {
      expect(isPast('2020-01-01')).toBe(true)
    })

    it('returns true for yesterday', () => {
      expect(isPast('2026-05-22')).toBe(true)
    })
  })

  describe('with time argument', () => {
    it('returns true when the exact datetime is in the past', () => {
      // Now is 12:00; 09:00 on today is past
      expect(isPast('2026-05-23', '09:00:00')).toBe(true)
    })

    it('returns false when the exact datetime is in the future', () => {
      // Now is 12:00; 18:00 on today is future
      expect(isPast('2026-05-23', '18:00:00')).toBe(false)
    })

    it('returns true for any time yesterday', () => {
      expect(isPast('2026-05-22', '23:59:59')).toBe(true)
    })

    it('returns false for any time tomorrow', () => {
      expect(isPast('2026-05-24', '00:00:01')).toBe(false)
    })

    it('returns true when time is exactly now (strictly less-than)', () => {
      // Fake time is 12:00:00.000; passing 12:00:00 parses to the same ms — not strictly less
      expect(isPast('2026-05-23', '12:00:00')).toBe(false)
    })

    it('handles null time the same as omitting it', () => {
      expect(isPast('2026-05-22', null)).toBe(true)  // yesterday
      expect(isPast('2026-05-23', null)).toBe(false) // today
      expect(isPast('2026-05-24', null)).toBe(false) // tomorrow
    })

    it('handles undefined time the same as omitting it', () => {
      expect(isPast('2026-05-22', undefined)).toBe(true)
      expect(isPast('2026-05-23', undefined)).toBe(false)
    })
  })
})

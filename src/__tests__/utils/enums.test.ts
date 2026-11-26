import { describe, it, expect, vi, afterEach } from 'vitest'
import { isKnownShelf, toJoinPolicy, toProgressType, toUserRole } from '../../utils/enums'
import { shelfLabel } from '../../constants/shelves'
import type { ShelfValue } from '../../types'

// Each test uses its own unknown value: warnings are deduplicated per value.
describe('enum fallbacks', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('passes known values through without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(toUserRole('owner')).toBe('owner')
    expect(isKnownShelf('read')).toBe(true)
    expect(toProgressType('percent')).toBe('percent')
    expect(toJoinPolicy('INVITE_LINK')).toBe('INVITE_LINK')
    expect(warn).not.toHaveBeenCalled()
  })

  it('maps an unknown role to least privilege and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(toUserRole('moderator')).toBe('member')
    expect(toUserRole('moderator')).toBe('member')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('moderator'))
  })

  it('sorts members with an unknown role last, like members', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const order = { owner: 0, admin: 1, member: 2 }
    const sorted = ['guest', 'owner', 'admin'].sort((a, b) => order[toUserRole(a)] - order[toUserRole(b)])
    expect(sorted).toEqual(['owner', 'admin', 'guest'])
  })

  it('rejects an unknown shelf and labels it generically', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(isKnownShelf('abandoned')).toBe(false)
    expect(shelfLabel('dnf' as ShelfValue)).toBe('Shelved')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('abandoned'))
  })

  it('maps an unknown progress type to page', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(toProgressType('chapter')).toBe('page')
  })

  it('maps an unknown join policy to PRIVATE', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(toJoinPolicy('PUBLIC')).toBe('PRIVATE')
  })
})

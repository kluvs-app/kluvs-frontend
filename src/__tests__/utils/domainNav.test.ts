import { describe, it, expect, afterEach } from 'vitest'
import { isRealKluvsHost, getAppHref, getMarketingHref } from '../../utils/domainNav'

const originalLocation = window.location

function setHostname(hostname: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...originalLocation, hostname, host: hostname },
  })
}

afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: originalLocation })
})

describe('isRealKluvsHost', () => {
  it('recognizes production and integration marketing hosts', () => {
    expect(isRealKluvsHost('kluvs.com')).toBe(true)
    expect(isRealKluvsHost('www.kluvs.com')).toBe(true)
    expect(isRealKluvsHost('kluvs.xyz')).toBe(true)
    expect(isRealKluvsHost('www.kluvs.xyz')).toBe(true)
  })

  it('recognizes their app subdomains too', () => {
    expect(isRealKluvsHost('app.kluvs.com')).toBe(true)
    expect(isRealKluvsHost('app.kluvs.xyz')).toBe(true)
  })

  it('rejects Vercel previews and localhost', () => {
    expect(isRealKluvsHost('kluvs-frontend-abc123.vercel.app')).toBe(false)
    expect(isRealKluvsHost('localhost')).toBe(false)
  })
})

describe('getAppHref', () => {
  it('jumps cross-origin via VITE_OAUTH_REDIRECT_URL on a real Kluvs host', () => {
    setHostname('kluvs.com')
    expect(getAppHref('/me')).toBe(`${import.meta.env.VITE_OAUTH_REDIRECT_URL}/me`)
  })

  it('stays same-origin with the app-domain override elsewhere', () => {
    setHostname('kluvs-frontend-abc123.vercel.app')
    expect(getAppHref('/me')).toBe(`${window.location.origin}/me?domain=app`)
  })
})

describe('getMarketingHref', () => {
  it('jumps cross-origin via VITE_OAUTH_REDIRECT_URL on a real Kluvs app host', () => {
    setHostname('app.kluvs.com')
    expect(getMarketingHref()).toBe(import.meta.env.VITE_OAUTH_REDIRECT_URL?.replace('app.', ''))
  })

  it('stays same-origin with the marketing-domain override elsewhere', () => {
    setHostname('kluvs-frontend-abc123.vercel.app')
    expect(getMarketingHref()).toBe(`${window.location.origin}/?domain=marketing`)
  })
})

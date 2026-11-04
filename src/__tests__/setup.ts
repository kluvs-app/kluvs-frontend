import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Mock Supabase environment variables before any modules are loaded
import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Newer Node versions ship an experimental global `localStorage` that shadows
// jsdom's and is undefined unless --localstorage-file is passed. Fall back to
// an in-memory Storage so tests behave the same on every Node version.
function createMemoryStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    clear: () => {
      store = {}
    },
    getItem: (key) => (key in store ? store[key] : null),
    key: (index) => Object.keys(store)[index] ?? null,
    removeItem: (key) => {
      delete store[key]
    },
    setItem: (key, value) => {
      store[key] = String(value)
    },
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  let usable = false
  try {
    usable = typeof globalThis[name]?.getItem === 'function'
  } catch {
    usable = false
  }
  if (!usable) {
    const storage = createMemoryStorage()
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true })
    Object.defineProperty(window, name, { value: storage, configurable: true, writable: true })
  }
}

// Mock window.matchMedia (required for some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver (if needed for timeline/scrolling)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver (used by KluvsHexBackground)
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = MockResizeObserver as any

// Mock crypto.randomUUID (used in AddClubModal)
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
})

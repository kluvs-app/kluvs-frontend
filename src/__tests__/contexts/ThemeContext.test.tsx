import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext'

const STORAGE_KEY = 'kluvs-theme'

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.clearAllMocks()
  })

  describe('useTheme outside provider', () => {
    it('throws when used outside ThemeProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('Initial state', () => {
    it('defaults to system theme when nothing stored', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.theme).toBe('system')
    })

    it('reads stored dark theme from localStorage on init', () => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.theme).toBe('dark')
      expect(result.current.resolvedTheme).toBe('dark')
    })

    it('reads stored light theme from localStorage on init', () => {
      localStorage.setItem(STORAGE_KEY, 'light')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.theme).toBe('light')
      expect(result.current.resolvedTheme).toBe('light')
    })

    it('ignores invalid stored values and defaults to system', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-value')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.theme).toBe('system')
    })
  })

  describe('setTheme', () => {
    it('setTheme("dark") applies dark class and persists to localStorage', () => {
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      act(() => result.current.setTheme('dark'))
      expect(result.current.theme).toBe('dark')
      expect(result.current.resolvedTheme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    })

    it('setTheme("light") removes dark class and persists to localStorage', () => {
      document.documentElement.classList.add('dark')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      act(() => result.current.setTheme('light'))
      expect(result.current.theme).toBe('light')
      expect(result.current.resolvedTheme).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
    })

    it('setTheme("system") resolves based on matchMedia preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      act(() => result.current.setTheme('system'))
      expect(result.current.theme).toBe('system')
      expect(result.current.resolvedTheme).toBe('dark')
    })
  })

  describe('System preference listener', () => {
    it('updates resolvedTheme when system preference changes to dark', async () => {
      let mediaHandler: ((e: any) => void) | null = null
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: (_: string, fn: (e: any) => void) => { mediaHandler = fn },
          removeEventListener: vi.fn(),
        })),
      })

      localStorage.setItem(STORAGE_KEY, 'system')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.resolvedTheme).toBe('light')

      act(() => {
        mediaHandler?.({ matches: true })
      })
      expect(result.current.resolvedTheme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('updates resolvedTheme when system preference changes to light', async () => {
      document.documentElement.classList.add('dark')
      let mediaHandler: ((e: any) => void) | null = null
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: (_: string, fn: (e: any) => void) => { mediaHandler = fn },
          removeEventListener: vi.fn(),
        })),
      })

      localStorage.setItem(STORAGE_KEY, 'system')
      const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(result.current.resolvedTheme).toBe('dark')

      act(() => {
        mediaHandler?.({ matches: false })
      })
      expect(result.current.resolvedTheme).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('does not attach listener when theme is not system', () => {
      const addEventListenerSpy = vi.fn()
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: addEventListenerSpy,
          removeEventListener: vi.fn(),
        }),
      })
      localStorage.setItem(STORAGE_KEY, 'dark')
      renderHook(() => useTheme(), { wrapper: ThemeProvider })
      expect(addEventListenerSpy).not.toHaveBeenCalled()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MobileTopBarProvider, useMobileTopBar } from '../../contexts/MobileTopBarContext'

describe('MobileTopBarContext', () => {
  describe('useMobileTopBar', () => {
    it('throws when used outside MobileTopBarProvider', () => {
      expect(() => {
        renderHook(() => useMobileTopBar())
      }).toThrow('useMobileTopBar must be used inside MobileTopBarProvider')
    })

    it('returns empty state initially', () => {
      const { result } = renderHook(() => useMobileTopBar(), { wrapper: MobileTopBarProvider })
      expect(result.current.state).toEqual({})
    })

    it('setTopBar updates state', () => {
      const { result } = renderHook(() => useMobileTopBar(), { wrapper: MobileTopBarProvider })

      act(() => {
        result.current.setTopBar({ title: 'My Club', backLabel: 'Clubs', backPath: '/clubs' })
      })

      expect(result.current.state.title).toBe('My Club')
      expect(result.current.state.backLabel).toBe('Clubs')
      expect(result.current.state.backPath).toBe('/clubs')
    })

    it('resetTopBar clears state to empty object', () => {
      const { result } = renderHook(() => useMobileTopBar(), { wrapper: MobileTopBarProvider })

      act(() => { result.current.setTopBar({ title: 'Something' }) })
      expect(result.current.state.title).toBe('Something')

      act(() => { result.current.resetTopBar() })
      expect(result.current.state).toEqual({})
    })

    it('setTopBar replaces entire previous state', () => {
      const { result } = renderHook(() => useMobileTopBar(), { wrapper: MobileTopBarProvider })

      act(() => { result.current.setTopBar({ title: 'First', backLabel: 'Home' }) })
      act(() => { result.current.setTopBar({ title: 'Second' }) })

      expect(result.current.state.title).toBe('Second')
      expect(result.current.state.backLabel).toBeUndefined()
    })

    it('stores onBack callback', () => {
      const { result } = renderHook(() => useMobileTopBar(), { wrapper: MobileTopBarProvider })
      const onBack = () => {}

      act(() => { result.current.setTopBar({ title: 'Detail', onBack }) })

      expect(result.current.state.onBack).toBe(onBack)
    })
  })
})

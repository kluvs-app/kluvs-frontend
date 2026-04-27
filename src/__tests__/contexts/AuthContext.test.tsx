import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { createMockUser, setupAuthMocks, mockEdgeFunctionResponse } from '../utils/supabase-mock'
import { mockAdminMember, mockRegularMember } from '../utils/mocks'

// Mock the supabase module with factory function
vi.mock('../../supabase', () => {
  const mockClient = {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  }
  return {
    supabase: mockClient,
  }
})

describe('AuthContext', () => {
  let mockSupabase: any

  beforeEach(async () => {
    // Get the mocked supabase from the module
    const supabaseModule = await import('../../supabase')
    mockSupabase = supabaseModule.supabase as any

    // Reset all mocks
    vi.clearAllMocks()

    // Set up default mock responses
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'discord', url: 'https://discord.com/oauth' },
      error: null,
    })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: null,
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('member')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('isAdmin')
      expect(result.current).toHaveProperty('signInWithDiscord')
      expect(result.current).toHaveProperty('signInWithGoogle')
      expect(result.current).toHaveProperty('signOut')
      expect(result.current).toHaveProperty('refreshMemberData')
    })
  })

  describe('Initial state', () => {
    it('should start with loading true and no user/member', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.member).toBeNull()
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('isAdmin computed property', () => {
    it('should return true when member role is admin', async () => {
      const mockUser = createMockUser({ id: 'admin-user-id' })
      setupAuthMocks(mockSupabase, mockUser)
      mockEdgeFunctionResponse(mockSupabase, 'member', {
        data: mockAdminMember,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(true)
      expect(result.current.member?.role).toBe('admin')
    })

    it('should return false when member role is member', async () => {
      const mockUser = createMockUser({ id: 'regular-user-id' })
      setupAuthMocks(mockSupabase, mockUser)
      mockEdgeFunctionResponse(mockSupabase, 'member', {
        data: mockRegularMember,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.member?.role).toBe('member')
    })

    it('should return false when no member exists', async () => {
      setupAuthMocks(mockSupabase, null)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(false)
      expect(result.current.member).toBeNull()
    })
  })

  describe('findMemberByUserId', () => {
    it('should fetch member data from Edge Function', async () => {
      const mockUser = createMockUser({ id: 'test-user-id' })
      setupAuthMocks(mockSupabase, mockUser)
      mockEdgeFunctionResponse(mockSupabase, 'member', {
        data: mockRegularMember,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Advance timers in case any retries are needed
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        expect.stringContaining('member?user_id='),
        { method: 'GET' }
      )
      expect(result.current.member).toEqual(mockRegularMember)
    })



    it('should handle Edge Function errors gracefully', async () => {
      const mockUser = createMockUser()
      setupAuthMocks(mockSupabase, mockUser)

      // Mock Edge Function to fail with network error
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.member).toBeNull()
    })
  })


  describe('signInWithDiscord', () => {
    it('should call Supabase OAuth with Discord provider', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.signInWithDiscord()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin + '/app',
        },
      })
    })

    it('should throw error on sign in failure', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({
        data: null,
        error: new Error('OAuth failed'),
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(result.current.signInWithDiscord()).rejects.toThrow('OAuth failed')
    })
  })

  describe('signInWithGoogle', () => {
    it('should call Supabase OAuth with Google provider', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await result.current.signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
        },
      })
    })
  })

  describe('signOut', () => {
    it('should clear user and member state', async () => {
      const mockUser = createMockUser()
      setupAuthMocks(mockSupabase, mockUser)
      mockEdgeFunctionResponse(mockSupabase, 'member', {
        data: mockAdminMember,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      // Wait for initial auth to complete
      await waitFor(() => {
        expect(result.current.user).not.toBeNull()
      })

      // Sign out
      await result.current.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()

      // Wait for state to update after sign out
      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.member).toBeNull()
      })
    })
  })

  describe('refreshMemberData', () => {
    it('should refetch member data', async () => {
      const mockUser = createMockUser({ id: 'test-user-id' })
      setupAuthMocks(mockSupabase, mockUser)

      const updatedMember = { ...mockRegularMember, points: 999 }
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({ data: mockRegularMember, error: null }) // Initial load
        .mockResolvedValueOnce({ data: updatedMember, error: null }) // Refresh

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.member?.points).toBe(50)
      })

      // Refresh member data
      await result.current.refreshMemberData()

      await waitFor(() => {
        expect(result.current.member?.points).toBe(999)
      })
    })

    it('should not fetch if no user is logged in', async () => {
      setupAuthMocks(mockSupabase, null)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const callsBefore = mockSupabase.functions.invoke.mock.calls.length

      await result.current.refreshMemberData()

      // Should not have made additional calls
      expect(mockSupabase.functions.invoke.mock.calls.length).toBe(callsBefore)
    })
  })

  describe('Duplicate prevention', () => {
    it('should not process same user twice simultaneously', async () => {
      const mockUser = createMockUser({ id: 'test-user-id' })
      setupAuthMocks(mockSupabase, mockUser)
      mockEdgeFunctionResponse(mockSupabase, 'member', {
        data: mockRegularMember,
      })

      renderHook(() => useAuth(), { wrapper: AuthProvider })

      // The processingUserIdRef should prevent duplicate calls
      // This is tested implicitly by the fact that we only expect one call
      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(1)
      })
    })
  })
})

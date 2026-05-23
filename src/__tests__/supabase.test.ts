import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'

const mockGetSession = vi.fn()
const mockRefreshSession = vi.fn()
const mockInvoke = vi.fn()

vi.mock('@supabase/supabase-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>()
  return {
    ...actual,
    createClient: () => ({
      auth: {
        getSession: mockGetSession,
        refreshSession: mockRefreshSession,
      },
      functions: {
        invoke: mockInvoke,
      },
      storage: {
        from: () => ({
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.example.com/${path}` } }),
        }),
      },
    }),
  }
})

// Import after mock is set up
const { invokeFunction, getAvatarUrl } = await import('../supabase')

describe('invokeFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null })
    mockRefreshSession.mockResolvedValue({ data: { session: {} }, error: null })
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })
  })

  it('calls getSession before functions.invoke', async () => {
    const callOrder: string[] = []
    mockGetSession.mockImplementation(async () => {
      callOrder.push('getSession')
      return { data: { session: {} }, error: null }
    })
    mockInvoke.mockImplementation(async () => {
      callOrder.push('invoke')
      return { data: null, error: null }
    })

    await invokeFunction('member', { method: 'GET' })

    expect(callOrder).toEqual(['getSession', 'invoke'])
  })

  it('passes name and options through to functions.invoke', async () => {
    const options = { method: 'POST' as const, body: { id: '123' } }
    await invokeFunction('club', options)

    expect(mockInvoke).toHaveBeenCalledWith('club', options)
  })

  it('returns the result from functions.invoke', async () => {
    const expected = { data: { id: 'club-1', name: 'Test Club' }, error: null }
    mockInvoke.mockResolvedValue(expected)

    const result = await invokeFunction('club')

    expect(result).toEqual(expected)
  })

  it('calls getSession even when functions.invoke returns a non-auth error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Not found') })

    await invokeFunction('member')

    expect(mockGetSession).toHaveBeenCalledOnce()
    expect(mockInvoke).toHaveBeenCalledOnce()
  })

  it('calls getSession with no options when options are omitted', async () => {
    await invokeFunction('server')

    expect(mockInvoke).toHaveBeenCalledWith('server', undefined)
  })

  it('retries once with a fresh session on 401', async () => {
    const auth401 = new FunctionsHttpError({ status: 401 } as Response)
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: auth401 })
      .mockResolvedValueOnce({ data: { ok: true }, error: null })

    const result = await invokeFunction('book', { method: 'GET' })

    expect(mockRefreshSession).toHaveBeenCalledOnce()
    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ data: { ok: true }, error: null })
  })

  it('does not retry on non-401 errors', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Server error') })

    await invokeFunction('book', { method: 'GET' })

    expect(mockRefreshSession).not.toHaveBeenCalled()
    expect(mockInvoke).toHaveBeenCalledOnce()
  })

  it('returns the 401 error if session refresh itself fails', async () => {
    const auth401 = new FunctionsHttpError({ status: 401 } as Response)
    mockInvoke.mockResolvedValue({ data: null, error: auth401 })
    mockRefreshSession.mockResolvedValue({ data: { session: null }, error: new Error('Refresh failed') })

    const result = await invokeFunction('book', { method: 'GET' })

    expect(mockInvoke).toHaveBeenCalledOnce()
    expect(result.error).toBe(auth401)
  })
})

describe('getAvatarUrl', () => {
  it('returns the public URL for a given avatar path', () => {
    const url = getAvatarUrl('avatars/user-123.jpg')
    expect(url).toBe('https://storage.example.com/avatars/user-123.jpg')
  })
})

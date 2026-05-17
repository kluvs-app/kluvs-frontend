import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockInvoke = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
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
}))

// Import after mock is set up
const { invokeFunction, getAvatarUrl } = await import('../supabase')

describe('invokeFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null })
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

  it('calls getSession even when functions.invoke returns an error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Not found') })

    await invokeFunction('member')

    expect(mockGetSession).toHaveBeenCalledOnce()
    expect(mockInvoke).toHaveBeenCalledOnce()
  })

  it('calls getSession with no options when options are omitted', async () => {
    await invokeFunction('server')

    expect(mockInvoke).toHaveBeenCalledWith('server', undefined)
  })
})

describe('getAvatarUrl', () => {
  it('returns the public URL for a given avatar path', () => {
    const url = getAvatarUrl('avatars/user-123.jpg')
    expect(url).toBe('https://storage.example.com/avatars/user-123.jpg')
  })
})

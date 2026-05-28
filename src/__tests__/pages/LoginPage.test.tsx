import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../pages/LoginPage'

vi.mock('../../supabase', () => {
  const mockClient = {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn(),
      updateUser: vi.fn(),
      refreshSession: vi.fn(),
    },
    functions: { invoke: vi.fn() },
  }
  return {
    supabase: mockClient,
    invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
  }
})

let mockSupabase: any

beforeEach(async () => {
  const mod = await import('../../supabase')
  mockSupabase = mod.supabase as any
  vi.clearAllMocks()

  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mockSupabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })
  mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null })
  mockSupabase.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: null })
  mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
  mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: null })
  mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null })
})

function renderPage() {
  return render(<MemoryRouter><LoginPage /></MemoryRouter>)
}

// ─── Sign-in state (default) ──────────────────────────────────────────────

describe('LoginPage — sign-in state', () => {
  it('renders the voice phrase heading', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back'))
  })

  it('renders the sign-in subhead', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/sign in to keep reading together/i)).toBeInTheDocument())
  })

  it('renders the Kluvs mark link', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument())
  })

  it('renders Discord OAuth button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /continue with discord/i })).toBeInTheDocument())
  })

  it('renders Google OAuth button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument())
  })

  it('renders Apple OAuth button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument())
  })

  it('renders email and password inputs', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    })
  })

  it('renders the Sign in submit button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument())
  })

  it('renders Sign up linkbar button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /^sign up$/i })).toBeInTheDocument())
  })

  it('renders Forgot it? linkbar button', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('button', { name: /forgot it\?/i })).toBeInTheDocument())
  })

  it('renders the footer tagline', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/reading is done best together/i)).toBeInTheDocument())
  })

  it('renders Privacy footer link', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('link', { name: /^privacy$/i })).toBeInTheDocument())
  })

  it('renders Terms footer link', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByRole('link', { name: /^terms$/i })).toBeInTheDocument())
  })
})

// ─── Sign-up state ────────────────────────────────────────────────────────

describe('LoginPage — sign-up state', () => {
  it('switches to sign-up mode on "Sign up" click', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome in')
  })

  it('shows sign-up subhead', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByText(/bring your books/i)).toBeInTheDocument()
  })

  it('shows "Sign up with Discord" provider label in sign-up mode', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByRole('button', { name: /sign up with discord/i })).toBeInTheDocument()
  })

  it('shows "Sign up with Google" provider label in sign-up mode', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
  })

  it('shows "Create account" submit button', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows "Already have an account? Sign in" link in sign-up mode', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.getByRole('button', { name: /already have an account/i })).toBeInTheDocument()
  })

  it('hides "Forgot it?" in sign-up mode', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.queryByRole('button', { name: /forgot it/i })).not.toBeInTheDocument()
  })

  it('switches back to sign-in from sign-up', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /already have an account/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
  })
})

// ─── Forgot password state ────────────────────────────────────────────────

describe('LoginPage — forgot password state', () => {
  async function goToForgot() {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /forgot it\?/i }))
    await user.click(screen.getByRole('button', { name: /forgot it\?/i }))
    return user
  }

  it('shows "Forgot it?" voice phrase', async () => {
    await goToForgot()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Forgot it?')
  })

  it('shows forgot subhead', async () => {
    await goToForgot()
    expect(screen.getByText(/drop your email/i)).toBeInTheDocument()
  })

  it('shows back link to sign in', async () => {
    await goToForgot()
    expect(screen.getByRole('button', { name: /← sign in|sign in/i })).toBeInTheDocument()
  })

  it('hides OAuth buttons in forgot mode', async () => {
    await goToForgot()
    expect(screen.queryByRole('button', { name: /continue with discord/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
  })

  it('hides password field in forgot mode', async () => {
    await goToForgot()
    expect(screen.queryByPlaceholderText(/password/i)).not.toBeInTheDocument()
  })

  it('shows only email field', async () => {
    await goToForgot()
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
  })

  it('shows "Send reset link" submit button', async () => {
    await goToForgot()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('back link returns to sign-in state', async () => {
    const user = await goToForgot()
    const backBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(backBtn)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
  })
})

// ─── Reset link sent state ────────────────────────────────────────────────

describe('LoginPage — reset link sent state', () => {
  async function goToResetSent() {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /forgot it\?/i }))
    await user.click(screen.getByRole('button', { name: /forgot it\?/i }))
    await user.type(screen.getByPlaceholderText(/email address/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => screen.getByText(/reset link sent to/i))
    return user
  }

  it('shows "Check your inbox" voice phrase', async () => {
    await goToResetSent()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Check your inbox')
  })

  it('shows the confirmation card with eyebrow', async () => {
    await goToResetSent()
    expect(screen.getByText(/reset link sent to/i)).toBeInTheDocument()
  })

  it('shows the submitted email address in the card', async () => {
    await goToResetSent()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows the one-hour expiry message', async () => {
    await goToResetSent()
    expect(screen.getByText(/good for one hour/i)).toBeInTheDocument()
  })

  it('shows "Back to sign in" link', async () => {
    await goToResetSent()
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument()
  })

  it('"Back to sign in" returns to sign-in state', async () => {
    const user = await goToResetSent()
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back')
  })

  it('calls resetPasswordForEmail with the entered email', async () => {
    await goToResetSent()
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.anything()
    )
  })
})

// ─── Confirmation sent state ──────────────────────────────────────────────

describe('LoginPage — confirmation sent state', () => {
  async function goToConfirmSent() {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user', email_confirmed_at: null }, session: null },
      error: null,
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    await user.type(screen.getByPlaceholderText(/email address/i), 'new@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => screen.getByText(/confirmation sent to/i))
    return user
  }

  it('shows "Let the reading begin" voice phrase', async () => {
    await goToConfirmSent()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Let the reading begin')
  })

  it('shows confirmation card eyebrow', async () => {
    await goToConfirmSent()
    expect(screen.getByText(/confirmation sent to/i)).toBeInTheDocument()
  })

  it('shows the submitted email in the card', async () => {
    await goToConfirmSent()
    expect(screen.getByText('new@example.com')).toBeInTheDocument()
  })

  it('shows the finish setup message', async () => {
    await goToConfirmSent()
    expect(screen.getByText(/finish setting up your account/i)).toBeInTheDocument()
  })

  it('shows "Try a different email" link', async () => {
    await goToConfirmSent()
    expect(screen.getByRole('button', { name: /try a different email/i })).toBeInTheDocument()
  })

  it('"Try a different email" resets to sign-up form', async () => {
    const user = await goToConfirmSent()
    await user.click(screen.getByRole('button', { name: /try a different email/i }))
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
  })

  it('shows Resend link', async () => {
    await goToConfirmSent()
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument()
  })
})

// ─── OAuth handlers ───────────────────────────────────────────────────────

describe('LoginPage — OAuth handlers', () => {
  it('calls signInWithOAuth with discord on Discord button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /continue with discord/i }))
    await user.click(screen.getByRole('button', { name: /continue with discord/i }))
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'discord' })
    )
  })

  it('calls signInWithOAuth with google on Google button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /continue with google/i }))
    await user.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('calls signInWithOAuth with apple on Apple button click', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /continue with apple/i }))
    await user.click(screen.getByRole('button', { name: /continue with apple/i }))
    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'apple' })
    )
  })

  it('disables all buttons while an OAuth redirect is in progress', async () => {
    mockSupabase.auth.signInWithOAuth.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /continue with discord/i }))
    await user.click(screen.getByRole('button', { name: /continue with discord/i }))
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeDisabled()
  })

  it('re-enables buttons if OAuth throws', async () => {
    mockSupabase.auth.signInWithOAuth.mockRejectedValue(new Error('OAuth failed'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /continue with discord/i }))
    await user.click(screen.getByRole('button', { name: /continue with discord/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /continue with discord/i })).not.toBeDisabled()
    )
  })
})

// ─── Email sign-in form ───────────────────────────────────────────────────

describe('LoginPage — email sign-in form', () => {
  it('calls signInWithPassword with entered credentials', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByPlaceholderText(/email address/i))
    await user.type(screen.getByPlaceholderText(/email address/i), 'user@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'mypassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'mypassword',
    })
  })

  it('shows "Signing in…" label while submitting', async () => {
    mockSupabase.auth.signInWithPassword.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByPlaceholderText(/email address/i))
    await user.type(screen.getByPlaceholderText(/email address/i), 'user@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'mypassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
  })

  it('disables form inputs while submitting', async () => {
    mockSupabase.auth.signInWithPassword.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByPlaceholderText(/email address/i))
    await user.type(screen.getByPlaceholderText(/email address/i), 'user@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'mypassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByPlaceholderText(/email address/i)).toBeDisabled()
    expect(screen.getByPlaceholderText(/password/i)).toBeDisabled()
  })

  it('shows error banner on sign-in failure', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByPlaceholderText(/email address/i))
    await user.type(screen.getByPlaceholderText(/email address/i), 'user@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument())
  })

  it('clears error when switching to sign-up mode', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByPlaceholderText(/email address/i))
    await user.type(screen.getByPlaceholderText(/email address/i), 'user@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
  })
})

// ─── Email sign-up form ───────────────────────────────────────────────────

describe('LoginPage — email sign-up form', () => {
  beforeEach(() => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user', email_confirmed_at: null }, session: null },
      error: null,
    })
  })

  it('calls signUp with entered credentials', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    await user.type(screen.getByPlaceholderText(/email address/i), 'new@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'newpassword')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'newpassword',
    })
  })

  it('shows "Creating account…" label while submitting', async () => {
    mockSupabase.auth.signUp.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    await user.type(screen.getByPlaceholderText(/email address/i), 'new@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'newpassword')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
  })

  it('shows error banner on sign-up failure', async () => {
    mockSupabase.auth.signUp.mockRejectedValue(new Error('Email already in use'))
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByRole('button', { name: /^sign up$/i }))
    await user.click(screen.getByRole('button', { name: /^sign up$/i }))
    await user.type(screen.getByPlaceholderText(/email address/i), 'taken@example.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(screen.getByText(/email already in use/i)).toBeInTheDocument())
  })
})

// ─── Loading state ────────────────────────────────────────────────────────

describe('LoginPage — loading state', () => {
  it('shows a spinner when AuthContext is loading', async () => {
    mockSupabase.auth.getSession.mockImplementation(() => new Promise(() => {}))
    renderPage()
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    )
  })

  it('does not render the form while loading', async () => {
    mockSupabase.auth.getSession.mockImplementation(() => new Promise(() => {}))
    renderPage()
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeInTheDocument())
    expect(screen.queryByPlaceholderText(/email address/i)).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock useAuth
const mockSignInWithDiscord = vi.fn()
const mockSignInWithGoogle = vi.fn()
const mockSignInWithEmail = vi.fn()
const mockSignUpWithEmail = vi.fn()
const mockResetPasswordForEmail = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    loading: false,
    signInWithDiscord: mockSignInWithDiscord,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
    resetPasswordForEmail: mockResetPasswordForEmail,
  }),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignInWithDiscord.mockResolvedValue(undefined)
    mockSignInWithGoogle.mockResolvedValue(undefined)
    mockSignInWithEmail.mockResolvedValue(undefined)
    mockSignUpWithEmail.mockResolvedValue({ needsConfirmation: false })
    mockResetPasswordForEmail.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should display welcome heading', () => {
      renderLoginPage()

      expect(screen.getByText('Welcome to your Kluvs')).toBeInTheDocument()
    })

    it('should display sign in subtitle', () => {
      renderLoginPage()

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    })

    it('should show Discord sign in button', () => {
      renderLoginPage()

      expect(screen.getByRole('button', { name: /Continue with Discord/i })).toBeInTheDocument()
    })

    it('should show Google sign in button', () => {
      renderLoginPage()

      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
    })

    it('should show Supabase footer text', () => {
      renderLoginPage()

      expect(screen.getByText(/Secure authentication powered by Supabase/i)).toBeInTheDocument()
    })
  })

  describe('Discord Sign In', () => {
    it('should call signInWithDiscord on click', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Discord/i }))

      expect(mockSignInWithDiscord).toHaveBeenCalledTimes(1)
    })

    it('should show loading state during Discord sign in', async () => {
      mockSignInWithDiscord.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Discord/i }))

      await waitFor(() => {
        expect(screen.getByText('Connecting to Discord...')).toBeInTheDocument()
      })
    })

    it('should disable both buttons during Discord sign in', async () => {
      mockSignInWithDiscord.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Discord/i }))

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
          expect(button).toBeDisabled()
        })
      })
    })
  })

  describe('Google Sign In', () => {
    it('should call signInWithGoogle on click', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Google/i }))

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
    })

    it('should show loading state during Google sign in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Google/i }))

      await waitFor(() => {
        expect(screen.getByText('Connecting to Google...')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should recover from Discord sign in error', async () => {
      mockSignInWithDiscord.mockRejectedValue(new Error('OAuth failed'))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Discord/i }))

      // After error, button should be re-enabled with original text
      await waitFor(() => {
        expect(screen.getByText('Continue with Discord')).toBeInTheDocument()
      })
    })

    it('should recover from Google sign in error', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('OAuth failed'))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /Continue with Google/i }))

      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument()
      })
    })
  })

  describe('Email Sign In', () => {
    it('should render email and password input fields', () => {
      renderLoginPage()

      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('should render Sign In button by default', () => {
      renderLoginPage()

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should call signInWithEmail on form submit', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const signInButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      expect(mockSignInWithEmail).toHaveBeenCalledWith('user@example.com', 'password123')
    })

    it('should show loading state during email sign in', async () => {
      mockSignInWithEmail.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const signInButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Signing in…')).toBeInTheDocument()
      })
    })

    it('should disable form fields during email sign in', async () => {
      mockSignInWithEmail.mockImplementation(() => new Promise(() => {}))
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByPlaceholderText('Email address') as HTMLInputElement
      const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
      const signInButton = screen.getByRole('button', { name: 'Sign In' }) as HTMLButtonElement

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(signInButton)

      await waitFor(() => {
        expect(emailInput.disabled).toBe(true)
        expect(passwordInput.disabled).toBe(true)
        expect(signInButton.disabled).toBe(true)
      })
    })

    it('should display error message on sign in failure', async () => {
      mockSignInWithEmail.mockRejectedValue(new Error('Invalid credentials'))
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const signInButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('should clear error when retrying', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(new Error('Invalid credentials'))
      mockSignInWithEmail.mockResolvedValueOnce(undefined)
      const user = userEvent.setup()
      renderLoginPage()

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const signInButton = screen.getByRole('button', { name: 'Sign In' })

      // First attempt with error
      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Second attempt - error should disappear
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correctpassword')
      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
      })
    })
  })

  describe('Home Link', () => {
    it('should render the logo as a link to kluvs.com', () => {
      renderLoginPage()
      const homeLink = screen.getByRole('link', { name: /back to home/i })
      expect(homeLink).toHaveAttribute('href', 'https://kluvs.com')
    })

    it('should render the Kluvs logo image inside the home link', () => {
      renderLoginPage()
      const logo = screen.getByAltText('Kluvs')
      expect(logo.closest('a')).toHaveAttribute('href', 'https://kluvs.com')
    })
  })

  describe('Forgot Password', () => {
    it('should show "Forgot password?" button in sign-in mode', () => {
      renderLoginPage()
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument()
    })

    it('should not show "Forgot password?" button in sign-up mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByText("Don't have an account? Sign up"))

      expect(screen.queryByRole('button', { name: /forgot password/i })).not.toBeInTheDocument()
    })

    it('should switch to reset mode when "Forgot password?" is clicked', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))

      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument()
    })

    it('should call resetPasswordForEmail on submit', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      await user.type(screen.getByPlaceholderText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
      })
    })

    it('should show confirmation after reset email is sent', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      await user.type(screen.getByPlaceholderText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument()
      })
    })

    it('should show error when reset email fails', async () => {
      mockResetPasswordForEmail.mockRejectedValueOnce(new Error('Rate limit exceeded'))
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      await user.type(screen.getByPlaceholderText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
      })
    })

    it('should return to sign-in from reset form via "Back to sign in"', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      await user.click(screen.getByRole('button', { name: /back to sign in/i }))

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should return to sign-in from reset confirmation via "Back to sign in"', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      await user.click(screen.getByRole('button', { name: /forgot password/i }))
      await user.type(screen.getByPlaceholderText('Email address'), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /back to sign in/i }))

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })
  })

  describe('Email Sign Up', () => {
    it('should toggle to sign up mode when clicking toggle link', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      const toggleLink = screen.getByText("Don't have an account? Sign up")
      await user.click(toggleLink)

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('should toggle back to sign in mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      const signUpToggle = screen.getByText("Don't have an account? Sign up")
      await user.click(signUpToggle)

      const signInToggle = screen.getByText('Already have an account? Sign in')
      await user.click(signInToggle)

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('should call signUpWithEmail on sign up submit', async () => {
      const user = userEvent.setup()
      renderLoginPage()

      const signUpToggle = screen.getByText("Don't have an account? Sign up")
      await user.click(signUpToggle)

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const createButton = screen.getByRole('button', { name: 'Create Account' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(createButton)

      expect(mockSignUpWithEmail).toHaveBeenCalledWith('newuser@example.com', 'password123')
    })

    it('should show confirmation message when needsConfirmation is true', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({ needsConfirmation: true })
      const user = userEvent.setup()
      renderLoginPage()

      const signUpToggle = screen.getByText("Don't have an account? Sign up")
      await user.click(signUpToggle)

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const createButton = screen.getByRole('button', { name: 'Create Account' })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument()
        expect(screen.getByText(/We sent a confirmation link to/)).toBeInTheDocument()
      })
    })

    it('should allow trying another email after confirmation', async () => {
      mockSignUpWithEmail.mockResolvedValueOnce({ needsConfirmation: true })
      const user = userEvent.setup()
      renderLoginPage()

      const signUpToggle = screen.getByText("Don't have an account? Sign up")
      await user.click(signUpToggle)

      const emailInput = screen.getByPlaceholderText('Email address')
      const passwordInput = screen.getByPlaceholderText('Password')
      const createButton = screen.getByRole('button', { name: 'Create Account' })

      await user.type(emailInput, 'user@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Check your inbox')).toBeInTheDocument()
      })

      const tryAnotherButton = screen.getByRole('button', { name: 'Try another email' })
      await user.click(tryAnotherButton)

      // Form should reappear
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })
  })
})

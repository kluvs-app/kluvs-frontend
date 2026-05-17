import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { loading, signInWithDiscord, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [signingIn, setSigningIn] = useState<'discord' | 'google' | 'email' | null>(null)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleDiscordSignIn = async () => {
    try {
      setSigningIn('discord')
      await signInWithDiscord()
    } catch (error) {
      console.error('Discord sign in failed:', error)
      setSigningIn(null)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn('google')
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in failed:', error)
      setSigningIn(null)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    try {
      setSigningIn('email')
      if (emailMode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        const { needsConfirmation } = await signUpWithEmail(email, password)
        if (needsConfirmation) {
          setConfirmationSent(true)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setEmailError(message)
    } finally {
      setSigningIn(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent mx-auto"></div>
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" aria-label="Back to home">
            <img src="/ic-mark.svg" alt="Kluvs" className="h-16 w-16 mx-auto mb-6 hover:opacity-80 transition-opacity" />
          </Link>
          <h1 className="text-page-heading text-[var(--color-text-primary)] mb-2">
            Welcome to your Kluvs
          </h1>
          <p className="text-[var(--color-text-secondary)] text-body-lg">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-4">
            {/* Discord Button */}
            <button
              onClick={handleDiscordSignIn}
              disabled={signingIn !== null}
              className="w-full flex items-center justify-center gap-3 bg-discord hover:bg-discord-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-btn font-medium text-body-lg transition-colors"
            >
              {signingIn === 'discord' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Connecting to Discord...</span>
                </>
              ) : (
                <>
                  <img src="/ic-discord.svg" alt="" className="h-5 w-5" />
                  <span>Continue with Discord</span>
                </>
              )}
            </button>

            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn !== null}
              className="w-full flex items-center justify-center gap-3 bg-google-bg hover:bg-google-bg-hover dark:bg-google-bg dark:hover:bg-google-bg-hover disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-google-text dark:text-google-text px-6 py-3 rounded-btn font-medium text-body-lg transition-colors"
            >
              {signingIn === 'google' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-google-text border-t-transparent"></div>
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <img src="/ic-google.svg" alt="" className="h-5 w-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Email Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-divider)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-bg)] text-[var(--color-text-secondary)]">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          {confirmationSent ? (
            <div className="p-4 bg-[var(--color-surface-1)] rounded-[10px] border border-[var(--color-divider)]">
              <p className="text-center text-[var(--color-text-primary)] font-medium">
                Check your inbox
              </p>
              <p className="text-center text-[var(--color-text-secondary)] text-body-sm mt-2">
                We sent a confirmation link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => {
                  setConfirmationSent(false)
                  setEmail('')
                  setPassword('')
                }}
                className="w-full mt-4 text-center text-primary hover:opacity-80 font-medium text-body-sm"
              >
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={signingIn !== null}
                className="w-full px-4 py-2.5 bg-[var(--color-surface-1)] border border-[var(--color-divider)] rounded-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={signingIn !== null}
                className="w-full px-4 py-2.5 bg-[var(--color-surface-1)] border border-[var(--color-divider)] rounded-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
              {emailError && (
                <p className="text-red-400 text-body-sm text-center">{emailError}</p>
              )}
              <button
                type="submit"
                disabled={signingIn !== null}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium text-body-lg transition-colors"
              >
                {signingIn === 'email' ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>{emailMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  emailMode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')
                    setEmailError(null)
                  }}
                  disabled={signingIn !== null}
                  className="text-primary hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-body-sm transition-opacity"
                >
                  {emailMode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[var(--color-divider)] space-y-2">
          <p className="text-center text-[var(--color-text-secondary)] text-helper">
            Secure authentication powered by Supabase
          </p>
          <p className="text-center text-helper space-x-3">
            <Link
              to="/privacy"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-[var(--color-divider)]">·</span>
            <Link
              to="/terms"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              Terms of Use
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

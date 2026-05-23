import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import KluvsSpinner from '../components/KluvsSpinner'

export default function LoginPage() {
  const { loading, signInWithDiscord, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth()
  const [signingIn, setSigningIn] = useState<'discord' | 'google' | 'email' | null>(null)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    try {
      setSigningIn('email')
      await resetPasswordForEmail(email)
      setResetSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      setEmailError(message)
    } finally {
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
          <KluvsSpinner size={64} className="mx-auto" />
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
          <a href="https://kluvs.com" aria-label="Back to home" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-10 w-auto mx-auto dark:hidden" />
            <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-10 w-auto mx-auto hidden dark:block" />
          </a>
          <h1 className="text-page-heading font-serif text-[var(--color-text-primary)] mb-2">
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
                  <KluvsSpinner size={20} color="#ffffff" />
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
                  <KluvsSpinner size={20} color="#1a1a1a" />
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

          {/* Reset password form */}
          {emailMode === 'reset' && (
            resetSent ? (
              <div className="p-4 bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] text-center space-y-2">
                <p className="text-[var(--color-text-primary)] font-medium">Check your inbox</p>
                <p className="text-[var(--color-text-secondary)] text-body">
                  We sent a reset link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => { setEmailMode('signin'); setResetSent(false); setEmail('') }}
                  className="mt-2 text-primary hover:opacity-80 font-medium text-body transition-opacity"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={signingIn !== null}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-1)] border border-[var(--color-divider)] rounded-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
                {emailError && (
                  <p className="text-danger text-body text-center">{emailError}</p>
                )}
                <button
                  type="submit"
                  disabled={signingIn !== null}
                  className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium text-body-lg transition-colors"
                >
                  {signingIn === 'email' ? 'Sending…' : 'Send reset link'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setEmailMode('signin'); setEmailError(null) }}
                    disabled={signingIn !== null}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 text-body transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )
          )}

          {/* Email Form */}
          {emailMode !== 'reset' && (confirmationSent ? (
            <div className="p-4 bg-[var(--color-surface-1)] rounded-[10px] border border-[var(--color-divider)]">
              <p className="text-center text-[var(--color-text-primary)] font-medium">
                Check your inbox
              </p>
              <p className="text-center text-[var(--color-text-secondary)] text-helper mt-2">
                We sent a confirmation link to <strong>{email}</strong>
              </p>
              <button
                onClick={() => {
                  setConfirmationSent(false)
                  setEmail('')
                  setPassword('')
                }}
                className="w-full mt-4 text-center text-primary hover:opacity-80 font-medium text-helper"
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
                <p className="text-danger text-body text-center">{emailError}</p>
              )}
              <button
                type="submit"
                disabled={signingIn !== null}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium text-body-lg transition-colors"
              >
                {signingIn === 'email' ? (
                  <>
                    <KluvsSpinner size={16} color="#ffffff" className="mr-2" />
                    <span>{emailMode === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                  </>
                ) : (
                  emailMode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')
                    setEmailError(null)
                  }}
                  disabled={signingIn !== null}
                  className="text-primary hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-body transition-opacity"
                >
                  {emailMode === 'signin'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
                {emailMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setEmailMode('reset'); setEmailError(null) }}
                    disabled={signingIn !== null}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 text-body transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[var(--color-divider)] space-y-2">
          <p className="text-center text-[var(--color-text-secondary)] text-helper">
            Secure authentication powered by Supabase
          </p>
          <p className="text-center text-helper space-x-3">
            <a
              href="https://kluvs.com/privacy"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-[var(--color-divider)]">·</span>
            <a
              href="https://kluvs.com/terms"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
            >
              Terms of Use
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

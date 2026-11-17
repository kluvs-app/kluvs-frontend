import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DiscordIcon from '../components/icons/DiscordIcon'
import Button from '../components/ui/Button'

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23z" />
      <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18a10.997 10.997 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="#FFFFFF" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

const inputBase =
  't-body-m w-full h-11 px-4 bg-[var(--color-input-bg)] rounded-input text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-[10px] bg-danger-subtle border border-danger-border-soft rounded-input">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-[1px] text-[var(--color-danger)]" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <p className="t-caption text-[var(--color-danger)]">{message}</p>
    </div>
  )
}

function ConfirmCard({ eyebrow, email, body }: { eyebrow: string; email: string; body: string }) {
  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-card py-5 px-[22px] text-center">
      <span className="t-eyebrow block text-[var(--color-text-secondary)] mb-[10px]">
        {eyebrow}
      </span>
      <p className="t-body-m text-[var(--color-text-primary)] break-all mb-[14px]">
        {email}
      </p>
      <p className="t-caption text-[var(--color-text-secondary)]">
        {body}
      </p>
    </div>
  )
}

export default function LoginPage() {
  const { loading, signInWithDiscord, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useAuth()
  const [signingIn, setSigningIn] = useState<'discord' | 'google' | 'apple' | 'email' | null>(null)
  const [emailMode, setEmailMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const isBusy = signingIn !== null

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

  const handleAppleSignIn = async () => {
    try {
      setSigningIn('apple')
      await signInWithApple()
    } catch (error) {
      console.error('Apple sign in failed:', error)
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
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent" />
      </div>
    )
  }

  const isResetSent = emailMode === 'reset' && resetSent
  const isConfirmSent = emailMode !== 'reset' && confirmationSent
  const isForgotMode = emailMode === 'reset' && !resetSent
  const isSignUp = emailMode === 'signup' && !confirmationSent
  const isSignIn = emailMode === 'signin'

  let voicePhrase = 'Welcome back'
  if (isSignUp) voicePhrase = 'Welcome in'
  if (isForgotMode) voicePhrase = 'Forgot it?'
  if (isResetSent) voicePhrase = 'Check your inbox'
  if (isConfirmSent) voicePhrase = 'Let the reading begin'

  let subhead: string | null = 'Sign in to keep reading together.'
  if (isSignUp) subhead = 'Bring your books. Bring your people. Read together.'
  if (isForgotMode) subhead = "Drop your email and we'll send a link to set a new password."
  if (isResetSent || isConfirmSent) subhead = null

  const providerLabel = (name: string) => isSignUp ? `Sign up with ${name}` : `Continue with ${name}`

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Back link — forgot screen only */}
        {isForgotMode && (
          <Button type="button" onClick={() => { setEmailMode('signin'); setEmailError(null) }} variant="text" emphasized className="gap-1.5 mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Sign in
          </Button>
        )}

        {/* Masthead */}
        <div className="text-center mb-9">
          <a href="https://kluvs.com" aria-label="Back to home">
            <img src="/ic-mark.svg" alt="" className="w-16 h-16 mx-auto mb-[22px] hover:opacity-80 transition-opacity" />
          </a>
          <h1 className="t-headline-l t-feature text-[var(--color-text-primary)] mb-3 [text-wrap:pretty]">
            {voicePhrase}
          </h1>
          {subhead && (
            <p className="t-body-m text-[var(--color-text-secondary)] max-w-[320px] mx-auto">
              {subhead}
            </p>
          )}
        </div>

        {/* Reset sent */}
        {isResetSent && (
          <>
            <ConfirmCard
              eyebrow="Reset link sent to"
              email={email}
              body="Open the link from your email to choose a new password. The link is good for one hour."
            />
            <div className="mt-5 text-center">
              <Button type="button" onClick={() => { setEmailMode('signin'); setResetSent(false); setEmail('') }} variant="text" emphasized>
                Back to sign in
              </Button>
            </div>
          </>
        )}

        {/* Confirmation sent */}
        {isConfirmSent && (
          <>
            <ConfirmCard
              eyebrow="Confirmation sent to"
              email={email}
              body="Open the link from your email to finish setting up your account."
            />
            <div className="mt-5 flex justify-center items-center gap-[14px]">
              <Button type="button" onClick={() => { setConfirmationSent(false); setEmail(''); setPassword('') }} variant="text" emphasized>
                Try a different email
              </Button>
              <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-disabled)] flex-shrink-0 inline-block" aria-hidden="true" />
              <Button type="button" onClick={() => signUpWithEmail(email, password).catch(() => {})} variant="text">
                Resend
              </Button>
            </div>
          </>
        )}

        {/* Forgot password form — email only */}
        {isForgotMode && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-[10px]">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isBusy}
              className={`${inputBase} border ${emailError ? 'border-[var(--color-danger)]' : 'border-[var(--color-input-border)]'}`}
            />
            {emailError && <ErrorBanner message={emailError} />}
            <div className="mt-1">
              <Button type="submit" disabled={isBusy} variant="primary" size="lg" className="w-full h-11 border border-primary disabled:bg-[var(--color-bg-elevated)] disabled:border-[var(--color-input-border)] disabled:text-[var(--color-text-secondary)]">
                {signingIn === 'email' ? 'Sending…' : 'Send reset link'}
              </Button>
            </div>
          </form>
        )}

        {/* Main sign-in / sign-up form */}
        {(isSignIn || isSignUp) && (
          <>
            {/* OAuth row */}
            <div className={`flex flex-col gap-[10px] transition-opacity ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}>
              <Button type="button" onClick={handleDiscordSignIn} disabled={isBusy} variant="social" className="bg-discord hover:bg-discord-hover text-white">
                <DiscordIcon className="h-[18px] w-[18px]" />
                <span>{providerLabel('Discord')}</span>
              </Button>
              <Button type="button" onClick={handleGoogleSignIn} disabled={isBusy} variant="social" className="bg-google-bg hover:bg-google-bg-hover border border-google-stroke text-google-text">
                <GoogleGlyph />
                <span>{providerLabel('Google')}</span>
              </Button>
              <Button type="button" onClick={handleAppleSignIn} disabled={isBusy} variant="social" className="bg-black hover:opacity-90 text-white">
                <AppleGlyph />
                <span>{providerLabel('Apple')}</span>
              </Button>
            </div>

            {/* "or with email" divider */}
            <div className="flex items-center gap-3 my-[18px]">
              <div className="flex-1 h-px bg-[var(--color-divider)]" />
              <span className="t-eyebrow text-[var(--color-text-secondary)]">
                or with email
              </span>
              <div className="flex-1 h-px bg-[var(--color-divider)]" />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-[10px]">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isBusy}
                className={`${inputBase} border ${emailError && emailMode === 'signup' ? 'border-[var(--color-danger)]' : 'border-[var(--color-input-border)]'}`}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isBusy}
                className={`${inputBase} border ${emailError && emailMode === 'signin' ? 'border-[var(--color-danger)]' : 'border-[var(--color-input-border)]'}`}
              />
              {emailError && <ErrorBanner message={emailError} />}
              <div className="mt-1">
                <Button type="submit" disabled={isBusy} variant="primary" size="lg" className="w-full h-11 border border-primary disabled:bg-[var(--color-bg-elevated)] disabled:border-[var(--color-input-border)] disabled:text-[var(--color-text-secondary)]">
                  {signingIn === 'email'
                    ? (emailMode === 'signin' ? 'Signing in…' : 'Creating account…')
                    : (emailMode === 'signin' ? 'Sign in' : 'Create account')}
                </Button>
              </div>
            </form>

            {/* Linkbar */}
            <div className="flex justify-between items-center mt-[18px]">
              <Button type="button" onClick={() => { setEmailMode(emailMode === 'signin' ? 'signup' : 'signin'); setEmailError(null) }} disabled={isBusy} variant="text" emphasized>
                {emailMode === 'signin' ? 'Sign up' : 'Already have an account? Sign in'}
              </Button>
              {emailMode === 'signin' && (
                <Button type="button" onClick={() => { setEmailMode('reset'); setEmailError(null) }} disabled={isBusy} variant="text">
                  Forgot it?
                </Button>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-9 pt-[22px] border-t border-[var(--color-divider)] text-center">
          <p className="t-title-s t-feature text-[var(--color-text-meta)] mb-[14px]">
            Reading is done best together.
          </p>
          <div className="inline-flex items-center gap-3">
            <a
              href="https://kluvs.com/privacy"
              className="t-eyebrow text-[var(--color-text-secondary)] no-underline hover:opacity-80 transition-opacity"
            >
              Privacy
            </a>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-disabled)] flex-shrink-0 inline-block" aria-hidden="true" />
            <a
              href="https://kluvs.com/terms"
              className="t-eyebrow text-[var(--color-text-secondary)] no-underline hover:opacity-80 transition-opacity"
            >
              Terms
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

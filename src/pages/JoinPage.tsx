import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, invokeFunction } from '../supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import KluvsSpinner from '../components/KluvsSpinner'

interface ClubPreview {
  id: string
  name: string
}

interface ErrorDisplay {
  title: string
  description: string
}

/**
 * Maps backend error messages (from `{ success: false, error: "..." }` responses)
 * to user-facing titles and descriptions.
 */
function getErrorDisplay(msg: string): ErrorDisplay {
  if (msg.includes('Invalid or expired')) {
    return {
      title: 'Invite Expired',
      description: 'This invite link is no longer valid. Ask a club admin to generate a fresh one.',
    }
  }
  if (msg.includes('Club not found')) {
    return {
      title: 'Club Not Found',
      description: 'This club no longer exists or has been removed.',
    }
  }
  if (msg.includes('Member not found')) {
    return {
      title: 'Account Error',
      description: "We couldn't find your account. Try signing out and back in.",
    }
  }
  if (msg.includes('Authentication required')) {
    return {
      title: 'Sign In Required',
      description: 'Please sign in to join this club.',
    }
  }
  console.error('[JoinPage] unhandled error:', msg)
  return {
    title: 'Something Went Wrong',
    description: 'Please try again. If the problem persists, contact support.',
  }
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [clubPreview, setClubPreview] = useState<ClubPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    let cancelled = false

    const init = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch club preview — raw fetch because this is a public endpoint that does
        //    not require a Supabase auth session (no Authorization header needed).
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/join?token=${encodeURIComponent(token)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
          }
        )

        if (cancelled) return

        if (!res.ok) {
          // Parse the backend's { success: false, error: "..." } body when available.
          let errorMsg = 'Invalid or expired invite'
          try {
            const errJson = await res.json()
            if (errJson.error) errorMsg = errJson.error
          } catch { /* ignore parse failure — use the default */ }
          setError(errorMsg)
          setLoading(false)
          return
        }

        const json = await res.json()
        if (cancelled) return

        if (!json.valid) {
          setError(json.error || 'Invalid or expired invite')
          setLoading(false)
          return
        }

        setClubPreview(json.club)

        // 2. Check if already authenticated
        const { data: sessionData } = await supabase.auth.getSession()
        if (cancelled) return

        if (sessionData?.session) {
          // Auto-join: user returned from OAuth or already signed in
          setJoining(true)
          const { data, error: joinError } = await invokeFunction<{ success: boolean; club_id: string }>('join', {
            method: 'POST',
            body: { token },
          })
          if (cancelled) return

          if (joinError) {
            const msg = (joinError as { message?: string }).message || ''
            if (msg.includes('Already a member')) {
              navigate('/app', { replace: true })
              return
            }
            setError(msg || 'Failed to join club')
            setJoining(false)
          } else if (data?.success) {
            navigate('/app', { replace: true })
          }
        }
      } catch {
        if (!cancelled) setError('Something went wrong. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [token, navigate])

  const handleJoin = async () => {
    if (!token) return

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData?.session) {
      // Trigger Discord OAuth; user returns to this page after auth
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/join/${token}`,
        },
      })
      return
    }

    // Already authenticated — join now
    try {
      setJoining(true)
      const { data, error: joinError } = await invokeFunction<{ success: boolean; club_id: string }>('join', {
        method: 'POST',
        body: { token },
      })

      if (joinError) {
        const msg = (joinError as { message?: string }).message || ''
        if (msg.includes('Already a member')) {
          navigate('/app', { replace: true })
          return
        }
        setError(msg || 'Failed to join club')
      } else if (data?.success) {
        navigate('/app', { replace: true })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {loading || joining ? (
          <div className="text-center">
            <KluvsSpinner size={48} className="mx-auto" />
            <p className="mt-5 text-[var(--color-text-secondary)] text-sm">
              {joining ? 'Joining club…' : 'Loading invite…'}
            </p>
          </div>
        ) : error ? (
          <div className="max-w-sm w-full text-center">
            <div
              className="rounded-2xl p-8 mb-6"
              style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-divider)' }}
            >
              <p className="font-serif text-[28px] font-medium text-[var(--color-text-primary)] mb-3">
                {getErrorDisplay(error).title}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {getErrorDisplay(error).description}
              </p>
            </div>
          </div>
        ) : clubPreview ? (
          <div className="max-w-sm w-full text-center">
            <div
              className="rounded-2xl p-8 mb-6"
              style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-divider)' }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.14em] mb-4"
                style={{ color: '#D16D30' }}
              >
                You're invited
              </p>
              <h1 className="font-serif text-[40px] font-medium leading-[1.1] text-[var(--color-text-primary)] mb-6 tracking-[-0.015em]">
                {clubPreview.name}
              </h1>
              <button
                onClick={handleJoin}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-btn text-sm font-medium transition-colors"
              >
                Join {clubPreview.name}
              </button>
            </div>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              You'll be asked to sign in if you haven't already.
            </p>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}

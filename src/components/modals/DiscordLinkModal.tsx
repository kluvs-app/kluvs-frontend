import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import KluvsSpinner from '../KluvsSpinner'

interface DiscordLinkModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DiscordLinkModal({ isOpen, onClose }: DiscordLinkModalProps) {
  const [oauthLoading, setOauthLoading] = useState(false)
  const [oauthError, setOauthError] = useState('')

  const handleOAuthLink = async () => {
    try {
      setOauthLoading(true)
      setOauthError('')

      // linkIdentity initiates an OAuth redirect — execution stops here.
      // discord_id is set by a backend trigger on auth.identities INSERT.
      const { error } = await supabase.auth.linkIdentity({
        provider: 'discord',
        options: { redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL }
      })
      if (error) throw error
    } catch (err: unknown) {
      console.error('Error linking Discord:', err)
      setOauthError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to connect Discord'
      )
    } finally {
      setOauthLoading(false)
    }
  }

  const handleClose = () => {
    if (!oauthLoading) {
      setOauthError('')
      onClose()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !oauthLoading) handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, oauthLoading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-discord-link">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="modal-title-discord-link" className="text-card-heading text-[var(--color-text-primary)]">Connect Discord</h2>
            <p className="text-helper text-[var(--color-text-secondary)]">Link your Discord account</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            disabled={oauthLoading}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Section 1: OAuth */}
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Sign in with Discord to link your account automatically.
          </p>
          {oauthError && (
            <p className="text-sm text-danger">{oauthError}</p>
          )}
          <button
            onClick={handleOAuthLink}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 bg-discord hover:bg-discord-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-btn font-medium text-body-lg transition-colors"
          >
            {oauthLoading ? (
              <>
                <KluvsSpinner size={20} color="#ffffff" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <img src="/ic-discord.svg" alt="" className="h-5 w-5" />
                <span>Sign in with Discord</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--color-divider)]">
          <button
            onClick={handleClose}
            disabled={oauthLoading}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

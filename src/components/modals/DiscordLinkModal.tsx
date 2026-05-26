import { useState } from 'react'
import { supabase } from '../../supabase'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Discord"
      loading={oauthLoading}
      labelId="modal-title-discord-link"
      footer={
        <button
          onClick={handleClose}
          disabled={oauthLoading}
          className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >Cancel</button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Sign in with Discord to link your account automatically.
        </p>
        {oauthError && (
          <p className="text-sm text-danger">{oauthError}</p>
        )}
        <button
          onClick={handleOAuthLink}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-3 bg-discord hover:bg-discord-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-btn font-medium text-sm transition-colors"
        >
          {oauthLoading ? (
            <>
              <KluvsSpinner size={16} color="#ffffff" />
              <span>Connecting…</span>
            </>
          ) : (
            <>
              <img src="/ic-discord.svg" alt="" className="h-5 w-5" />
              <span>Sign in with Discord</span>
            </>
          )}
        </button>
      </div>
    </BaseModal>
  )
}

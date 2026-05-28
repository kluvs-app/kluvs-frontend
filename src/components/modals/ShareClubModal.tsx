import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface ShareClubModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club
}

export default function ShareClubModal({ isOpen, onClose, club }: ShareClubModalProps) {
  const [policy, setPolicy] = useState<'PRIVATE' | 'INVITE_LINK'>(club.join_policy)
  const [inviteToken, setInviteToken] = useState<string | null>(club.invite_token ?? null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sync local state whenever the modal is (re-)opened, so stale data from a
  // previous open or a parent re-render never leaks in.
  useEffect(() => {
    if (isOpen) {
      setPolicy(club.join_policy)
      setInviteToken(club.invite_token ?? null)
      setError(null)
      setCopied(false)
    }
  }, [isOpen, club.join_policy, club.invite_token])

  const inviteUrl = inviteToken ? `${window.location.origin}/join/${inviteToken}` : null

  const handlePolicyChange = async (newPolicy: 'PRIVATE' | 'INVITE_LINK') => {
    if (newPolicy === policy || loading) return
    setError(null)
    try {
      setLoading(true)
      const { data, error } = await invokeFunction<{ club: Club }>('club', {
        method: 'PUT',
        body: { id: club.id, join_policy: newPolicy },
      })
      if (error) throw error
      setPolicy(newPolicy)
      setInviteToken(data?.club?.invite_token ?? null)
    } catch (err) {
      // Policy state stays unchanged (optimistic revert) — surface the failure to the user.
      setError((err as { message?: string }).message || 'Failed to update sharing settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Club"
      labelId="modal-title-share-club"
    >
      <div className="space-y-6">
        {/* Who can join? */}
        <div>
          <p
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: 12,
            }}
          >
            Who can join?
          </p>

          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-input-border)' }}
          >
            <button
              onClick={() => handlePolicyChange('PRIVATE')}
              disabled={loading}
              className={[
                'flex-1 py-2.5 text-sm font-medium transition-colors duration-120 disabled:opacity-60 disabled:cursor-not-allowed',
                policy === 'PRIVATE'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(242,237,229,0.04)]',
              ].join(' ')}
            >
              Private
            </button>
            <button
              onClick={() => handlePolicyChange('INVITE_LINK')}
              disabled={loading}
              className={[
                'flex-1 py-2.5 text-sm font-medium transition-colors duration-120 disabled:opacity-60 disabled:cursor-not-allowed',
                policy === 'INVITE_LINK'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(242,237,229,0.04)]',
              ].join(' ')}
            >
              Invite Link
            </button>
          </div>
        </div>

        {/* Inline error */}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Invite URL row — shown when INVITE_LINK */}
        {policy === 'INVITE_LINK' && (
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <KluvsSpinner size={16} />
                <span>Generating link…</span>
              </div>
            ) : inviteUrl ? (
              <div
                className="flex items-center gap-3 rounded-input px-4 py-3"
                style={{
                  background: 'var(--color-input-bg)',
                  border: '1px solid var(--color-input-border)',
                }}
              >
                <p
                  className="flex-1 min-w-0 text-sm text-[var(--color-text-secondary)] truncate font-mono"
                  title={inviteUrl}
                >
                  {inviteUrl}
                </p>
                <button
                  onClick={handleCopy}
                  className={[
                    'shrink-0 text-sm font-medium transition-colors duration-120',
                    copied ? 'text-[#48A480]' : 'text-primary hover:text-primary-hover',
                  ].join(' ')}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </BaseModal>
  )
}

import { useState } from 'react'
import { invokeFunction, getAvatarUrl } from '../../supabase'
import type { Club, Member } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import Avatar from '../ui/Avatar'
import BaseModal from './BaseModal'

interface EndSessionModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club
  onSessionEnded: () => void
}

export default function EndSessionModal({
  isOpen,
  onClose,
  club,
  onSessionEnded,
}: EndSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readingMembers = (club.active_session?.members ?? [])
    .filter(sm => sm.is_reading)
    .map(sm => club.members.find(m => m.id === sm.member_id))
    .filter((m): m is Member => m != null)
  const readingCount = readingMembers.length

  const handleConfirm = async () => {
    if (!club.active_session) return
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await invokeFunction<{ success: boolean; members_credited: number }>(
        'session',
        { method: 'PUT', body: { id: club.active_session.id, finish: true } }
      )
      if (err) throw err
      onClose()
      onSessionEnded()
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to end session'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setError(null)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="End Session"
      titleVariant="danger"
      loading={loading}
      labelId="modal-title-end-session"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Ending…' : 'Confirm End'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          Are you sure you want to end the current reading session for{' '}
          <span className="font-semibold">"{club.active_session?.book?.title}"</span>?
        </p>

        {readingMembers.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {readingMembers.slice(0, 8).map(m => (
                <div key={m.id} className="border-[1.5px] border-[var(--color-bg-raised)] rounded-full">
                  <Avatar
                    name={m.name}
                    userId={String(m.id)}
                    imageUrl={m.avatar_path ? getAvatarUrl(m.avatar_path) : null}
                    size="sm"
                  />
                </div>
              ))}
              {readingMembers.length > 8 && (
                <div className="w-5 h-5 rounded-full bg-[#4D4033] border-[1.5px] border-[var(--color-bg-raised)] text-[9px] text-white flex items-center justify-center font-medium flex-shrink-0">
                  +{readingMembers.length - 8}
                </div>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {readingCount} member{readingCount !== 1 ? 's' : ''} will receive credit.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No members are marked as reading — no credit will be awarded.
          </p>
        )}

        <p className="text-xs text-[var(--color-text-secondary)] opacity-70">
          To adjust who gets credit, cancel and update the participation list first.
        </p>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
      </div>
    </BaseModal>
  )
}

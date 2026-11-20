import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, ClubMember, SessionFinishResponse } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import AvatarStack from '../ui/AvatarStack'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

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
    .map(sm => club.members?.find(m => m.id === sm.member_id))
    .filter((m): m is ClubMember => m != null)
  const readingCount = readingMembers.length

  const handleConfirm = async () => {
    if (!club.active_session) return
    setLoading(true)
    setError(null)
    try {
      const { error: err } = await invokeFunction<SessionFinishResponse>(
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
          <Button
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Ending…' : 'Confirm End'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="t-body-m text-[var(--color-text-primary)]">
          Are you sure you want to end the current reading session for{' '}
          <span className="t-label">"{club.active_session?.book?.title}"</span>?
        </p>

        {readingMembers.length > 0 ? (
          <div className="flex items-center gap-3">
            <AvatarStack
              members={readingMembers}
              max={8}
              size="sm"
              borderColor="var(--color-bg-raised)"
            />
            <p className="t-body-m text-[var(--color-text-secondary)]">
              {readingCount} member{readingCount !== 1 ? 's' : ''} will receive credit.
            </p>
          </div>
        ) : (
          <p className="t-body-m text-[var(--color-text-secondary)]">
            No members are marked as reading, so no credit will be awarded.
          </p>
        )}

        <p className="t-fine-print text-[var(--color-text-secondary)] opacity-70">
          To adjust who gets credit, cancel and update the participation list first.
        </p>

        {error && (
          <p className="t-body-m text-danger">{error}</p>
        )}
      </div>
    </BaseModal>
  )
}

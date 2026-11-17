import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Discussion } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

interface DeleteDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  discussionToDelete: Discussion | null
  selectedClub: Club
  onDiscussionDeleted: () => void
  onError: (error: string) => void
}

export default function DeleteDiscussionModal({
  isOpen,
  onClose,
  discussionToDelete,
  selectedClub,
  onDiscussionDeleted,
  onError
}: DeleteDiscussionModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!discussionToDelete || !selectedClub?.active_session) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction<null>(
        `discussion?id=${encodeURIComponent(discussionToDelete.id)}`,
        { method: 'DELETE' }
      )
      if (error) throw error
      onClose()
      onDiscussionDeleted()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to delete discussion'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!discussionToDelete) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Discussion"
      titleVariant="danger"
      loading={loading}
      labelId="modal-title-delete-discussion"
      footer={
        <>
          <Button
            variant="text"
            onClick={onClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Deleting…' : <span>Delete Discussion</span>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="t-body-m text-[var(--color-text-primary)]">
          Are you sure you want to delete{' '}
          <span className="font-medium">"{discussionToDelete.title}"</span>?
        </p>
        <p className="t-body-m text-[var(--color-text-secondary)]">This action cannot be undone</p>
        <div
          className="rounded-input px-4 py-3 space-y-1"
          style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
        >
          <p className="t-eyebrow text-danger mb-2">This will permanently delete:</p>
          <p className="t-body-m text-[var(--color-text-secondary)]">The discussion event</p>
          <p className="t-body-m text-[var(--color-text-secondary)]">All associated details</p>
        </div>
      </div>
    </BaseModal>
  )
}

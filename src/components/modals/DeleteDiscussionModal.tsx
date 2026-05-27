import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Discussion } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

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
      const { error } = await invokeFunction('session', {
        method: 'PUT',
        body: {
          id: selectedClub.active_session.id,
          discussions: selectedClub.active_session.discussions,
          discussion_ids_to_delete: [discussionToDelete.id]
        }
      })
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
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Deleting…' : <span>Delete Discussion</span>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-semibold">"{discussionToDelete.title}"</span>?
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">This action cannot be undone</p>
        <div
          className="rounded-input px-4 py-3 space-y-1"
          style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
        >
          <p className="text-xs font-medium text-danger uppercase tracking-wider mb-2">This will permanently delete:</p>
          <p className="text-sm text-[var(--color-text-secondary)]">The discussion event</p>
          <p className="text-sm text-[var(--color-text-secondary)]">All associated details</p>
        </div>
      </div>
    </BaseModal>
  )
}

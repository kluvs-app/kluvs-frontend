import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Discussion } from '../../types'
import KluvsSpinner from '../KluvsSpinner'

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

      console.log('Deleting discussion:', discussionToDelete)

      const requestBody = {
        id: selectedClub.active_session.id,
        discussions: selectedClub.active_session.discussions,
        discussion_ids_to_delete: [discussionToDelete.id]
      }

      const { data, error } = await invokeFunction('session', {
        method: 'PUT',
        body: requestBody
      })

      if (error) throw error

      console.log('Request body:', requestBody)
      console.log('Discussion deleted successfully:', data)
      console.log('Fetching fresh club details...')

      onClose()
      onDiscussionDeleted()

    } catch (err: unknown) {
      console.error('Error deleting discussion:', err)
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to delete discussion'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!isOpen || !discussionToDelete) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-delete-discussion">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-12 w-12 bg-danger/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 id="modal-title-delete-discussion" className="text-card-heading text-[var(--color-text-primary)]">Delete Discussion</h2>
            <p className="text-helper text-[var(--color-text-secondary)]">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning Content */}
        <div className="mb-6">
          <p className="text-[var(--color-text-primary)] mb-3">
            Are you sure you want to delete <span className="font-bold text-primary">"{discussionToDelete.title}"</span>?
          </p>
          <div className="bg-danger/10 border border-danger/20 rounded-input p-4">
            <p className="text-danger text-body font-medium mb-2">This will permanently delete:</p>
            <ul className="text-[var(--color-text-secondary)] text-body space-y-1 ml-4">
              <li>- The discussion event</li>
              <li>- All associated details</li>
              <li>- Cannot be recovered</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-danger hover:bg-danger-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <KluvsSpinner size={16} color="#ffffff" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Discussion</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

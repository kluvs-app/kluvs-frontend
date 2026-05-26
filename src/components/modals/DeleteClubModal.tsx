import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface DeleteClubModalProps {
  isOpen: boolean
  onClose: () => void
  clubToDelete: { id: string; name: string } | null
  selectedServer: string
  selectedClub: Club | null
  onClubDeleted: () => void
  onError: (error: string) => void
}

export default function DeleteClubModal({
  isOpen,
  onClose,
  clubToDelete,
  selectedServer,
  onClubDeleted,
  onError,
}: DeleteClubModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!clubToDelete) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction(
        `club?id=${encodeURIComponent(clubToDelete.id)}&server_id=${encodeURIComponent(selectedServer)}`,
        { method: 'DELETE' }
      )
      if (error) throw error
      onClose()
      onClubDeleted()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to delete club'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!clubToDelete) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Club"
      titleVariant="danger"
      loading={loading}
      labelId="modal-title-delete-club"
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
            data-testid="modal-club-delete"
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            <span>{loading ? 'Deleting…' : 'Delete Club'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-semibold">"{clubToDelete.name}"</span>?
          This action cannot be undone.
        </p>
        <div
          className="rounded-input px-4 py-3 space-y-1"
          style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
        >
          <p className="text-xs font-medium text-danger uppercase tracking-wider mb-2">This will permanently delete:</p>
          <p className="text-sm text-[var(--color-text-secondary)]">All reading sessions and books</p>
          <p className="text-sm text-[var(--color-text-secondary)]">All discussions and events</p>
          <p className="text-sm text-[var(--color-text-secondary)]">All member associations</p>
        </div>
      </div>
    </BaseModal>
  )
}

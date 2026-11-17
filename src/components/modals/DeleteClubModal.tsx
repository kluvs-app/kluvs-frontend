import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, DeleteResponse } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

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
      const { error } = await invokeFunction<DeleteResponse>(
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
          <Button
            variant="text"
            onClick={onClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
            data-testid="modal-club-delete"
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            <span>{loading ? 'Deleting…' : 'Delete Club'}</span>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="t-body-m text-[var(--color-text-primary)]">
          Are you sure you want to delete{' '}
          <span className="font-medium">"{clubToDelete.name}"</span>?
          This action cannot be undone.
        </p>
        <div
          className="rounded-input px-4 py-3 space-y-1"
          style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
        >
          <p className="t-eyebrow text-danger mb-2">This will permanently delete:</p>
          <p className="t-body-m text-[var(--color-text-secondary)]">All reading sessions and books</p>
          <p className="t-body-m text-[var(--color-text-secondary)]">All discussions and events</p>
          <p className="t-body-m text-[var(--color-text-secondary)]">All member associations</p>
        </div>
      </div>
    </BaseModal>
  )
}

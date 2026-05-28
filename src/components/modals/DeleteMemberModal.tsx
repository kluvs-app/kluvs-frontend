import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Member } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface DeleteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberToDelete: Member | null
  onMemberDeleted: () => void
  onError: (error: string) => void
}

export default function DeleteMemberModal({
  isOpen,
  onClose,
  memberToDelete,
  onMemberDeleted,
  onError
}: DeleteMemberModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!memberToDelete) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction(`member?id=${encodeURIComponent(memberToDelete.id)}`, {
        method: 'DELETE'
      })
      if (error) throw error
      onClose()
      onMemberDeleted()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to delete member'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!memberToDelete) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Member"
      titleVariant="danger"
      loading={loading}
      labelId="modal-title-delete-member"
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
            {loading ? 'Deleting…' : <span>Delete Member</span>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          Are you sure you want to remove{' '}
          <span className="font-semibold">"{memberToDelete.name}"</span>{' '}
          from this club?
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">This action cannot be undone</p>
        <div
          className="rounded-input px-4 py-3 space-y-1"
          style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
        >
          <p className="text-xs font-medium text-danger uppercase tracking-wider mb-2">This will permanently:</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Remove them from this club</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Delete all member associations</p>
        </div>
      </div>
    </BaseModal>
  )
}

import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Member } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface DeleteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberToDelete: Member | null
  clubId: string
  onMemberDeleted: () => void
  onError: (error: string) => void
}

export default function DeleteMemberModal({
  isOpen,
  onClose,
  memberToDelete,
  clubId,
  onMemberDeleted,
  onError
}: DeleteMemberModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!memberToDelete) return
    try {
      setLoading(true)
      onError('')
      // Remove from this club only by sending the remaining clubs list.
      // The backend club GET returns clubs as string[] at runtime, but MemberClub[] in TS types.
      const remainingClubs = (memberToDelete.clubs as unknown as (string | { id: string })[])
        .map(c => typeof c === 'string' ? c : c.id)
        .filter(id => id !== clubId)
      const { error } = await invokeFunction('member', {
        method: 'PUT',
        body: { id: memberToDelete.id, clubs: remainingClubs }
      })
      if (error) throw error
      onClose()
      onMemberDeleted()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to remove member from club'
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
      title="Remove from Club"
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
            {loading ? 'Removing…' : <span>Remove from Club</span>}
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
        <p className="text-sm text-[var(--color-text-secondary)]">Their account and membership in other clubs will not be affected.</p>
      </div>
    </BaseModal>
  )
}

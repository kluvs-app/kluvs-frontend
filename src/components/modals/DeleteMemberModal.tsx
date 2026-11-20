import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { ClubMember, MemberRemoveFromClubResponse } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

interface DeleteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberToDelete: ClubMember | null
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
      // Removes only this club's membership. Authorized by the caller's role in the
      // club (owner/admin), unlike rewriting the target's `clubs` list, which requires
      // owning the target's record.
      const { error } = await invokeFunction<MemberRemoveFromClubResponse>('member', {
        method: 'PUT',
        body: { id: memberToDelete.id, remove_from_club: clubId }
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
            {loading ? 'Removing…' : <span>Remove from Club</span>}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="t-body-m text-[var(--color-text-primary)]">
          Are you sure you want to remove{' '}
          <span className="t-label">"{memberToDelete.name}"</span>{' '}
          from this club?
        </p>
        <p className="t-body-m text-[var(--color-text-secondary)]">Their account and membership in other clubs will not be affected.</p>
      </div>
    </BaseModal>
  )
}

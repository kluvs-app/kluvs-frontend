import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { DeleteResponse } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { member, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!member) return
    try {
      setLoading(true)
      setInlineError(null)
      const { error } = await invokeFunction<DeleteResponse>(`member?id=${encodeURIComponent(member.id)}`, { method: 'DELETE' })
      if (error) throw error
      await signOut()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      setInlineError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setInlineError(null)
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Account"
      titleVariant="danger"
      loading={loading}
      labelId="modal-title-delete-account"
      footer={
        <>
          <Button
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading || !member}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Deleting…' : 'Delete Account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="t-body-m text-[var(--color-text-primary)]">
          This will permanently delete your account and profile. This action is <span className="t-label">immediate and cannot be undone</span>.
        </p>
        <p className="t-body-m text-[var(--color-text-secondary)]">
          If you own a club, ownership will be automatically transferred to another member (an admin, if there is one), or the club will be deleted if you're its only member.
        </p>
        {inlineError && (
          <p className="t-body-m text-danger">{inlineError}</p>
        )}
      </div>
    </BaseModal>
  )
}

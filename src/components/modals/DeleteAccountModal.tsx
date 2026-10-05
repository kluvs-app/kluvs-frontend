import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

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
      const { error } = await invokeFunction(`member?id=${encodeURIComponent(member.id)}`, { method: 'DELETE' })
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
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Deleting…' : 'Delete Account'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          This will permanently delete your account and profile. This action is <span className="font-semibold">immediate and cannot be undone</span>.
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          If you're the sole admin of a club, ownership will be automatically transferred to another member — or the club will be deleted if you're its only member.
        </p>
        {inlineError && (
          <p className="text-sm text-red-400">{inlineError}</p>
        )}
      </div>
    </BaseModal>
  )
}

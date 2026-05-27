import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignOutModal({ isOpen, onClose }: SignOutModalProps) {
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      onClose()
    } catch (error) {
      console.error('Sign out error:', error)
      setLoading(false)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign Out?"
      loading={loading}
      labelId="modal-title-sign-out"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Signing out…' : 'Sign Out'}
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        You'll be redirected to the login page
      </p>
    </BaseModal>
  )
}

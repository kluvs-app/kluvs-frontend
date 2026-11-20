import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

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
          <Button
            variant="text"
            onClick={onClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="danger"
            onClick={handleSignOut}
            disabled={loading}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Signing out…' : 'Sign Out'}
          </Button>
        </>
      }
    >
      <p className="t-body-m text-[var(--color-text-secondary)]">
        You'll be redirected to the login page
      </p>
    </BaseModal>
  )
}

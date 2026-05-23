// src/components/modals/SignOutModal.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'

interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SignOutModal({
  isOpen,
  onClose
}: SignOutModalProps) {
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      // Close the modal after successful sign out
      onClose()
      // User state will change and App.tsx will show LoginPage
    } catch (error) {
      console.error('Sign out error:', error)
      setLoading(false)
      // Keep modal open on error so user can retry
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-sign-out">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-sm">
        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <h2 id="modal-title-sign-out" className="text-card-heading text-[var(--color-text-primary)] mb-2">Sign Out?</h2>
          <p className="text-helper text-[var(--color-text-secondary)]">You'll be redirected to the login page</p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between space-x-3">
          <button
            onClick={onClose}
            className="flex-1 text-[var(--color-text-primary)] px-4 py-2.5 rounded-btn font-medium transition-colors border border-[var(--color-divider)] hover:bg-[var(--color-bg-elevated)]"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex-1 bg-danger hover:bg-danger-hover text-white px-4 py-2.5 rounded-btn font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <KluvsSpinner size={16} color="#ffffff" />
            ) : (
              <span>Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

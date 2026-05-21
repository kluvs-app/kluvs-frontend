import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function SetNewPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    try {
      setSubmitting(true)
      await updatePassword(password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/" aria-label="Back to home">
            <img src="/ic-mark.svg" alt="Kluvs" className="h-16 w-16 mx-auto mb-6 hover:opacity-80 transition-opacity" />
          </Link>
          <h1 className="text-page-heading text-[var(--color-text-primary)] mb-2">
            Set new password
          </h1>
          <p className="text-[var(--color-text-secondary)] text-body-lg">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-[var(--color-surface-1)] border border-[var(--color-divider)] rounded-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-[var(--color-surface-1)] border border-[var(--color-divider)] rounded-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          {error && (
            <p className="text-danger text-body text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium text-body-lg transition-colors"
          >
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

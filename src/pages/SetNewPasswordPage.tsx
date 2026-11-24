import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'

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
          <h1 className="t-headline-s text-[var(--color-text-primary)] mb-2">
            Set new password
          </h1>
          <p className="text-[var(--color-text-secondary)] t-body-l">
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
            className="t-body-m w-full px-4 py-2.5 bg-[var(--color-bg-raised)] border border-[var(--color-divider)] rounded-input text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={submitting}
            className="t-body-m w-full px-4 py-2.5 bg-[var(--color-bg-raised)] border border-[var(--color-divider)] rounded-input text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          {error && (
            <p className="text-danger t-body-m text-center">{error}</p>
          )}
          <Button
            variant="primary" className="w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

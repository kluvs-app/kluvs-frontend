import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import { parseLocalDate } from '../../utils/dates'
import BaseModal from './BaseModal'

interface NewSessionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onSessionCreated: () => void
  onError: (error: string) => void
}

export default function NewSessionModal({
  isOpen,
  onClose,
  selectedClub,
  onSessionCreated,
  onError
}: NewSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [bookKey, setBookKey] = useState(0)

  const validateDueDate = (dateString: string): boolean => {
    if (!dateString) return true
    const selectedDate = parseLocalDate(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate > today
  }

  const handleSubmit = async () => {
    if (!selectedBookId) { onError('Please select a book'); return }
    if (!dueDate) { onError('Due date is required'); return }
    if (!validateDueDate(dueDate)) { onError('Due date must be in the future'); return }

    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction('session', {
        method: 'POST',
        body: { club_id: selectedClub.id, book_id: selectedBookId, due_date: dueDate }
      })
      if (error) throw error
      setSelectedBookId(null)
      setDueDate('')
      setBookKey(k => k + 1)
      onClose()
      onSessionCreated()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to create session'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedBookId(null)
    setDueDate('')
    setBookKey(k => k + 1)
    onError('')
    onClose()
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowString = tomorrow.toISOString().split('T')[0]

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Start New Session"
      loading={loading}
      labelId="modal-title-new-session"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedBookId || !dueDate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Creating...' : 'Start Session'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-[var(--color-text-secondary)]">Begin reading a new book</p>
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Book</label>
          <BookSearchInput
            key={bookKey}
            onSelect={setSelectedBookId}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={tomorrowString}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
          <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            When should members finish reading this book?
          </p>
        </div>

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Club</p>
          <p className="text-sm text-[var(--color-text-primary)]">{selectedClub.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Creating new reading session</p>
        </div>
      </div>
    </BaseModal>
  )
}

import { useState } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, SessionCreateResponse } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import { parseLocalDate } from '../../utils/dates'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

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
  const [allReading, setAllReading] = useState(true)

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
      const { error } = await invokeFunction<SessionCreateResponse>('session', {
        method: 'POST',
        body: { club_id: selectedClub.id, book_id: selectedBookId, due_date: dueDate, all_reading: allReading }
      })
      if (error) throw error
      setSelectedBookId(null)
      setDueDate('')
      setAllReading(true)
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
    setAllReading(true)
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
          <Button
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !selectedBookId || !dueDate}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Creating...' : 'Start Session'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="t-body-m text-[var(--color-text-secondary)]">Begin reading a new book</p>
        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Book</label>
          <BookSearchInput
            key={bookKey}
            onSelect={setSelectedBookId}
            disabled={loading}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={tomorrowString}
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
          <p className="t-fine-print mt-2 text-[var(--color-text-secondary)]">
            When should members finish reading this book?
          </p>
        </div>

        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Participation</label>
          <div className="flex items-center justify-between">
            <p className="t-body-m text-[var(--color-text-primary)]">
              {allReading ? 'All members reading' : 'No members reading (opt-in later)'}
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={allReading}
              disabled={loading}
              onClick={() => setAllReading(prev => !prev)}
              className={[
                'relative inline-flex w-9 h-5 rounded-full transition-colors duration-150 flex-shrink-0',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                allReading ? 'bg-primary' : 'bg-[var(--color-text-disabled)]',
              ].join(' ')}
            >
              <span className={[
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
                allReading ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')} />
            </button>
          </div>
        </div>

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="t-eyebrow text-[var(--color-text-secondary)] mb-1">Club</p>
          <p className="t-body-m text-[var(--color-text-primary)]">{selectedClub.name}</p>
          <p className="t-fine-print text-[var(--color-text-secondary)] mt-1">Creating new reading session</p>
        </div>
      </div>
    </BaseModal>
  )
}

import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, SessionUpdateResponse } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

interface EditBookModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onBookUpdated: () => void
  onError: (error: string) => void
}

export default function EditBookModal({
  isOpen,
  onClose,
  selectedClub,
  onBookUpdated,
  onError
}: EditBookModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (isOpen && selectedClub.active_session) {
      const session = selectedClub.active_session
      setSelectedBookId(session.book.id ?? null)
      setDueDate(session.due_date ? session.due_date.split('T')[0] : '')
    }
  }, [isOpen, selectedClub])

  const handleSubmit = async () => {
    if (!selectedBookId) { onError('Please select a book'); return }
    if (!selectedClub.active_session) { onError('No active session to update'); return }

    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction<SessionUpdateResponse>('session', {
        method: 'PUT',
        body: {
          id: selectedClub.active_session.id,
          book_id: selectedBookId,
          due_date: dueDate || undefined
        }
      })
      if (error) throw error
      onClose()
      onBookUpdated()
    } catch (err: unknown) {
      onError(
        err instanceof Error
          ? err.message
          : 'Failed to update book'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onError('')
    onClose()
  }

  if (!selectedClub.active_session) return null

  const currentBook = selectedClub.active_session.book

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Book"
      loading={loading}
      labelId="modal-title-edit-book"
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
            disabled={loading || !selectedBookId}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Updating…' : 'Update Book'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Book</label>
          <BookSearchInput
            key={isOpen ? 'open' : 'closed'}
            onSelect={setSelectedBookId}
            initialBook={currentBook}
            disabled={loading}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Due Date <span className="t-fine-print normal-case">(optional)</span></label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="t-eyebrow text-[var(--color-text-secondary)] mb-1">Club</p>
          <p className="t-body-m text-[var(--color-text-primary)]">{selectedClub.name}</p>
        </div>
      </div>
    </BaseModal>
  )
}

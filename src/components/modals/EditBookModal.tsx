import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

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
      const { error } = await invokeFunction('session', {
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
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
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
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedBookId}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Updating…' : 'Update Book'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
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
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Due Date <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Club</p>
          <p className="text-sm text-[var(--color-text-primary)]">{selectedClub.name}</p>
        </div>
      </div>
    </BaseModal>
  )
}

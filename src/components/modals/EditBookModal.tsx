import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'

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

  const handleBookSelect = (bookId: number) => {
    setSelectedBookId(bookId)
  }

  const handleSubmit = async () => {
    if (!selectedBookId) {
      onError('Please select a book')
      return
    }

    if (!selectedClub.active_session) {
      onError('No active session to update')
      return
    }

    try {
      setLoading(true)
      onError('')

      const requestBody = {
        id: selectedClub.active_session.id,
        book_id: selectedBookId,
        due_date: dueDate || undefined
      }

      console.log('Updating book:', requestBody)

      const { data, error } = await invokeFunction('session', {
        method: 'PUT',
        body: requestBody
      })

      if (error) throw error

      console.log('Book updated successfully:', data)

      onClose()
      onBookUpdated()

    } catch (err: unknown) {
      console.error('Error updating book:', err)
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!isOpen || !selectedClub.active_session) return null

  const currentBook = selectedClub.active_session.book

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-edit-book">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
            </div>
            <div>
              <h2 id="modal-title-edit-book" className="text-card-heading text-[var(--color-text-primary)]">Edit Book</h2>
              <p className="text-helper text-[var(--color-text-secondary)]">Update current reading details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            disabled={loading}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Form */}
        <div className="space-y-4">
          {/* Book Search */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Book <span className="text-primary">*</span>
            </label>
            <BookSearchInput
              key={isOpen ? 'open' : 'closed'}
              onSelect={handleBookSelect}
              initialBook={currentBook}
              disabled={loading}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              Search to change the book
            </p>
          </div>

          {/* Due Date Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Due Date <span className="text-[var(--color-text-secondary)]">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              When should members finish reading this book?
            </p>
          </div>

          {/* Club Context */}
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-3">
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">
              Club: <span className="text-[var(--color-text-primary)]">{selectedClub.name}</span>
            </p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              Updating active reading session
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-divider)]">
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !selectedBookId}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <KluvsSpinner size={16} color="#ffffff" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Book</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

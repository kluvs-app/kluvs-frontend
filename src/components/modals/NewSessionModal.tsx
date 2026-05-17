import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'

interface NewSessionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onSessionCreated: () => void
  onError: (error: string) => void
}

interface NewSessionFormData {
  title: string
  author: string
  year: string
  due_date: string
}

export default function NewSessionModal({
  isOpen,
  onClose,
  selectedClub,
  onSessionCreated,
  onError
}: NewSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NewSessionFormData>({
    title: '',
    author: '',
    year: '',
    due_date: ''
  })

  const validateDueDate = (dateString: string): boolean => {
    if (!dateString) return true // Optional field
    const selectedDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    return selectedDate > today
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      onError('Title and Author are required')
      return
    }

    if (!formData.due_date) {
      onError('Due date is required')
      return
    }

    if (!validateDueDate(formData.due_date)) {
      onError('Due date must be in the future')
      return
    }

    try {
      setLoading(true)
      onError('') // Clear any existing errors

      const requestBody = {
        club_id: selectedClub.id,
        book: {
          title: formData.title.trim(),
          author: formData.author.trim(),
          year: formData.year.trim() ? parseInt(formData.year.trim()) : undefined
        },
        due_date: formData.due_date
      }

      console.log('Creating new session:', requestBody)

      const { data, error } = await invokeFunction('session', {
        method: 'POST',
        body: requestBody
      })

      if (error) throw error

      console.log('Session created successfully:', data)

      // Reset form and close modal
      setFormData({ title: '', author: '', year: '', due_date: '' })
      onClose()

      // Notify parent component of successful creation
      onSessionCreated()

    } catch (err: unknown) {
      console.error('Error creating session:', err)
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
    setFormData({ title: '', author: '', year: '', due_date: '' })
    onError('') // Clear errors when closing
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  // Get tomorrow's date for min date validation
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowString = tomorrow.toISOString().split('T')[0]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-new-session">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
            <div>
              <h2 id="modal-title-new-session" className="text-card-heading text-[var(--color-text-primary)]">Start New Session</h2>
              <p className="text-helper text-[var(--color-text-secondary)]">Begin reading a new book</p>
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
          {/* Book Title Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Book Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., The Lord of the Rings"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={200}
            />
          </div>

          {/* Author Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Author <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              placeholder="e.g., J.R.R. Tolkien"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Year Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Publication Year <span className="text-[var(--color-text-secondary)]">(optional)</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              placeholder="e.g., 1954"
              min="1000"
              max={new Date().getFullYear() + 1}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>

          {/* Due Date Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Due Date <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              min={tomorrowString}
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
              Creating new reading session
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
            disabled={loading || !formData.title.trim() || !formData.author.trim() || !formData.due_date}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating...</span>
              </>
            ) : (
              <span>Start Session</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Discussion } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import { parseLocalDate } from '../../utils/dates'

interface DiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onDiscussionSaved: () => void
  onError: (error: string) => void
  editingDiscussion?: Discussion | null // If provided, we're editing instead of adding
}

interface DiscussionFormData {
  title: string
  date: string
  location: string
}

export default function DiscussionModal({
  isOpen,
  onClose,
  selectedClub,
  onDiscussionSaved,
  onError,
  editingDiscussion
}: DiscussionModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<DiscussionFormData>({
    title: '',
    date: '',
    location: ''
  })

  const isEditing = !!editingDiscussion

  // Pre-populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingDiscussion) {
        // Edit mode - pre-populate with existing data
        setFormData({
          title: editingDiscussion.title,
          date: editingDiscussion.date,
          location: editingDiscussion.location || ''
        })
      } else {
        // Add mode - reset to empty
        setFormData({
          title: '',
          date: '',
          location: ''
        })
      }
    }
  }, [isOpen, editingDiscussion])

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return false
    const selectedDate = parseLocalDate(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      onError('Discussion title is required')
      return
    }

    if (!formData.date) {
      onError('Discussion date is required')
      return
    }

    if (!validateDate(formData.date)) {
      onError('Discussion date must be today or in the future')
      return
    }

    if (!selectedClub.active_session) {
      onError('No active session found')
      return
    }

    try {
      setLoading(true)
      onError('') // Clear any existing errors

      const existingDiscussions = selectedClub.active_session.discussions || []
      let updatedDiscussions

      if (isEditing && editingDiscussion) {
        // Edit mode - update existing discussion
        updatedDiscussions = existingDiscussions.map(discussion =>
          discussion.id === editingDiscussion.id
            ? {
                id: discussion.id,
                title: formData.title.trim(),
                date: formData.date,
                location: formData.location.trim() || null
              }
            : discussion
        )
      } else {
        // Add mode - create new discussion
        const newDiscussion = {
          id: crypto.randomUUID(),
          title: formData.title.trim(),
          date: formData.date,
          location: formData.location.trim() || undefined
        }
        updatedDiscussions = [...existingDiscussions, newDiscussion]
      }

      const requestBody = {
        id: selectedClub.active_session.id,
        discussions: updatedDiscussions
      }

      console.log(`${isEditing ? 'Updating' : 'Adding'} discussion:`, requestBody)

      const { data, error } = await invokeFunction('session', {
        method: 'PUT',
        body: requestBody
      })

      if (error) throw error

      console.log(`Discussion ${isEditing ? 'updated' : 'added'} successfully:`, data)

      // Reset form and close modal
      setFormData({ title: '', date: '', location: '' })
      onClose()

      // Notify parent component of successful save
      onDiscussionSaved()

    } catch (err: unknown) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} discussion:`, err)
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : `Failed to ${isEditing ? 'update' : 'add'} discussion`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ title: '', date: '', location: '' })
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

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0]

  if (!isOpen || !selectedClub.active_session) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-discussion">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
            </div>
            <div>
              <h2 id="modal-title-discussion" className="text-card-heading text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Discussion' : 'Add Discussion'}
              </h2>
              <p className="text-helper text-[var(--color-text-secondary)]">
                {isEditing ? 'Update discussion details' : 'Schedule a new discussion event'}
              </p>
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
          {/* Discussion Title Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Discussion Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Chapter 1-5 Discussion"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={200}
            />
          </div>

          {/* Discussion Date Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Discussion Date <span className="text-primary">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={today}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              When will this discussion take place?
            </p>
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Location <span className="text-[var(--color-text-secondary)]">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Community Center, Discord Voice Chat"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              Where will the discussion happen?
            </p>
          </div>

          {/* Session Context */}
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-3">
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">
              Book: <span className="text-[var(--color-text-primary)]">{selectedClub.active_session.book.title}</span>
            </p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              {isEditing ? 'Updating discussion for' : 'Adding to'} current reading session
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
            disabled={loading || !formData.title.trim() || !formData.date}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <KluvsSpinner size={16} color="#ffffff" />
                <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Discussion' : 'Add Discussion'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

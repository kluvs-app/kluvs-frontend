import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Discussion } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import { parseLocalDate, scheduledAtToLocalParts, localPartsToScheduledAt } from '../../utils/dates'
import BaseModal from './BaseModal'

interface DiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onDiscussionSaved: () => void
  onError: (error: string) => void
  editingDiscussion?: Discussion | null
}

interface DiscussionFormData {
  title: string
  date: string
  time: string
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
  const [formData, setFormData] = useState<DiscussionFormData>({ title: '', date: '', time: '', location: '' })

  const isEditing = !!editingDiscussion

  useEffect(() => {
    if (isOpen) {
      if (editingDiscussion) {
        const { date, time } = scheduledAtToLocalParts(editingDiscussion.scheduled_at)
        setFormData({
          title: editingDiscussion.title,
          date,
          time,
          location: editingDiscussion.location || ''
        })
      } else {
        setFormData({ title: '', date: '', time: '', location: '' })
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
    if (!formData.title.trim()) { onError('Discussion title is required'); return }
    if (!formData.date) { onError('Discussion date is required'); return }
    if (!validateDate(formData.date)) { onError('Discussion date must be today or in the future'); return }
    if (!selectedClub.active_session) { onError('No active session found'); return }

    try {
      setLoading(true)
      onError('')

      const payload = {
        title: formData.title.trim(),
        scheduled_at: localPartsToScheduledAt(formData.date, formData.time.trim() || null),
        location: formData.location.trim() || null
      }

      const { error } = isEditing && editingDiscussion
        ? await invokeFunction('discussion', {
            method: 'PUT',
            body: { id: editingDiscussion.id, ...payload }
          })
        : await invokeFunction('discussion', {
            method: 'POST',
            body: { session_id: selectedClub.active_session.id, ...payload }
          })
      if (error) throw error

      setFormData({ title: '', date: '', time: '', location: '' })
      onClose()
      onDiscussionSaved()
    } catch (err: unknown) {
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
    setFormData({ title: '', date: '', time: '', location: '' })
    onError('')
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]

  if (!selectedClub.active_session) return null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Discussion' : 'Add Discussion'}
      loading={loading}
      labelId="modal-title-discussion"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.date}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading
              ? (isEditing ? 'Updating…' : 'Adding…')
              : <span>{isEditing ? 'Update Discussion' : 'Add Discussion'}</span>}
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
          }}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Chapters 1–5"
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            min={today}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
          }}>Time <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
          }}>Location <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Community Center, Discord"
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Reading Session</p>
          <p className="text-sm text-[var(--color-text-primary)]">{selectedClub.active_session.book.title}</p>
        </div>
      </div>
    </BaseModal>
  )
}

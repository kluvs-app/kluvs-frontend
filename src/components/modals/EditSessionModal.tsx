import { useState, useEffect } from 'react'
import { invokeFunction, getAvatarUrl } from '../../supabase'
import type { Club } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import Avatar from '../ui/Avatar'
import { parseLocalDate } from '../../utils/dates'
import BaseModal from './BaseModal'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onSessionUpdated: () => void
  onError: (error: string) => void
}

const labelStyle = {
  display: 'block' as const,
  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
  fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
  textTransform: 'uppercase' as const, color: 'var(--color-text-secondary)',
  marginBottom: 8,
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : fallback
}

export default function EditSessionModal({
  isOpen,
  onClose,
  selectedClub,
  onSessionUpdated,
  onError,
}: EditSessionModalProps) {
  const session = selectedClub.active_session
  const [view, setView] = useState<'edit' | 'changeBook'>('edit')
  const [loading, setLoading] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [readingMap, setReadingMap] = useState<Record<number, boolean>>({})
  const [newBookId, setNewBookId] = useState<number | null>(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [bookKey, setBookKey] = useState(0)

  useEffect(() => {
    if (!isOpen || !session) return
    setView('edit')
    setDueDate(session.due_date ? session.due_date.split('T')[0] : '')
    const map: Record<number, boolean> = {}
    for (const m of selectedClub.members) {
      const sm = session.members.find(s => s.member_id === m.id)
      map[m.id] = sm?.is_reading ?? false
    }
    setReadingMap(map)
    setNewBookId(null)
    setNewDueDate('')
    setBookKey(k => k + 1)
  }, [isOpen, session, selectedClub.members])

  if (!isOpen || !session) return null

  const validateDueDate = (dateString: string): boolean => {
    if (!dateString) return true
    const selectedDate = parseLocalDate(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate > today
  }

  const handleClose = () => {
    if (loading) return
    onError('')
    setView('edit')
    onClose()
  }

  const handleToggleReading = (memberId: number) => {
    setReadingMap(prev => ({ ...prev, [memberId]: !prev[memberId] }))
  }

  const handleSave = async () => {
    const origDueDate = session.due_date ? session.due_date.split('T')[0] : ''
    const dueDateChanged = dueDate !== origDueDate
    if (dueDateChanged && dueDate && !validateDueDate(dueDate)) { onError('Due date must be in the future'); return }

    const body: Record<string, unknown> = { id: session.id }
    if (dueDateChanged) body.due_date = dueDate || null

    const changedMembers = selectedClub.members
      .filter(m => readingMap[m.id] !== (session.members.find(s => s.member_id === m.id)?.is_reading ?? false))
      .map(m => ({ member_id: m.id, is_reading: readingMap[m.id] }))
    if (changedMembers.length > 0) body.session_members = changedMembers

    if (body.due_date === undefined && !body.session_members) {
      onClose()
      return
    }

    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction('session', { method: 'PUT', body })
      if (error) throw error
      onClose()
      onSessionUpdated()
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Failed to update session'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangeBook = async () => {
    if (!newBookId) { onError('Please select a book'); return }
    if (newDueDate && !validateDueDate(newDueDate)) { onError('Due date must be in the future'); return }

    try {
      setLoading(true)
      onError('')

      const { error: deleteError } = await invokeFunction(`session?id=${session.id}`, { method: 'DELETE' })
      if (deleteError) throw deleteError

      const { data, error: createError } = await invokeFunction<{ session: { id: string } }>('session', {
        method: 'POST',
        body: { club_id: selectedClub.id, book_id: newBookId, due_date: newDueDate || undefined, all_reading: false }
      })
      if (createError) throw createError
      if (!data) throw new Error('Failed to create new session')

      const readingMembers = session.members
        .filter(sm => sm.is_reading)
        .map(sm => ({ member_id: sm.member_id, is_reading: true }))
      if (readingMembers.length > 0) {
        await invokeFunction('session', { method: 'PUT', body: { id: data.session.id, session_members: readingMembers } })
      }

      onClose()
      onSessionUpdated()
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Failed to change book'))
    } finally {
      setLoading(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowString = tomorrow.toISOString().split('T')[0]

  if (view === 'changeBook') {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Change Book"
        titleVariant="danger"
        loading={loading}
        labelId="modal-title-edit-session"
        footer={
          <>
            <button
              onClick={() => setView('edit')}
              disabled={loading}
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >Back</button>
            <button
              onClick={handleChangeBook}
              disabled={loading || !newBookId}
              className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
            >
              {loading && <KluvsSpinner size={14} color="#ffffff" />}
              {loading ? 'Restarting…' : 'Restart with New Book'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            This will immediately end the current session for{' '}
            <span className="font-semibold">"{session.book?.title}"</span>. Its discussions and
            history will be permanently removed. Members currently marked as reading will carry
            over to the new session.
          </p>

          <div>
            <label style={labelStyle}>New Book</label>
            <BookSearchInput
              key={bookKey}
              onSelect={setNewBookId}
              disabled={loading}
            />
          </div>

          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={tomorrowString}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>
        </div>
      </BaseModal>
    )
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Session"
      loading={loading}
      labelId="modal-title-edit-session"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={tomorrowString}
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>

        <div>
          <label style={labelStyle}>Reading Members</label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedClub.members.map(m => {
              const isReading = readingMap[m.id] ?? false
              return (
                <div key={m.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={m.name}
                      userId={String(m.id)}
                      imageUrl={m.avatar_path ? getAvatarUrl(m.avatar_path) : null}
                      size="sm"
                    />
                    <span className="text-sm text-[var(--color-text-primary)]">{m.name}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isReading}
                    aria-label={`Toggle ${m.name} reading status`}
                    disabled={loading}
                    onClick={() => handleToggleReading(m.id)}
                    className={[
                      'relative inline-flex w-9 h-5 rounded-full transition-colors duration-150 flex-shrink-0',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      isReading ? 'bg-primary' : 'bg-[#4D4033]',
                    ].join(' ')}
                  >
                    <span className={[
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
                      isReading ? 'translate-x-4' : 'translate-x-0',
                    ].join(' ')} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => { onError(''); setView('changeBook') }}
          disabled={loading}
          className="text-sm font-medium text-danger hover:text-danger-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Change Book…
        </button>
      </div>
    </BaseModal>
  )
}

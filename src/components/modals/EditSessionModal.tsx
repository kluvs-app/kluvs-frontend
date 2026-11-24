import { useState, useEffect, useMemo } from 'react'
import { invokeFunction, getAvatarUrl } from '../../supabase'
import type { Club, ClubMember, DeleteResponse, SessionCreateResponse, SessionUpdateResponse } from '../../types'
import BookSearchInput from '../BookSearchInput'
import KluvsSpinner from '../KluvsSpinner'
import Avatar from '../ui/Avatar'
import { parseLocalDate, toLocalDateString } from '../../utils/dates'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onSessionUpdated: () => void
  onError: (error: string) => void
}

const labelStyle = {
  display: 'block' as const,
  color: 'var(--color-text-secondary)',
  marginBottom: 8,
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error
    ? err.message
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
  // Only members with an id can be toggled — the id is the session_members key.
  const members = useMemo(
    () => (selectedClub.members ?? []).filter((m): m is ClubMember & { id: number } => m.id != null),
    [selectedClub.members]
  )
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
    for (const m of members) {
      const sm = session.members?.find(s => s.member_id === m.id)
      map[m.id] = sm?.is_reading ?? false
    }
    setReadingMap(map)
    setNewBookId(null)
    setNewDueDate('')
    setBookKey(k => k + 1)
  }, [isOpen, session, members])

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

    const changedMembers = members
      .filter(m => readingMap[m.id] !== (session.members?.find(s => s.member_id === m.id)?.is_reading ?? false))
      .map(m => ({ member_id: m.id, is_reading: readingMap[m.id] }))
    if (changedMembers.length > 0) body.session_members = changedMembers

    if (body.due_date === undefined && !body.session_members) {
      onClose()
      return
    }

    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction<SessionUpdateResponse>('session', { method: 'PUT', body })
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

      const { error: deleteError } = await invokeFunction<DeleteResponse>(`session?id=${encodeURIComponent(session.id)}`, { method: 'DELETE' })
      if (deleteError) throw deleteError

      const { data, error: createError } = await invokeFunction<SessionCreateResponse>('session', {
        method: 'POST',
        body: { club_id: selectedClub.id, book_id: newBookId, due_date: newDueDate || undefined, all_reading: false }
      })
      if (createError) throw createError
      const newSessionId = data?.session.id
      if (!newSessionId) throw new Error('Failed to create new session')

      const readingMembers = (session.members ?? [])
        .filter(sm => sm.is_reading)
        .map(sm => ({ member_id: sm.member_id, is_reading: true }))
      if (readingMembers.length > 0) {
        await invokeFunction<SessionUpdateResponse>('session', { method: 'PUT', body: { id: newSessionId, session_members: readingMembers } })
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
  const tomorrowString = toLocalDateString(tomorrow)

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
            <Button
              variant="text"
              onClick={() => setView('edit')}
              disabled={loading}
            >Back</Button>
            <Button
              variant="danger"
              onClick={handleChangeBook}
              disabled={loading || !newBookId}
            >
              {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
              {loading ? 'Restarting…' : 'Restart with New Book'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="t-body-m text-[var(--color-text-primary)]">
            This will immediately end the current session for{' '}
            <span className="t-label">"{session.book.title}"</span>. Its discussions and
            history will be permanently removed. Members currently marked as reading will carry
            over to the new session.
          </p>

          <div>
            <label className="t-eyebrow" style={labelStyle}>New Book</label>
            <BookSearchInput
              key={bookKey}
              onSelect={setNewBookId}
              disabled={loading}
            />
          </div>

          <div>
            <label className="t-eyebrow" style={labelStyle}>Due Date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={tomorrowString}
              className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
          <Button
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="t-eyebrow" style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={tomorrowString}
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={labelStyle}>Reading Members</label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map(m => {
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
                    <span className="t-body-m text-[var(--color-text-primary)]">{m.name}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isReading}
                    aria-label={`Toggle ${m.name} reading status`}
                    disabled={loading}
                    onClick={() => handleToggleReading(m.id)}
                    className={[
                      'relative inline-flex w-9 h-5 rounded-full transition-colors duration-[180ms] flex-shrink-0',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      isReading ? 'bg-primary' : 'bg-[var(--color-text-disabled)]',
                    ].join(' ')}
                  >
                    <span className={[
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-[180ms]',
                      isReading ? 'translate-x-4' : 'translate-x-0',
                    ].join(' ')} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <Button
          type="button"
          variant="text"
          destructive
          onClick={() => { onError(''); setView('changeBook') }}
          disabled={loading}
        >
          Change Book
        </Button>
      </div>
    </BaseModal>
  )
}

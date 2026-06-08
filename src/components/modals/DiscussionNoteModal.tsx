import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Discussion, DiscussionNote } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface DiscussionNoteModalProps {
  isOpen: boolean
  onClose: () => void
  discussion: Discussion | null
  onError: (error: string) => void
}

export default function DiscussionNoteModal({
  isOpen,
  onClose,
  discussion,
  onError
}: DiscussionNoteModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [note, setNote] = useState<DiscussionNote | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!isOpen || !discussion) return

    let cancelled = false
    setFetching(true)
    setNote(null)
    setContent('')

    invokeFunction<DiscussionNote | null>(
      `discussion-note?discussion_id=${encodeURIComponent(discussion.id)}`,
      { method: 'GET' }
    )
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) throw error
        setNote(data ?? null)
        setContent(data?.content ?? '')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        onError(
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'Failed to load note'
        )
      })
      .finally(() => {
        if (!cancelled) setFetching(false)
      })

    return () => { cancelled = true }
  }, [isOpen, discussion, onError])

  const handleSave = async () => {
    if (!discussion) return
    if (!content.trim()) { onError('Note cannot be empty'); return }

    try {
      setLoading(true)
      onError('')

      const { data, error } = note
        ? await invokeFunction<DiscussionNote>('discussion-note', {
            method: 'PUT',
            body: { id: note.id, content: content.trim() }
          })
        : await invokeFunction<DiscussionNote>('discussion-note', {
            method: 'POST',
            body: { discussion_id: discussion.id, content: content.trim() }
          })
      if (error) throw error

      if (data) {
        setNote(data)
        setContent(data.content)
      }
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : `Failed to ${note ? 'update' : 'save'} note`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return

    try {
      setLoading(true)
      onError('')

      const { error } = await invokeFunction(
        `discussion-note?id=${encodeURIComponent(note.id)}`,
        { method: 'DELETE' }
      )
      if (error) throw error

      setNote(null)
      setContent('')
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to delete note'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNote(null)
    setContent('')
    onError('')
    onClose()
  }

  if (!discussion) return null

  const isEditing = !!note
  const isDirty = content.trim() !== (note?.content ?? '')

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Food For Thought"
      loading={loading}
      labelId="modal-title-discussion-note"
      dangerZone={isEditing ? (
        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.2)' }}
        >
          <p style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Danger Zone</p>
          <button
            onClick={handleDelete}
            disabled={loading || fetching}
            className="px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-text-secondary)] rounded-btn bg-transparent hover:opacity-70 transition-opacity disabled:opacity-40"
          >Delete note…</button>
        </div>
      ) : undefined}
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading || fetching}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading || fetching || !content.trim() || !isDirty}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading
              ? (isEditing ? 'Saving…' : 'Adding…')
              : <span>{isEditing ? 'Save Note' : 'Add Note'}</span>}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Discussion</p>
          <p className="text-sm text-[var(--color-text-primary)]">{discussion.title}</p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Your Note</label>
          {fetching ? (
            <div className="flex items-center justify-center py-12">
              <KluvsSpinner size={24} />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jot down a thought, question, or reflection to revisit before the discussion…"
              rows={6}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
              disabled={loading}
              maxLength={4000}
              autoFocus
            />
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            Only visible to you.
          </p>
        </div>
      </div>
    </BaseModal>
  )
}

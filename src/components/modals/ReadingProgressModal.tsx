import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Book, ProgressType, ReadingProgress } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface ReadingProgressModalProps {
  isOpen: boolean
  book: Book
  sessionId?: string
  existing?: ReadingProgress | null
  onClose: () => void
  onSaved: (progress: ReadingProgress) => void
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

export default function ReadingProgressModal({
  isOpen,
  book,
  sessionId,
  existing,
  onClose,
  onSaved,
}: ReadingProgressModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressType, setProgressType] = useState<ProgressType>('page')
  const [currentPage, setCurrentPage] = useState('')
  const [percentComplete, setPercentComplete] = useState('')
  const [markFinished, setMarkFinished] = useState(false)

  const pageCount = book.page_count
  const previewPercent = progressType === 'page' && pageCount
    ? Math.min(100, Math.round((Number(currentPage || 0) / pageCount) * 100))
    : null

  useEffect(() => {
    if (!isOpen) return
    setError('')
    setProgressType(existing?.progress_type ?? 'page')
    setCurrentPage(existing?.current_page != null ? String(existing.current_page) : '')
    setPercentComplete(existing?.percent_complete != null ? String(existing.percent_complete) : '')
    setMarkFinished(existing?.status === 'completed')
  }, [isOpen, existing])

  useEffect(() => {
    if (progressType === 'page' && pageCount) {
      if (Number(currentPage) >= pageCount) setMarkFinished(true)
      else if (Number(currentPage) < pageCount && markFinished) setMarkFinished(false)
    } else if (progressType === 'percent') {
      if (Number(percentComplete) >= 100) setMarkFinished(true)
      else if (Number(percentComplete) < 100 && markFinished) setMarkFinished(false)
    }
  }, [currentPage, percentComplete, progressType, pageCount, markFinished])

  if (!isOpen) return null

  const handleClose = () => {
    if (loading) return
    setError('')
    onClose()
  }

  const handleSave = async () => {
    if (progressType === 'page' && !currentPage) { setError('Enter the current page'); return }
    if (progressType === 'percent' && !percentComplete) { setError('Enter the percent complete'); return }

    const body: Record<string, unknown> = existing
      ? { 
          id: existing.id, 
          progress_type: progressType,
        }
      : {
          book_id: book.id,
          ...(sessionId ? { session_id: sessionId } : {}),
          progress_type: progressType,
        }

    if (progressType === 'page') {
      body.current_page = Number(currentPage)
    } else {
      body.percent_complete = Number(percentComplete)
    }

    if (markFinished) body.status = 'completed'
    else if (existing) body.status = 'in_progress'

    try {
      setLoading(true)
      setError('')
      const { data, error: saveError } = existing
        ? await invokeFunction<ReadingProgress>('progress', { method: 'PUT', body })
        : await invokeFunction<ReadingProgress>('progress', { method: 'POST', body })
      if (saveError) throw saveError
      if (!data) throw new Error('Failed to save progress')
      onSaved(data)
      onClose()
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save progress'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={existing ? 'Update Progress' : 'Track Progress'}
      loading={loading}
      labelId="modal-title-reading-progress"
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
            {loading ? 'Saving…' : 'Save Progress'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Book</p>
          <p className="text-sm text-[var(--color-text-primary)]">{book.title}</p>
        </div>

        <div>
          <label style={labelStyle}>Track By</label>
          <div className="flex w-full items-stretch border border-[var(--color-divider)] rounded-full overflow-hidden">
            <button
              type="button"
              onClick={() => setProgressType('page')}
              disabled={loading}
              className={[
                'flex-1 py-2 text-xs font-medium transition-colors duration-150',
                progressType === 'page'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              ].join(' ')}
            >Page</button>
            <button
              type="button"
              onClick={() => setProgressType('percent')}
              disabled={loading}
              className={[
                'flex-1 py-2 text-xs font-medium transition-colors duration-150 border-l border-[var(--color-divider)]',
                progressType === 'percent'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              ].join(' ')}
            >Percent</button>
          </div>
        </div>

        {progressType === 'page' ? (
          <div>
            <label style={labelStyle}>Current Page{pageCount ? ` (of ${pageCount})` : ''}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)] font-medium pointer-events-none">
                #
              </span>
              <input
                type="number"
                min={0}
                max={pageCount}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="0"
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-10 pr-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={loading}
                autoFocus
              />
            </div>
            {previewPercent != null && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                That's about {previewPercent}% complete.
              </p>
            )}
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Percent Complete</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={percentComplete}
                onChange={(e) => setPercentComplete(e.target.value)}
                placeholder="0"
                className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 pr-10 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={loading}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)] font-medium pointer-events-none">
                %
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[var(--color-text-primary)]">Mark as finished</span>
          <button
            type="button"
            role="switch"
            aria-checked={markFinished}
            aria-label="Mark as finished"
            disabled={loading}
            onClick={() => setMarkFinished(prev => !prev)}
            className={[
              'relative inline-flex w-9 h-5 rounded-full transition-colors duration-150 flex-shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              markFinished ? 'bg-primary' : 'bg-[#4D4033]',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
              markFinished ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}
      </div>
    </BaseModal>
  )
}

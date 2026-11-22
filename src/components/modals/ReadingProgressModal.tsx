import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Book, ProgressType, ReadingProgress } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import Button from '../ui/Button'

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
  color: 'var(--color-text-secondary)',
  marginBottom: 8,
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error
    ? err.message
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
  const [lastAutoTriggerValue, setLastAutoTriggerValue] = useState<string | null>(null)

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
    setLastAutoTriggerValue(null)
  }, [isOpen, existing])

  useEffect(() => {
    const currentValue = progressType === 'page' ? currentPage : percentComplete
    if (currentValue === lastAutoTriggerValue) return

    if (progressType === 'page' && pageCount) {
      const pageNum = Number(currentPage)
      if (pageNum >= pageCount && !markFinished) {
        setMarkFinished(true)
        setLastAutoTriggerValue(currentPage)
      } else if (pageNum < pageCount && markFinished) {
        setMarkFinished(false)
        setLastAutoTriggerValue(currentPage)
      }
    } else if (progressType === 'percent') {
      const pct = Number(percentComplete)
      if (pct >= 100 && !markFinished) {
        setMarkFinished(true)
        setLastAutoTriggerValue(percentComplete)
      } else if (pct < 100 && markFinished) {
        setMarkFinished(false)
        setLastAutoTriggerValue(percentComplete)
      }
    }
  }, [currentPage, percentComplete, progressType, pageCount, markFinished, lastAutoTriggerValue])

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
            {loading ? 'Saving…' : 'Save Progress'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="t-eyebrow text-[var(--color-text-secondary)] mb-1">Book</p>
          <p className="t-body-m text-[var(--color-text-primary)]">{book.title}</p>
        </div>

        <div>
          <label className="t-eyebrow" style={labelStyle}>Track By</label>
          <div className="flex w-full items-stretch border border-[var(--color-divider)] rounded-full overflow-hidden">
            <button
              type="button"
              onClick={() => setProgressType('page')}
              disabled={loading}
              className={[
                't-label flex-1 py-[7px] transition-colors duration-[180ms] text-inherit',
                progressType === 'page'
                  ? 'bg-primary text-[var(--color-on-primary)]'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              ].join(' ')}
            >Page</button>
            <button
              type="button"
              onClick={() => setProgressType('percent')}
              disabled={loading}
              className={[
                't-label flex-1 py-[7px] transition-colors duration-[180ms] border-l border-[var(--color-divider)] text-inherit',
                progressType === 'percent'
                  ? 'bg-primary text-[var(--color-on-primary)]'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
              ].join(' ')}
            >Percent</button>
          </div>
        </div>

        {progressType === 'page' ? (
          <div>
            <label htmlFor="current-page-input" className="t-eyebrow" style={labelStyle}>Current Page{pageCount ? ` (of ${pageCount})` : ''}</label>
            <div className="relative">
              <span className="t-label absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">
                #
              </span>
              <input
                id="current-page-input"
                type="number"
                min={0}
                max={pageCount}
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="0"
                className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-10 pr-4 py-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={loading}
                autoFocus
              />
            </div>
            {previewPercent != null && (
              <p className="t-fine-print text-[var(--color-text-secondary)] mt-2">
                That's about {previewPercent}% complete.
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="percent-complete-input" className="t-eyebrow" style={labelStyle}>Percent Complete</label>
            <div className="relative">
              <input
                id="percent-complete-input"
                type="number"
                min={0}
                max={100}
                value={percentComplete}
                onChange={(e) => setPercentComplete(e.target.value)}
                placeholder="0"
                className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 pr-10 py-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                disabled={loading}
                autoFocus
              />
              <span className="t-label absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">
                %
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-1">
          <span className="t-body-m text-[var(--color-text-primary)]">Mark as finished</span>
          <button
            type="button"
            role="switch"
            aria-checked={markFinished}
            aria-label="Mark as finished"
            disabled={loading}
            onClick={() => setMarkFinished(prev => !prev)}
            className={[
              'relative inline-flex w-9 h-5 rounded-full transition-colors duration-[180ms] flex-shrink-0',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              markFinished ? 'bg-primary' : 'bg-[var(--color-text-disabled)]',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-[180ms]',
              markFinished ? 'translate-x-4' : 'translate-x-0',
            ].join(' ')} />
          </button>
        </div>

        {error && (
          <p className="t-body-m text-danger">{error}</p>
        )}
      </div>
    </BaseModal>
  )
}

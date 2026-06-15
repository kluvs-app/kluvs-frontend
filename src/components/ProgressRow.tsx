import { useState } from 'react'
import type { Book, ReadingProgress } from '../types'
import ReadingProgressModal from './modals/ReadingProgressModal'
import GhostButton from './ui/GhostButton'

interface ProgressRowProps {
  book: Book
  progress: ReadingProgress | null
  sessionId?: string
  leftLabel?: string
  leftLabelVariant?: 'italic' | 'eyebrow'
  onUpdated: (progress: ReadingProgress) => void
}

export default function ProgressRow({ 
  book, 
  progress, 
  sessionId, 
  leftLabel, 
  leftLabelVariant = 'italic',
  onUpdated 
}: ProgressRowProps) {
  const [showModal, setShowModal] = useState(false)

  const pageCount = book.page_count
  let pct = 0
  if (progress) {
    if (progress.progress_type === 'page' && pageCount) {
      pct = Math.min(100, Math.round(((progress.current_page ?? 0) / pageCount) * 100))
    } else if (progress.progress_type === 'percent') {
      pct = Math.min(100, Math.round(progress.percent_complete ?? 0))
    }
  }

  const label = progress
    ? (progress.status === 'completed'
        ? 'Finished'
        : progress.progress_type === 'page' && pageCount
          ? `${progress.current_page ?? 0} of ${pageCount} pages`
          : `${progress.percent_complete ?? 0}% complete`)
    : ''

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1 h-1 rounded-full bg-[var(--color-divider)] overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <GhostButton
          variant="sm"
          onClick={() => setShowModal(true)}
        >
          Update
        </GhostButton>
      </div>

      <div className="flex items-center justify-between mt-1">
        {leftLabel ? (
          leftLabelVariant === 'eyebrow' ? (
            <span 
              className="text-[10px] text-primary font-medium uppercase tracking-[0.14em] leading-none"
              style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
            >
              {leftLabel}
            </span>
          ) : (
            <span 
              className="text-[17px] text-[var(--color-text-secondary)] font-serif italic leading-none"
              style={{ fontFamily: '"EB Garamond", serif' }}
            >
              {leftLabel}
            </span>
          )
        ) : <div />}
        <span 
          className="text-[12px] text-primary font-medium tracking-[0.04em] leading-none"
          style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}
        >
          {label}
        </span>
      </div>

      <ReadingProgressModal
        isOpen={showModal}
        book={book}
        sessionId={sessionId}
        existing={progress}
        onClose={() => setShowModal(false)}
        onSaved={onUpdated}
      />
    </div>
  )
}

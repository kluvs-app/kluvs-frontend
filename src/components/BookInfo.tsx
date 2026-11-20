import type { Book, ShelfValue } from '../types'
import { parseLocalDate } from '../utils/dates'
import ShelfPill from './ShelfPill'
import Button from './ui/Button'

interface BookInfoProps {
  book: Book
  dueDate?: string
  isAdmin?: boolean
  onEditBook?: () => void
  onNewSession?: () => void
  shelf?: ShelfValue | null
  onShelfChange?: (shelf: ShelfValue | null) => void
}

export default function BookInfo({ book, dueDate, isAdmin, onEditBook, onNewSession, shelf, onShelfChange }: BookInfoProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        {book.image_url && (
          <img
            src={book.image_url}
            alt={`${book.title} cover`}
            className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="t-title-m t-feature text-[var(--color-text-primary)]">{book.title}</h3>
          <p className="t-body-m text-[var(--color-text-secondary)] mt-1">by {book.author}</p>
          {(book.year || book.page_count) && (
            <p className="t-body-m text-[var(--color-text-secondary)] mt-0.5">
              {[
                book.year,
                book.page_count && `${book.page_count} pages`
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {dueDate && (
            <p className="t-body-l text-primary mt-2">
              Due {parseLocalDate(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <Button variant="text" onClick={onEditBook}>
            Edit Book
          </Button>
          <Button
            variant="primary"
            onClick={onNewSession}
          >
            New Session
          </Button>
        </div>
      )}
      {onShelfChange !== undefined && (
        <div className="flex flex-col gap-1.5">
          <span className="t-eyebrow text-[var(--color-text-secondary)]">
            My Shelf
          </span>
          <ShelfPill shelf={shelf ?? null} onShelfChange={onShelfChange} disabled={!book.id} />
        </div>
      )}
    </div>
  )
}

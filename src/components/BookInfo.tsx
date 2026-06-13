import type { Book, ShelfValue } from '../types'
import { parseLocalDate } from '../utils/dates'
import { SHELF_OPTIONS } from '../constants/shelves'

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
          <h3 className="text-card-heading font-serif italic text-[var(--color-text-primary)]">{book.title}</h3>
          <p className="text-body text-[var(--color-text-secondary)] mt-1">by {book.author}</p>
          {(book.year || book.page_count) && (
            <p className="text-body text-[var(--color-text-secondary)] mt-0.5">
              {[
                book.year,
                book.page_count && `${book.page_count} pages`
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {dueDate && (
            <p className="text-body-lg text-primary font-medium mt-2">
              Due {parseLocalDate(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <button
            onClick={onEditBook}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-1.5 rounded-btn border border-[var(--color-divider)] hover:border-[var(--color-text-secondary)] transition-colors"
          >
            Edit Book
          </button>
          <button
            onClick={onNewSession}
            className="text-sm bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-btn transition-colors"
          >
            New Session
          </button>
        </div>
      )}
      {onShelfChange !== undefined && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-[0.08em]">
            My Shelf
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select shelf">
            {SHELF_OPTIONS.map(({ value, label }) => {
              const isActive = shelf === value
              return (
                <button
                  key={label}
                  onClick={() => onShelfChange(value)}
                  disabled={!book.id}
                  aria-pressed={isActive}
                  aria-label={`Shelf: ${label}`}
                  className={`text-sm px-3 py-1.5 rounded-btn border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import type { Book } from '../types'

interface BookInfoProps {
  book: Book
  dueDate?: string
  isAdmin?: boolean
  onEditBook?: () => void
  onNewSession?: () => void
}

export default function BookInfo({ book, dueDate, isAdmin, onEditBook, onNewSession }: BookInfoProps) {
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
            <p className="text-body-lg text-primary font-semibold mt-2">
              Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
    </div>
  )
}

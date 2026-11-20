import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookInfo from '../../components/BookInfo'
import type { Book, ShelfValue } from '../../types'

const mockBook: Book = {
  id: 1,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  year: 1925,
  page_count: 180,
}

describe('BookInfo', () => {
  describe('Base rendering', () => {
    it('renders book title and author', () => {
      render(<BookInfo book={mockBook} />)
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
      expect(screen.getByText('by F. Scott Fitzgerald')).toBeInTheDocument()
    })

    it('renders year and page count when provided', () => {
      render(<BookInfo book={mockBook} />)
      expect(screen.getByText(/1925/)).toBeInTheDocument()
      expect(screen.getByText(/180 pages/)).toBeInTheDocument()
    })

    it('renders due date when provided', () => {
      render(<BookInfo book={mockBook} dueDate="2026-06-15" />)
      expect(screen.getByText(/due/i)).toBeInTheDocument()
    })

    it('does not render admin buttons when isAdmin is false', () => {
      render(<BookInfo book={mockBook} />)
      expect(screen.queryByRole('button', { name: /edit book/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /new session/i })).not.toBeInTheDocument()
    })

    it('renders admin buttons when isAdmin is true', () => {
      render(<BookInfo book={mockBook} isAdmin onEditBook={vi.fn()} onNewSession={vi.fn()} />)
      expect(screen.getByRole('button', { name: /edit book/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument()
    })

    it('calls onEditBook when Edit Book is clicked', () => {
      const onEditBook = vi.fn()
      render(<BookInfo book={mockBook} isAdmin onEditBook={onEditBook} onNewSession={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /edit book/i }))
      expect(onEditBook).toHaveBeenCalledOnce()
    })

    it('calls onNewSession when New Session is clicked', () => {
      const onNewSession = vi.fn()
      render(<BookInfo book={mockBook} isAdmin onEditBook={vi.fn()} onNewSession={onNewSession} />)
      fireEvent.click(screen.getByRole('button', { name: /new session/i }))
      expect(onNewSession).toHaveBeenCalledOnce()
    })
  })

  describe('Shelf dropdown', () => {
    it('does not render the shelf dropdown when onShelfChange is not provided', () => {
      render(<BookInfo book={mockBook} />)
      expect(screen.queryByRole('button', { name: /shelf/i })).not.toBeInTheDocument()
    })

    it('shows "Add to shelf" when the book is not shelved', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeInTheDocument()
    })

    it('shows the current shelf on the trigger', () => {
      render(<BookInfo book={mockBook} shelf="read" onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /shelf: read/i })).toBeInTheDocument()
    })

    it('opens a listbox with all shelf options', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /add to shelf/i }))
      expect(screen.getByRole('listbox', { name: /select shelf/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /none/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /want to read/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /not finished/i })).toBeInTheDocument()
    })

    it('marks the current shelf option as selected', () => {
      render(<BookInfo book={mockBook} shelf="read" onShelfChange={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /shelf: read/i }))
      expect(screen.getByRole('option', { name: /^read$/i })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('option', { name: /none/i })).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onShelfChange with the selected value', () => {
      const onShelfChange = vi.fn()
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={onShelfChange} />)
      fireEvent.click(screen.getByRole('button', { name: /add to shelf/i }))
      fireEvent.click(screen.getByRole('option', { name: /want to read/i }))
      expect(onShelfChange).toHaveBeenCalledWith('want_to_read' as ShelfValue)
    })

    it('calls onShelfChange with null when None is chosen', () => {
      const onShelfChange = vi.fn()
      render(<BookInfo book={mockBook} shelf="read" onShelfChange={onShelfChange} />)
      fireEvent.click(screen.getByRole('button', { name: /shelf: read/i }))
      fireEvent.click(screen.getByRole('option', { name: /none/i }))
      expect(onShelfChange).toHaveBeenCalledWith(null)
    })

    it('disables the trigger when the book has no id', () => {
      const bookWithoutId: Book = { ...mockBook, id: undefined }
      render(<BookInfo book={bookWithoutId} shelf={null} onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add to shelf/i })).toBeDisabled()
    })

    it('enables the trigger when the book has an id', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /add to shelf/i })).not.toBeDisabled()
    })
  })
})

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

  describe('Shelf picker', () => {
    it('does not render shelf picker when onShelfChange is not provided', () => {
      render(<BookInfo book={mockBook} />)
      expect(screen.queryByRole('group', { name: /select shelf/i })).not.toBeInTheDocument()
    })

    it('renders shelf picker with all options when onShelfChange is provided', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      expect(screen.getByRole('group', { name: /select shelf/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shelf: none/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shelf: want to read/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shelf: read/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /shelf: not finished/i })).toBeInTheDocument()
    })

    it('marks the current shelf option as pressed', () => {
      render(<BookInfo book={mockBook} shelf="read" onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /shelf: read/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /shelf: none/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('marks None as pressed when shelf is null', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: /shelf: none/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('calls onShelfChange with the selected value when a shelf button is clicked', () => {
      const onShelfChange = vi.fn()
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={onShelfChange} />)
      fireEvent.click(screen.getByRole('button', { name: /shelf: want to read/i }))
      expect(onShelfChange).toHaveBeenCalledWith('want_to_read' as ShelfValue)
    })

    it('calls onShelfChange with null when None is clicked', () => {
      const onShelfChange = vi.fn()
      render(<BookInfo book={mockBook} shelf="read" onShelfChange={onShelfChange} />)
      fireEvent.click(screen.getByRole('button', { name: /shelf: none/i }))
      expect(onShelfChange).toHaveBeenCalledWith(null)
    })

    it('disables all shelf buttons when book has no id', () => {
      const bookWithoutId: Book = { ...mockBook, id: undefined }
      render(<BookInfo book={bookWithoutId} shelf={null} onShelfChange={vi.fn()} />)
      const shelfButtons = screen.getAllByRole('button', { name: /shelf:/i })
      shelfButtons.forEach(btn => expect(btn).toBeDisabled())
    })

    it('enables shelf buttons when book has an id', () => {
      render(<BookInfo book={mockBook} shelf={null} onShelfChange={vi.fn()} />)
      const shelfButtons = screen.getAllByRole('button', { name: /shelf:/i })
      shelfButtons.forEach(btn => expect(btn).not.toBeDisabled())
    })
  })


})

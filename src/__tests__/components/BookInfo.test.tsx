import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookInfo from '../../components/BookInfo'
import type { Book } from '../../types'

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


})

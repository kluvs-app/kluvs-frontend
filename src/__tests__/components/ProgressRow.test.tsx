import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProgressRow from '../../components/ProgressRow'
import type { ReadingProgress } from '../../types'
import { mockBook } from '../utils/mocks'

vi.mock('../../components/modals/ReadingProgressModal', () => ({
  default: ({ isOpen, onClose, onSaved, sessionId, existing }: any) =>
    isOpen ? (
      <div role="dialog" data-session-id={sessionId} data-existing-id={existing?.id ?? ''}>
        <button onClick={() => onSaved({ ...baseProgress, current_page: 90 })}>modal-save</button>
        <button onClick={onClose}>modal-close</button>
      </div>
    ) : null,
}))

const baseProgress: ReadingProgress = {
  id: 'progress-1',
  member_id: 1,
  book_id: 1,
  session_id: null,
  progress_type: 'page',
  current_page: 45,
  percent_complete: null,
  status: 'in_progress',
  started_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
  completed_at: null,
  book: null,
}

function fill(container: HTMLElement) {
  return container.querySelector('.bg-primary') as HTMLElement
}

describe('ProgressRow', () => {
  it('shows page progress against the book page count', () => {
    const { container } = render(<ProgressRow book={mockBook} progress={baseProgress} onUpdated={vi.fn()} />)
    expect(screen.getByText('45 of 180 pages')).toBeInTheDocument()
    expect(fill(container)).toHaveStyle({ width: '25%' })
  })

  it('shows percent progress', () => {
    const progress: ReadingProgress = { ...baseProgress, progress_type: 'percent', current_page: null, percent_complete: 62.4 }
    const { container } = render(<ProgressRow book={mockBook} progress={progress} onUpdated={vi.fn()} />)
    expect(screen.getByText('62.4% complete')).toBeInTheDocument()
    expect(fill(container)).toHaveStyle({ width: '62%' })
  })

  it('falls back to percent wording when the book has no page count', () => {
    const { container } = render(
      <ProgressRow book={{ ...mockBook, page_count: undefined }} progress={baseProgress} onUpdated={vi.fn()} />
    )
    expect(screen.getByText('0% complete')).toBeInTheDocument()
    expect(fill(container)).toHaveStyle({ width: '0%' })
  })

  it('caps the bar at 100%', () => {
    const { container } = render(
      <ProgressRow book={mockBook} progress={{ ...baseProgress, current_page: 500 }} onUpdated={vi.fn()} />
    )
    expect(fill(container)).toHaveStyle({ width: '100%' })
  })

  it('shows Finished for completed progress', () => {
    render(<ProgressRow book={mockBook} progress={{ ...baseProgress, status: 'completed' }} onUpdated={vi.fn()} />)
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  it('shows an empty bar and no label without progress', () => {
    const { container } = render(<ProgressRow book={mockBook} progress={null} onUpdated={vi.fn()} />)
    expect(fill(container)).toHaveStyle({ width: '0%' })
    expect(screen.queryByText(/pages|complete|Finished/)).not.toBeInTheDocument()
  })

  it('renders the left label as italic title by default, or as an eyebrow', () => {
    const { rerender } = render(
      <ProgressRow book={mockBook} progress={null} leftLabel="Your progress" onUpdated={vi.fn()} />
    )
    expect(screen.getByText('Your progress')).toHaveClass('t-title-m', 't-feature')

    rerender(
      <ProgressRow book={mockBook} progress={null} leftLabel="Your progress" leftLabelVariant="eyebrow" onUpdated={vi.fn()} />
    )
    expect(screen.getByText('Your progress')).toHaveClass('t-eyebrow')
  })

  it('opens the progress modal with the session and existing progress', async () => {
    const user = userEvent.setup()
    render(<ProgressRow book={mockBook} progress={baseProgress} sessionId="session-1" onUpdated={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Update' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-session-id', 'session-1')
    expect(dialog).toHaveAttribute('data-existing-id', 'progress-1')
  })

  it('forwards saved progress to onUpdated', async () => {
    const user = userEvent.setup()
    const onUpdated = vi.fn()
    render(<ProgressRow book={mockBook} progress={baseProgress} onUpdated={onUpdated} />)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await user.click(screen.getByRole('button', { name: 'modal-save' }))
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ current_page: 90 }))
  })

  it('closes the modal', async () => {
    const user = userEvent.setup()
    render(<ProgressRow book={mockBook} progress={baseProgress} onUpdated={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await user.click(screen.getByRole('button', { name: 'modal-close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReadingLogModal from '../../../components/modals/ReadingLogModal'
import type { ReadingLog } from '../../../types'

const mockInvokeFunction = vi.fn()

vi.mock('../../../supabase', () => ({
  invokeFunction: (...args: any[]) => mockInvokeFunction(...args),
}))

const mockLog: ReadingLog = {
  active: [
    {
      id: 'entry-1',
      book: { id: 1, title: 'Dune', author: 'Frank Herbert', image_url: null },
      club: { id: 'club-1', name: 'Sci-Fi Club' },
      due_date: '2026-07-01',
    },
  ],
  finished: [
    {
      id: 'entry-2',
      book: { id: 2, title: 'Foundation', author: 'Isaac Asimov', image_url: null },
      club: { id: 'club-2', name: 'Classic Club' },
      due_date: null,
    },
  ],
}

describe('ReadingLogModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvokeFunction.mockResolvedValue({
      data: { success: true, reading_log: mockLog },
      error: null,
    })
  })

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<ReadingLogModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Reading Log')).not.toBeInTheDocument()
    })

    it('renders title when isOpen is true', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      expect(screen.getByText('Reading Log')).toBeInTheDocument()
    })

    it('shows loading spinner while fetching', async () => {
      mockInvokeFunction.mockReturnValue(new Promise(() => {}))
      render(<ReadingLogModal {...defaultProps} />)
      expect(document.querySelector('svg, [data-testid="spinner"], .animate-spin')).toBeTruthy()
    })

    it('renders section headers after load', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Currently Reading')).toBeInTheDocument())
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    it('shows active book title and author', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument())
      expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    })

    it('shows active book club name', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Sci-Fi Club')).toBeInTheDocument())
    })

    it('shows finished book title and author', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Foundation')).toBeInTheDocument())
      expect(screen.getByText('Isaac Asimov')).toBeInTheDocument()
    })

    it('shows finished book club name', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Classic Club')).toBeInTheDocument())
    })
  })

  describe('Empty states', () => {
    it('shows empty state in Currently Reading when active list is empty', async () => {
      mockInvokeFunction.mockResolvedValue({
        data: { success: true, reading_log: { active: [], finished: [] } },
        error: null,
      })
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getAllByText('Nothing here yet.').length).toBe(2))
    })

    it('shows empty state only in Read when finished list is empty', async () => {
      mockInvokeFunction.mockResolvedValue({
        data: { success: true, reading_log: { active: mockLog.active, finished: [] } },
        error: null,
      })
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Dune')).toBeInTheDocument())
      expect(screen.getAllByText('Nothing here yet.').length).toBe(1)
    })

    it('falls back to empty log when reading_log is missing from response', async () => {
      mockInvokeFunction.mockResolvedValue({ data: { success: true }, error: null })
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getAllByText('Nothing here yet.').length).toBe(2))
    })
  })

  describe('Error handling', () => {
    it('shows error message on API failure', async () => {
      mockInvokeFunction.mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch reading log' },
      })
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() =>
        expect(screen.getByText('Failed to fetch reading log')).toBeInTheDocument()
      )
    })

    it('shows error message on thrown exception', async () => {
      mockInvokeFunction.mockRejectedValue(new Error('Network error'))
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
    })

    it('shows generic error message for non-Error exceptions', async () => {
      mockInvokeFunction.mockRejectedValue('unexpected')
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() =>
        expect(screen.getByText('Failed to load reading log')).toBeInTheDocument()
      )
    })
  })

  describe('Accessibility', () => {
    it('has dialog role and aria-modal', () => {
      render(<ReadingLogModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has Close button', () => {
      render(<ReadingLogModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('calls onClose when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<ReadingLogModal {...defaultProps} />)
      await user.keyboard('{Escape}')
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ReadingLogModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Data fetching', () => {
    it('calls invokeFunction with reading_log=true when opened', async () => {
      render(<ReadingLogModal {...defaultProps} />)
      await waitFor(() => expect(mockInvokeFunction).toHaveBeenCalledWith(
        'session?reading_log=true',
        { method: 'GET' }
      ))
    })

    it('does not fetch when isOpen is false', () => {
      render(<ReadingLogModal {...defaultProps} isOpen={false} />)
      expect(mockInvokeFunction).not.toHaveBeenCalled()
    })

    it('re-fetches when modal is reopened', async () => {
      const { rerender } = render(<ReadingLogModal {...defaultProps} isOpen={false} />)
      expect(mockInvokeFunction).not.toHaveBeenCalled()

      rerender(<ReadingLogModal {...defaultProps} isOpen={true} />)
      await waitFor(() => expect(mockInvokeFunction).toHaveBeenCalledTimes(1))

      rerender(<ReadingLogModal {...defaultProps} isOpen={false} />)
      rerender(<ReadingLogModal {...defaultProps} isOpen={true} />)
      await waitFor(() => expect(mockInvokeFunction).toHaveBeenCalledTimes(2))
    })
  })
})

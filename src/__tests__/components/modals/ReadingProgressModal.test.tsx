import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReadingProgressModal from '../../../components/modals/ReadingProgressModal'
import { invokeFunction } from '../../../supabase'
import { mockBook } from '../../utils/mocks'
import type { ReadingProgress } from '../../../types'

// Mock supabase invokeFunction
vi.mock('../../../supabase', async () => {
  const actual = await vi.importActual('../../../supabase')
  return {
    ...actual,
    invokeFunction: vi.fn(),
  }
})

describe('ReadingProgressModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSaved = vi.fn()

  const defaultProps = {
    isOpen: true,
    book: mockBook,
    onClose: mockOnClose,
    onSaved: mockOnSaved,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly when open', () => {
    render(<ReadingProgressModal {...defaultProps} />)
    expect(screen.getByText(/Track Progress/i)).toBeInTheDocument()
    expect(screen.getByText(mockBook.title)).toBeInTheDocument()
    // Initial state is 'page'
    expect(screen.getByLabelText(/Current Page/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(<ReadingProgressModal {...defaultProps} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('toggles between Page and Percent tracking', () => {
    render(<ReadingProgressModal {...defaultProps} />)
    
    const percentBtn = screen.getByRole('button', { name: /Percent/i })
    fireEvent.click(percentBtn)
    
    expect(screen.getByLabelText(/Percent Complete/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Current Page/i)).not.toBeInTheDocument()
    
    const pageBtn = screen.getByRole('button', { name: /Page/i })
    fireEvent.click(pageBtn)
    
    expect(screen.getByLabelText(/Current Page/i)).toBeInTheDocument()
  })

  it('loads existing progress data correctly', () => {
    const existing: ReadingProgress = {
      id: 'rp-1',
      member_id: 1,
      book_id: Number(mockBook.id),
      session_id: 'sess-1',
      progress_type: 'percent',
      current_page: null,
      percent_complete: 45,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    }

    render(<ReadingProgressModal {...defaultProps} existing={existing} />)
    
    expect(screen.getByText(/Update Progress/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Percent Complete/i)).toHaveValue(45)
  })

  it('validates required fields on save', async () => {
    render(<ReadingProgressModal {...defaultProps} />)
    
    const saveBtn = screen.getByRole('button', { name: /Save Progress/i })
    fireEvent.click(saveBtn)
    
    expect(screen.getByText(/Enter the current page/i)).toBeInTheDocument()
    
    // Switch to percent
    fireEvent.click(screen.getByRole('button', { name: /Percent/i }))
    fireEvent.click(saveBtn)
    expect(screen.getByText(/Enter the percent complete/i)).toBeInTheDocument()
  })

  describe('Auto-finish logic', () => {
    it('automatically toggles "Mark as finished" when page reaches max', async () => {
      // mockBook has 180 pages
      render(<ReadingProgressModal {...defaultProps} />)
      
      const input = screen.getByLabelText(/Current Page/i)
      const toggle = screen.getByRole('switch', { name: /Mark as finished/i })
      
      expect(toggle).toHaveAttribute('aria-checked', 'false')
      
      fireEvent.change(input, { target: { value: '180' } })
      expect(toggle).toHaveAttribute('aria-checked', 'true')
      
      fireEvent.change(input, { target: { value: '179' } })
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('automatically toggles "Mark as finished" when percent reaches 100', async () => {
      render(<ReadingProgressModal {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /Percent/i }))
      
      const input = screen.getByLabelText(/Percent Complete/i)
      const toggle = screen.getByRole('switch', { name: /Mark as finished/i })
      
      fireEvent.change(input, { target: { value: '100' } })
      expect(toggle).toHaveAttribute('aria-checked', 'true')
      
      fireEvent.change(input, { target: { value: '99' } })
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('manually toggling "Mark as finished" overrides automatic logic until next change', async () => {
      render(<ReadingProgressModal {...defaultProps} />)
      const input = screen.getByLabelText(/Current Page/i)
      const toggle = screen.getByRole('switch', { name: /Mark as finished/i })
      
      // Auto-on
      fireEvent.change(input, { target: { value: '300' } })
      expect(toggle).toHaveAttribute('aria-checked', 'true')
      
      // Manual-off (while still at 100%)
      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('submits new progress (POST) successfully', async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { id: 'new-rp' },
      error: null,
    })

    render(<ReadingProgressModal {...defaultProps} sessionId="sess-123" />)
    
    fireEvent.change(screen.getByLabelText(/Current Page/i), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))

    await waitFor(() => {
      expect(invokeFunction).toHaveBeenCalledWith('progress', expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          book_id: mockBook.id,
          session_id: 'sess-123',
          progress_type: 'page',
          current_page: 50,
        })
      }))
    })

    expect(mockOnSaved).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('submits existing progress (PUT) successfully', async () => {
    const existing: ReadingProgress = {
      id: 'rp-1',
      member_id: 1,
      book_id: Number(mockBook.id),
      session_id: null,
      progress_type: 'page',
      current_page: 10,
      percent_complete: null,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    }

    vi.mocked(invokeFunction).mockResolvedValue({
      data: { ...existing, current_page: 20 },
      error: null,
    })

    render(<ReadingProgressModal {...defaultProps} existing={existing} />)
    
    fireEvent.change(screen.getByLabelText(/Current Page/i), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))

    await waitFor(() => {
      expect(invokeFunction).toHaveBeenCalledWith('progress', expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({
          id: 'rp-1',
          current_page: 20,
          progress_type: 'page'
        })
      }))
    })

    expect(mockOnSaved).toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error('API Error'),
    })

    render(<ReadingProgressModal {...defaultProps} />)
    
    fireEvent.change(screen.getByLabelText(/Current Page/i), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))

    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument()
    })
  })

  it('shows preview percentage when tracking by page', () => {
    render(<ReadingProgressModal {...defaultProps} />)
    // mockBook has 180 pages. 90 should be 50%
    fireEvent.change(screen.getByLabelText(/Current Page/i), { target: { value: '90' } })
    expect(screen.getByText(/about 50% complete/i)).toBeInTheDocument()
  })

  it('validates current page input', async () => {
    render(<ReadingProgressModal {...defaultProps} />)
    const saveBtn = screen.getByRole('button', { name: /Save Progress/i })
    
    // Empty input
    fireEvent.click(saveBtn)
    expect(screen.getByText(/Enter the current page/i)).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EndSessionModal from '../../../components/modals/EndSessionModal'
import type { Club } from '../../../types'
import { mockClub } from '../../utils/mocks'

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  supabase: { functions: { invoke: (...args: any[]) => mockInvoke(...args) } },
  invokeFunction: (...args: any[]) => mockInvoke(...args),
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

describe('EndSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    club: mockClub,
    onSessionEnded: vi.fn(),
  }

  beforeEach(() => {
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null })
  })

  describe('Rendering', () => {
    it('renders the confirmation for the active book', () => {
      render(<EndSessionModal {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'End Session' })).toBeInTheDocument()
      expect(screen.getByText('"The Great Gatsby"')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<EndSessionModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('End Session')).not.toBeInTheDocument()
    })

    it('counts only members marked as reading', () => {
      render(<EndSessionModal {...defaultProps} />)
      expect(screen.getByText('1 member will receive credit.')).toBeInTheDocument()
    })

    it('pluralizes the credit count', () => {
      const club: Club = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          members: [
            { member_id: 1, member_name: 'Admin User', is_reading: true },
            { member_id: 2, member_name: 'Regular User', is_reading: true },
          ],
        },
      }
      render(<EndSessionModal {...defaultProps} club={club} />)
      expect(screen.getByText('2 members will receive credit.')).toBeInTheDocument()
    })

    it('explains when nobody will get credit', () => {
      const club: Club = {
        ...mockClub,
        active_session: { ...mockClub.active_session!, members: [] },
      }
      render(<EndSessionModal {...defaultProps} club={club} />)
      expect(screen.getByText(/no credit will be awarded/i)).toBeInTheDocument()
    })
  })

  describe('Confirm', () => {
    it('finishes the session, then closes and reports success', async () => {
      const user = userEvent.setup()
      render(<EndSessionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm End' }))

      await waitFor(() => expect(defaultProps.onSessionEnded).toHaveBeenCalled())
      expect(mockInvoke).toHaveBeenCalledWith('session', {
        method: 'PUT',
        body: { id: 'session-1', finish: true },
      })
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('shows the loading state and blocks cancel while ending', async () => {
      const user = userEvent.setup()
      let resolve!: (v: unknown) => void
      mockInvoke.mockReturnValue(new Promise(r => { resolve = r }))
      render(<EndSessionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm End' }))

      expect(screen.getByRole('button', { name: /Ending…/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      resolve({ data: { success: true }, error: null })
      await waitFor(() => expect(defaultProps.onSessionEnded).toHaveBeenCalled())
    })

    it('shows the error message when the request fails', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Forbidden') })
      render(<EndSessionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm End' }))

      expect(await screen.findByText('Forbidden')).toBeInTheDocument()
      expect(defaultProps.onSessionEnded).not.toHaveBeenCalled()
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('falls back to a generic message for non-Error failures', async () => {
      const user = userEvent.setup()
      mockInvoke.mockRejectedValue('boom')
      render(<EndSessionModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm End' }))

      expect(await screen.findByText('Failed to end session')).toBeInTheDocument()
    })

    it('does nothing without an active session', async () => {
      const user = userEvent.setup()
      render(<EndSessionModal {...defaultProps} club={{ ...mockClub, active_session: null }} />)

      await user.click(screen.getByRole('button', { name: 'Confirm End' }))

      expect(mockInvoke).not.toHaveBeenCalled()
    })
  })

  describe('Cancel', () => {
    it('closes and clears a previous error', async () => {
      const user = userEvent.setup()
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Forbidden') })
      const { rerender } = render(<EndSessionModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: 'Confirm End' }))
      await screen.findByText('Forbidden')

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onClose).toHaveBeenCalled()
      rerender(<EndSessionModal {...defaultProps} />)
      expect(screen.queryByText('Forbidden')).not.toBeInTheDocument()
    })
  })
})

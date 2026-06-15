import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AttendanceControl from '../../components/AttendanceControl'
import { mockDiscussion, mockAdminMember } from '../utils/mocks'
import type { AttendanceRoster } from '../../types'

const mockInvokeFunction = vi.fn()

vi.mock('../../supabase', () => ({
  invokeFunction: (...args: unknown[]) => mockInvokeFunction(...args),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ member: mockAdminMember }),
}))

const rosterWithNoResponse: AttendanceRoster = {
  responses: [],
  my_status: null,
  total_members: 3,
}

const rosterWithResponses: AttendanceRoster = {
  responses: [
    { member_id: mockAdminMember.id, name: mockAdminMember.name, status: 'yes' },
    { member_id: 2, name: 'Bob', status: 'no' },
    { member_id: 3, name: 'Carol', status: 'maybe' },
  ],
  my_status: 'yes',
  total_members: 3,
}

describe('AttendanceControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading / empty state', () => {
    it('renders nothing while roster has not loaded', () => {
      mockInvokeFunction.mockReturnValue(new Promise(() => {})) // never resolves
      const { container } = render(<AttendanceControl discussion={mockDiscussion} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when the fetch returns an error', async () => {
      mockInvokeFunction.mockResolvedValue({ data: null, error: new Error('fail') })
      const { container } = render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('Rendering with roster data', () => {
    beforeEach(() => {
      mockInvokeFunction.mockResolvedValue({ data: rosterWithResponses, error: null })
    })

    it('renders the three RSVP buttons', async () => {
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /rsvp no/i })).toBeInTheDocument()
      })
    })

    it('shows correct counts in the stats row', async () => {
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByText(/1 yes/i)).toBeInTheDocument()
        expect(screen.getByText(/1 no/i)).toBeInTheDocument()
        expect(screen.getByText(/1 maybe/i)).toBeInTheDocument()
      })
    })

    it('no button is pressed when my_status is null', async () => {
      mockInvokeFunction.mockResolvedValue({ data: rosterWithNoResponse, error: null })
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp no/i })).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('marks the correct button as pressed when my_status is set', async () => {
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp no/i })).toHaveAttribute('aria-pressed', 'false')
      })
    })
  })

  describe('Interactions', () => {
    it('POSTs and optimistically selects a status, incrementing the count', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({ data: rosterWithNoResponse, error: null }) // GET
        .mockResolvedValue({ data: null, error: null })                      // POST

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByText(/0 yes/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByText(/1 yes/i)).toBeInTheDocument()
      expect(mockInvokeFunction).toHaveBeenCalledWith(
        'discussion-attendance',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ status: 'yes' }) })
      )
    })

    it('DELETEs (clears) when the already-selected status is clicked again, decrementing the count', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({
          data: {
            responses: [{ member_id: mockAdminMember.id, name: mockAdminMember.name, status: 'yes' }],
            my_status: 'yes',
            total_members: 3,
          },
          error: null,
        })
        .mockResolvedValue({ data: null, error: null }) // DELETE

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByText(/1 yes/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByText(/0 yes/i)).toBeInTheDocument()
      expect(mockInvokeFunction).toHaveBeenCalledWith(
        expect.stringContaining('discussion-attendance'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('switches status and updates counts when a different option is clicked', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({
          data: {
            responses: [{ member_id: mockAdminMember.id, name: mockAdminMember.name, status: 'yes' }],
            my_status: 'yes',
            total_members: 3,
          },
          error: null,
        })
        .mockResolvedValue({ data: null, error: null }) // POST

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByText(/1 yes/i)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /rsvp maybe/i }))

      expect(screen.getByText(/0 yes/i)).toBeInTheDocument()
      expect(screen.getByText(/1 maybe/i)).toBeInTheDocument()
    })

    it('rolls back the optimistic update when POST fails', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({ data: rosterWithNoResponse, error: null })    // GET
        .mockResolvedValue({ data: null, error: new Error('server error') })   // POST fails

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      await user.click(screen.getByRole('button', { name: /rsvp yes/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByText(/0 yes/i)).toBeInTheDocument()
      })
    })

    it('rolls back the optimistic update when DELETE fails', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({
          data: {
            responses: [{ member_id: mockAdminMember.id, name: mockAdminMember.name, status: 'maybe' }],
            my_status: 'maybe',
            total_members: 3,
          },
          error: null,
        })
        .mockResolvedValue({ data: null, error: new Error('server error') })

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp maybe/i }))

      await user.click(screen.getByRole('button', { name: /rsvp maybe/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByText(/1 maybe/i)).toBeInTheDocument()
      })
    })
  })

  describe('Disabled state', () => {
    beforeEach(() => {
      mockInvokeFunction.mockResolvedValue({ data: rosterWithResponses, error: null })
    })

    it('renders RSVP buttons as disabled when disabled is true', async () => {
      render(<AttendanceControl discussion={mockDiscussion} disabled />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /rsvp no/i })).toBeDisabled()
      })
    })

    it('does not call invokeFunction to update RSVP when disabled', async () => {
      const user = userEvent.setup()
      render(<AttendanceControl discussion={mockDiscussion} disabled />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp maybe/i }))

      mockInvokeFunction.mockClear()
      await user.click(screen.getByRole('button', { name: /rsvp maybe/i }))

      expect(mockInvokeFunction).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Fetch uses the correct discussion id', () => {
    it('calls GET with the discussion id from props', async () => {
      mockInvokeFunction.mockResolvedValue({ data: rosterWithNoResponse, error: null })
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(mockInvokeFunction).toHaveBeenCalledWith(
          expect.stringContaining(mockDiscussion.id),
          expect.objectContaining({ method: 'GET' })
        )
      })
    })
  })
})

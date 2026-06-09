import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AttendanceControl from '../../components/AttendanceControl'
import { mockDiscussion } from '../utils/mocks'
import type { AttendanceRoster } from '../../types'

const mockInvokeFunction = vi.fn()

vi.mock('../../supabase', () => ({
  invokeFunction: (...args: unknown[]) => mockInvokeFunction(...args),
}))

const rosterWithNoResponse: AttendanceRoster = {
  responses: [],
  my_status: null,
  total_members: 3,
}

const rosterWithResponses: AttendanceRoster = {
  responses: [
    { member_id: 1, name: 'Alice', status: 'yes' },
    { member_id: 2, name: 'Bob', status: 'no' },
    { member_id: 3, name: 'Carol', status: 'maybe' },
  ],
  my_status: null,
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
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp no/i })).toHaveAttribute('aria-pressed', 'false')
      })
    })

    it('marks the correct button as pressed when my_status is set', async () => {
      mockInvokeFunction.mockResolvedValue({
        data: { ...rosterWithResponses, my_status: 'yes' },
        error: null,
      })
      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: /rsvp no/i })).toHaveAttribute('aria-pressed', 'false')
      })
    })
  })

  describe('Interactions', () => {
    it('POSTs and optimistically selects a status', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({ data: rosterWithNoResponse, error: null }) // GET
        .mockResolvedValue({ data: null, error: null })                      // POST

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      await user.click(screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'true')
      expect(mockInvokeFunction).toHaveBeenCalledWith(
        'discussion-attendance',
        expect.objectContaining({ method: 'POST', body: expect.objectContaining({ status: 'yes' }) })
      )
    })

    it('DELETEs (clears) when the already-selected status is clicked again', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({ data: { ...rosterWithNoResponse, my_status: 'yes' }, error: null })
        .mockResolvedValue({ data: null, error: null }) // DELETE

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp yes/i }))

      await user.click(screen.getByRole('button', { name: /rsvp yes/i }))

      expect(screen.getByRole('button', { name: /rsvp yes/i })).toHaveAttribute('aria-pressed', 'false')
      expect(mockInvokeFunction).toHaveBeenCalledWith(
        expect.stringContaining('discussion-attendance'),
        expect.objectContaining({ method: 'DELETE' })
      )
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
      })
    })

    it('rolls back the optimistic update when DELETE fails', async () => {
      const user = userEvent.setup()
      mockInvokeFunction
        .mockResolvedValueOnce({ data: { ...rosterWithNoResponse, my_status: 'maybe' }, error: null })
        .mockResolvedValue({ data: null, error: new Error('server error') })

      render(<AttendanceControl discussion={mockDiscussion} />)
      await waitFor(() => screen.getByRole('button', { name: /rsvp maybe/i }))

      await user.click(screen.getByRole('button', { name: /rsvp maybe/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /rsvp maybe/i })).toHaveAttribute('aria-pressed', 'true')
      })
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

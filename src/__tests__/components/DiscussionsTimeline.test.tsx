import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscussionsTimeline from '../../components/DiscussionsTimeline'
import { mockClub, mockClub2 } from '../utils/mocks'

const mockAttendanceControl = vi.fn((_props: { discussion: { id: string }; disabled?: boolean }) => null)

vi.mock('../../components/AttendanceControl', () => ({
  default: (props: { discussion: { id: string }; disabled?: boolean }) => mockAttendanceControl(props),
}))

describe('DiscussionsTimeline', () => {
  const defaultProps = {
    selectedClub: mockClub,
    isAdmin: true,
    onAddDiscussion: vi.fn(),
    onEditDiscussion: vi.fn(),
    onDeleteDiscussion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should show DISCUSSIONS section label', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      expect(screen.getByText('DISCUSSIONS')).toBeInTheDocument()
    })

    it('should render all discussion titles', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      mockClub.active_session!.discussions.forEach(discussion => {
        expect(screen.getByText(discussion.title)).toBeInTheDocument()
      })
    })

    it('should show discussion location when available', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      expect(screen.getByText('Discord Voice Channel')).toBeInTheDocument()
    })

    it('should not show location when missing', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      expect(screen.queryByText('Location TBD')).not.toBeInTheDocument()
    })
  })

  describe('No Active Session', () => {
    it('should show empty state message when no active session', () => {
      render(<DiscussionsTimeline {...defaultProps} selectedClub={mockClub2} />)

      expect(screen.getByText(/start a session first/i)).toBeInTheDocument()
    })

    it('should show Start Session button for admin when onStartSession is provided', () => {
      const onStartSession = vi.fn()
      render(<DiscussionsTimeline {...defaultProps} selectedClub={mockClub2} onStartSession={onStartSession} />)

      expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument()
    })

    it('should not show Start Session button when onStartSession is not provided', () => {
      render(<DiscussionsTimeline {...defaultProps} selectedClub={mockClub2} />)

      expect(screen.queryByRole('button', { name: /start session/i })).not.toBeInTheDocument()
    })
  })

  describe('Empty Discussions', () => {
    it('should show empty state when no discussions', () => {
      const clubWithNoDiscussions = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithNoDiscussions} />)

      expect(screen.getByText('No discussions scheduled yet.')).toBeInTheDocument()
    })

    it('should show Schedule Discussion button for admin in empty state', () => {
      const clubWithNoDiscussions = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithNoDiscussions} isAdmin={true} />)

      expect(screen.getByRole('button', { name: /schedule discussion/i })).toBeInTheDocument()
    })
  })

  describe('Discussion Status', () => {
    it('should show UP NEXT label for the next upcoming discussion', () => {
      const futureDate1 = new Date()
      futureDate1.setMonth(futureDate1.getMonth() + 1)
      const futureDate2 = new Date()
      futureDate2.setMonth(futureDate2.getMonth() + 2)

      const clubWithFutureDiscussions = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [
            { id: 'disc-1', title: 'Next discussion', date: futureDate1.toISOString(), location: 'Room A' },
            { id: 'disc-2', title: 'Later discussion', date: futureDate2.toISOString(), location: 'Room B' },
          ],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithFutureDiscussions} />)

      expect(screen.getByText('UP NEXT')).toBeInTheDocument()
    })

    it('should not show UP NEXT when all discussions are past', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      expect(screen.queryByText('UP NEXT')).not.toBeInTheDocument()
    })

    it('should apply reduced opacity to past discussion rows', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      const rows = document.querySelectorAll('.opacity-50')
      expect(rows.length).toBeGreaterThan(0)
    })
  })

  describe('Disabled controls for past discussions', () => {
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)

    const clubWithPastAndFuture = {
      ...mockClub,
      active_session: {
        ...mockClub.active_session!,
        discussions: [
          { id: 'disc-past', title: 'Past discussion', date: '2020-01-01', location: 'Room A' },
          { id: 'disc-future', title: 'Future discussion', date: futureDate.toISOString().split('T')[0], location: 'Room B' },
        ],
      },
    }

    it('disables the note button for past discussions but not upcoming ones', () => {
      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithPastAndFuture} onOpenNote={vi.fn()} />)

      const noteButtons = screen.getAllByRole('button', { name: /food for thought/i })
      expect(noteButtons[0]).toBeDisabled()
      expect(noteButtons[1]).not.toBeDisabled()
    })

    it('passes disabled=true to AttendanceControl for past discussions and false for upcoming ones', () => {
      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithPastAndFuture} />)

      const calls = mockAttendanceControl.mock.calls
      const pastCall = calls.find(([props]) => props.discussion.id === 'disc-past')
      const futureCall = calls.find(([props]) => props.discussion.id === 'disc-future')

      expect(pastCall?.[0].disabled).toBe(true)
      expect(futureCall?.[0].disabled).toBe(false)
    })
  })

  describe('Admin Controls', () => {
    it('should show Add button for admin', () => {
      render(<DiscussionsTimeline {...defaultProps} isAdmin={true} />)

      expect(screen.getByRole('button', { name: /^Add$/i })).toBeInTheDocument()
    })

    it('should hide Add button for non-admin', () => {
      render(<DiscussionsTimeline {...defaultProps} isAdmin={false} />)

      expect(screen.queryByRole('button', { name: /^Add$/i })).not.toBeInTheDocument()
    })

    it('should call onAddDiscussion when Add is clicked', async () => {
      const user = userEvent.setup()
      render(<DiscussionsTimeline {...defaultProps} isAdmin={true} />)

      await user.click(screen.getByRole('button', { name: /^Add$/i }))

      expect(defaultProps.onAddDiscussion).toHaveBeenCalledTimes(1)
    })

    it('should show kebab menus for admin', () => {
      render(<DiscussionsTimeline {...defaultProps} isAdmin={true} />)

      const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
      expect(menuButtons.length).toBeGreaterThan(0)
    })

    it('should hide kebab menus for non-admin', () => {
      render(<DiscussionsTimeline {...defaultProps} isAdmin={false} />)

      expect(screen.queryAllByRole('button', { name: /open menu/i }).length).toBe(0)
    })

    it('should call onEditDiscussion when Edit is clicked in kebab menu', async () => {
      const user = userEvent.setup()
      render(<DiscussionsTimeline {...defaultProps} isAdmin={true} />)

      const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
      await user.click(menuButtons[0])
      await user.click(screen.getByRole('button', { name: 'Edit' }))

      expect(defaultProps.onEditDiscussion).toHaveBeenCalledTimes(1)
    })

    it('should call onDeleteDiscussion when Delete is clicked in kebab menu', async () => {
      const user = userEvent.setup()
      render(<DiscussionsTimeline {...defaultProps} isAdmin={true} />)

      const menuButtons = screen.getAllByRole('button', { name: /open menu/i })
      await user.click(menuButtons[0])
      await user.click(screen.getByRole('button', { name: 'Delete' }))

      expect(defaultProps.onDeleteDiscussion).toHaveBeenCalledTimes(1)
    })
  })

  describe('Note button (onOpenNote)', () => {
    it('should render note buttons when onOpenNote is provided', () => {
      const onOpenNote = vi.fn()
      render(<DiscussionsTimeline {...defaultProps} onOpenNote={onOpenNote} />)

      const noteButtons = screen.getAllByRole('button', { name: /food for thought/i })
      expect(noteButtons.length).toBeGreaterThan(0)
    })

    it('should not render note buttons when onOpenNote is omitted', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      expect(screen.queryAllByRole('button', { name: /food for thought/i }).length).toBe(0)
    })

    it('should call onOpenNote with the correct discussion when clicked', async () => {
      const user = userEvent.setup()
      const onOpenNote = vi.fn()

      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)

      const clubWithFutureDiscussion = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [
            { ...mockClub.active_session!.discussions[0], date: futureDate.toISOString().split('T')[0] },
          ],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithFutureDiscussion} onOpenNote={onOpenNote} />)

      const noteButtons = screen.getAllByRole('button', { name: /food for thought/i })
      await user.click(noteButtons[0])

      expect(onOpenNote).toHaveBeenCalledTimes(1)
      expect(onOpenNote).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockClub.active_session!.discussions[0].id })
      )
    })

    it('should show note button for non-admin users', () => {
      const onOpenNote = vi.fn()
      render(<DiscussionsTimeline {...defaultProps} isAdmin={false} onOpenNote={onOpenNote} />)

      const noteButtons = screen.getAllByRole('button', { name: /food for thought/i })
      expect(noteButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Scheduled count', () => {
    it('should show the number of scheduled discussions', () => {
      render(<DiscussionsTimeline {...defaultProps} />)

      const count = mockClub.active_session!.discussions.length
      expect(screen.getByText(`${count} scheduled`)).toBeInTheDocument()
    })
  })

  describe('Time display', () => {
    it('should show formatted time when discussion has a time set', () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)

      const clubWithTimedDiscussion = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [
            { id: 'disc-1', title: 'Timed Discussion', date: futureDate.toISOString().split('T')[0], time: '19:30' },
          ],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithTimedDiscussion} />)

      expect(screen.getByText('7:30 PM')).toBeInTheDocument()
    })

    it('should not show time when discussion has no time set', () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)

      const clubWithUntimed = {
        ...mockClub,
        active_session: {
          ...mockClub.active_session!,
          discussions: [
            { id: 'disc-1', title: 'Untimed Discussion', date: futureDate.toISOString().split('T')[0] },
          ],
        },
      }

      render(<DiscussionsTimeline {...defaultProps} selectedClub={clubWithUntimed} />)

      expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument()
    })
  })
})

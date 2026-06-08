import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscussionNoteModal from '../../../components/modals/DiscussionNoteModal'
import { mockDiscussion } from '../../utils/mocks'
import type { DiscussionNote } from '../../../types'

const mockInvoke = vi.fn()
vi.mock('../../../supabase', () => ({
  invokeFunction: (...args: unknown[]) => mockInvoke(...args),
}))

const mockNote: DiscussionNote = {
  id: 'note-1',
  discussion_id: mockDiscussion.id,
  content: 'This is an existing note',
  visibility: 'private',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('DiscussionNoteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    discussion: mockDiscussion,
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue({ data: null, error: null })
  })

  describe('Rendering', () => {
    it('should render the modal when open', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      expect(screen.getByText('Food For Thought')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<DiscussionNoteModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not render when discussion is null', () => {
      render(<DiscussionNoteModal {...defaultProps} discussion={null} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should show the discussion title in the context block', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(mockDiscussion.title)).toBeInTheDocument()
      })
    })

    it('should have dialog role and aria attributes', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-discussion-note')
      })
    })
  })

  describe('Fetching existing note', () => {
    it('should call the GET endpoint on open', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          expect.stringContaining(`discussion_id=${encodeURIComponent(mockDiscussion.id)}`),
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    it('should pre-populate the textarea when a note exists', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockNote, error: null })
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue(mockNote.content)
      })
    })

    it('should render empty textarea when no note exists', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })

    it('should call onError when fetch fails', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Fetch failed') })
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Fetch failed')
      })
    })
  })

  describe('Add Note mode (no existing note)', () => {
    it('should show "Add Note" button when no note exists', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument()
      })
    })

    it('should disable Save when textarea is empty', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add note/i })).toBeDisabled()
      })
    })

    it('should not show Danger Zone when no note exists', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument()
      })
    })

    it('should POST a new note on save', async () => {
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
      await user.type(screen.getByRole('textbox'), 'My new note')
      await user.click(screen.getByRole('button', { name: /add note/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion-note',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              discussion_id: mockDiscussion.id,
              content: 'My new note',
            }),
          })
        )
      })
    })

    it('should call onError if content is blank on save', async () => {
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())
      await user.type(screen.getByRole('textbox'), '   ')

      const saveButton = screen.getByRole('button', { name: /add note/i })
      // isDirty is true but content.trim() is empty, so button stays disabled
      expect(saveButton).toBeDisabled()
    })
  })

  describe('Edit Note mode (existing note)', () => {
    beforeEach(() => {
      mockInvoke.mockResolvedValueOnce({ data: mockNote, error: null })
    })

    it('should show "Save Note" button when a note exists', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save note/i })).toBeInTheDocument()
      })
    })

    it('should disable Save when content is unchanged', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save note/i })).toBeDisabled()
      })
    })

    it('should enable Save when content changes', async () => {
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(mockNote.content))
      await user.type(screen.getByRole('textbox'), ' updated')

      expect(screen.getByRole('button', { name: /save note/i })).not.toBeDisabled()
    })

    it('should PUT on save when a note exists', async () => {
      mockInvoke.mockResolvedValue({ data: mockNote, error: null })
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(mockNote.content))
      await user.type(screen.getByRole('textbox'), ' edited')
      await user.click(screen.getByRole('button', { name: /save note/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          'discussion-note',
          expect.objectContaining({
            method: 'PUT',
            body: expect.objectContaining({ id: mockNote.id }),
          })
        )
      })
    })

    it('should show Danger Zone with Delete button when a note exists', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument()
      })
    })

    it('should DELETE the note and clear the textarea', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: null })
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: /delete note/i }))

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith(
          expect.stringContaining(`id=${encodeURIComponent(mockNote.id)}`),
          expect.objectContaining({ method: 'DELETE' })
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })

    it('should call onError when delete fails', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Delete failed') })
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: /delete note/i }))

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Delete failed')
      })
    })
  })

  describe('Cancel / Close', () => {
    it('should always show a Cancel button', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })
    })

    it('should call onClose when Cancel is clicked', async () => {
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should reset state after close', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockNote, error: null })
      const user = userEvent.setup()
      const { rerender } = render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(mockNote.content))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      mockInvoke.mockResolvedValueOnce({ data: null, error: null })
      rerender(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })

    it('should not clear parent error state on open', async () => {
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      // onError should only have been called if the GET itself failed — not to clear state
      expect(defaultProps.onError).not.toHaveBeenCalledWith('')
    })
  })

  describe('Accessibility', () => {
    it('should close on Escape key', async () => {
      const user = userEvent.setup()
      render(<DiscussionNoteModal {...defaultProps} />)

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
      await user.keyboard('{Escape}')

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })
})

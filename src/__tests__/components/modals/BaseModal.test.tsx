import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BaseModal from '../../../components/modals/BaseModal'

describe('BaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    labelId: 'modal-title-test',
    children: <p>Modal body</p>,
  }

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<BaseModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeInTheDocument()
    })

    it('returns null when isOpen is false', () => {
      const { container } = render(<BaseModal {...defaultProps} isOpen={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders children', () => {
      render(<BaseModal {...defaultProps} />)
      expect(screen.getByText('Modal body')).toBeInTheDocument()
    })

    it('renders footer when provided', () => {
      render(<BaseModal {...defaultProps} footer={<button>Submit</button>} />)
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })

    it('renders dangerZone when provided', () => {
      render(<BaseModal {...defaultProps} dangerZone={<p>Danger content</p>} />)
      expect(screen.getByText('Danger content')).toBeInTheDocument()
    })

    it('applies max-w-md class when maxWidth is md', () => {
      render(<BaseModal {...defaultProps} maxWidth="md" />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.firstChild).toHaveClass('max-w-md')
    })

    it('applies max-w-sm class by default', () => {
      render(<BaseModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.firstChild).toHaveClass('max-w-sm')
    })
  })

  describe('Accessibility', () => {
    it('has role dialog with aria-modal', () => {
      render(<BaseModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title-test')
    })

    it('title has matching id', () => {
      render(<BaseModal {...defaultProps} />)
      const heading = screen.getByRole('heading', { name: 'Test Modal' })
      expect(heading).toHaveAttribute('id', 'modal-title-test')
    })

    it('Close button has aria-label', () => {
      render(<BaseModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })
  })

  describe('Title variants', () => {
    it('applies copper color for default variant', () => {
      render(<BaseModal {...defaultProps} />)
      const heading = screen.getByRole('heading', { name: 'Test Modal' })
      expect(heading).toHaveStyle({ color: '#D16D30' })
    })

    it('applies danger color for danger variant', () => {
      render(<BaseModal {...defaultProps} titleVariant="danger" />)
      const heading = screen.getByRole('heading', { name: 'Test Modal' })
      expect(heading).toHaveStyle({ color: 'var(--color-danger)' })
    })
  })

  describe('Close behavior', () => {
    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<BaseModal {...defaultProps} onClose={onClose} />)
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose on Escape key', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<BaseModal {...defaultProps} onClose={onClose} />)
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose on Escape when loading', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<BaseModal {...defaultProps} onClose={onClose} loading={true} />)
      await user.keyboard('{Escape}')
      expect(onClose).not.toHaveBeenCalled()
    })

    it('disables Close button when loading', () => {
      render(<BaseModal {...defaultProps} loading={true} />)
      expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import KebabMenu from '../../../components/ui/KebabMenu'

describe('KebabMenu', () => {
  describe('Rendering', () => {
    it('renders trigger button with accessible label', () => {
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('does not render menu items before trigger is clicked', () => {
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('opens menu when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('closes menu when trigger is clicked again', async () => {
      const user = userEvent.setup()
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      const trigger = screen.getByRole('button', { name: /open menu/i })
      await user.click(trigger)
      expect(screen.getByText('Edit')).toBeInTheDocument()
      await user.click(trigger)
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />
        </div>
      )
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      expect(screen.getByText('Edit')).toBeInTheDocument()
      await user.click(screen.getByTestId('outside'))
      await waitFor(() => expect(screen.queryByText('Edit')).not.toBeInTheDocument())
    })
  })

  describe('Menu items', () => {
    it('renders all provided items', async () => {
      const user = userEvent.setup()
      render(
        <KebabMenu items={[
          { label: 'Edit', onClick: vi.fn() },
          { label: 'Delete', onClick: vi.fn(), danger: true },
        ]} />
      )
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('calls onClick when a menu item is clicked', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      render(<KebabMenu items={[{ label: 'Edit', onClick: handleEdit }]} />)
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      await user.click(screen.getByText('Edit'))
      expect(handleEdit).toHaveBeenCalledTimes(1)
    })

    it('closes menu after a menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      await user.click(screen.getByText('Edit'))
      await waitFor(() => expect(screen.queryByText('Edit')).not.toBeInTheDocument())
    })

    it('applies danger styling to danger items', async () => {
      const user = userEvent.setup()
      render(
        <KebabMenu items={[
          { label: 'Safe action', onClick: vi.fn() },
          { label: 'Danger action', onClick: vi.fn(), danger: true },
        ]} />
      )
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      const dangerBtn = screen.getByText('Danger action').closest('button')
      expect(dangerBtn?.className).toMatch(/danger/)
      const safeBtn = screen.getByText('Safe action').closest('button')
      expect(safeBtn?.className).not.toMatch(/danger/)
    })

    it('calls the correct handler when multiple items are present', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      const handleDelete = vi.fn()
      render(
        <KebabMenu items={[
          { label: 'Edit', onClick: handleEdit },
          { label: 'Delete', onClick: handleDelete, danger: true },
        ]} />
      )
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      await user.click(screen.getByText('Delete'))
      expect(handleDelete).toHaveBeenCalledTimes(1)
      expect(handleEdit).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('trigger button has aria-label', () => {
      render(<KebabMenu items={[{ label: 'Edit', onClick: vi.fn() }]} />)
      const trigger = screen.getByRole('button', { name: /open menu/i })
      expect(trigger).toHaveAttribute('aria-label', 'Open menu')
    })

    it('menu items are buttons', async () => {
      const user = userEvent.setup()
      render(
        <KebabMenu items={[
          { label: 'Edit', onClick: vi.fn() },
          { label: 'Delete', onClick: vi.fn(), danger: true },
        ]} />
      )
      await user.click(screen.getByRole('button', { name: /open menu/i }))
      const allButtons = screen.getAllByRole('button')
      // trigger + 2 item buttons
      expect(allButtons.length).toBe(3)
    })
  })
})

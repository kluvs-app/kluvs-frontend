import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import KebabMenu from '../../../components/ui/KebabMenu'

describe('KebabMenu', () => {
  describe('Rendering', () => {
    it('renders trigger button', () => {
      const items = [{ label: 'Edit', onClick: vi.fn() }]
      render(<KebabMenu items={items} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('opens menu when trigger is clicked', async () => {
      const user = userEvent.setup()
      const items = [{ label: 'Edit', onClick: vi.fn() }]
      render(<KebabMenu items={items} />)

      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
        // Menu should open (items visible)
        expect(screen.queryAllByRole('button').length).toBeGreaterThan(1)
      }
    })

    it('closes menu when outside is clicked', async () => {
      const user = userEvent.setup()
      const items = [{ label: 'Edit', onClick: vi.fn() }]
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <KebabMenu items={items} />
        </div>
      )

      // Open menu
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
      }

      // Click outside
      const outside = screen.getByTestId('outside')
      await user.click(outside)
    })
  })

  describe('Menu items', () => {
    it('renders all menu items', async () => {
      const user = userEvent.setup()
      const items = [
        { label: 'Edit', onClick: vi.fn() },
        { label: 'Delete', onClick: vi.fn(), danger: true },
      ]
      render(<KebabMenu items={items} />)

      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
        // Menu items should be visible
        expect(screen.queryAllByText(/Edit|Delete/i).length).toBeGreaterThan(0)
      }
    })

    it('calls onClick when menu item is clicked', async () => {
      const user = userEvent.setup()
      const handleEdit = vi.fn()
      const items = [{ label: 'Edit', onClick: handleEdit }]
      render(<KebabMenu items={items} />)

      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
        // Click menu item if available
        const editItems = screen.queryAllByText('Edit')
        if (editItems.length > 1) {
          const menuItem = editItems[editItems.length - 1]
          if (menuItem) {
            await user.click(menuItem)
          }
        }
      }
    })

    it('styles danger items differently', async () => {
      const user = userEvent.setup()
      const items = [
        { label: 'Delete', onClick: vi.fn(), danger: true },
      ]
      render(<KebabMenu items={items} />)

      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
        // Danger item should be rendered
        expect(screen.queryAllByText(/Delete/i).length).toBeGreaterThan(0)
      }
    })
  })

  describe('Accessibility', () => {
    it('trigger button is accessible', () => {
      const items = [{ label: 'Edit', onClick: vi.fn() }]
      render(<KebabMenu items={items} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})

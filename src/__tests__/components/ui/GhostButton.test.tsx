import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import userEvent from '@testing-library/user-event'
import GhostButton from '../../../components/ui/GhostButton'

describe('GhostButton', () => {
  describe('Rendering', () => {
    it('renders button with children', () => {
      render(<GhostButton>Click me</GhostButton>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders with md variant by default', () => {
      const { container } = render(<GhostButton>Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('px-4')
      expect(button.className).toContain('py-2.5')
    })

    it('renders with sm variant when specified', () => {
      const { container } = render(<GhostButton variant="sm">Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('px-3')
      expect(button.className).toContain('py-1.5')
    })
  })

  describe('Icon', () => {
    it('renders plus icon when icon prop is provided', () => {
      const { container } = render(<GhostButton icon="+">Add</GhostButton>)
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
      expect(icon?.textContent).toBe('+')
    })

    it('does not render icon when icon prop is not provided', () => {
      const { container } = render(<GhostButton>Button</GhostButton>)
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).not.toBeInTheDocument()
    })

    it('uses md icon size with md variant', () => {
      const { container } = render(
        <GhostButton variant="md" icon="+">
          Add
        </GhostButton>
      )
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon?.className).toContain('text-[16px]')
    })

    it('uses sm icon size with sm variant', () => {
      const { container } = render(
        <GhostButton variant="sm" icon="+">
          Add
        </GhostButton>
      )
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon?.className).toContain('text-[14px]')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<GhostButton onClick={handleClick}>Click</GhostButton>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('applies active scale transform on click', async () => {
      const user = userEvent.setup()
      render(<GhostButton>Button</GhostButton>)

      const button = screen.getByRole('button')
      expect(button.className).toContain('active:scale-[0.97]')
    })
  })

  describe('Styling', () => {
    it('applies custom className prop', () => {
      render(<GhostButton className="custom-class">Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('custom-class')
    })

    it('applies base button styles', () => {
      render(<GhostButton>Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('font-medium')
      expect(button.className).toContain('rounded-lg')
      expect(button.className).toContain('cursor-pointer')
      expect(button.className).toContain('whitespace-nowrap')
    })

    it('applies border styling', () => {
      render(<GhostButton>Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('border')
    })

    it('applies hover and transition styles', () => {
      render(<GhostButton>Button</GhostButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('hover:bg-')
      expect(button.className).toContain('transition-')
    })
  })

  describe('Accessibility', () => {
    it('button is keyboard accessible', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<GhostButton onClick={handleClick}>Click</GhostButton>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalled()
    })

    it('icon has aria-hidden attribute', () => {
      const { container } = render(
        <GhostButton icon="+">Add</GhostButton>
      )
      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('HTML attributes', () => {
    it('forwards button attributes', () => {
      render(
        <GhostButton disabled data-testid="test-button">
          Button
        </GhostButton>
      )
      const button = screen.getByTestId('test-button')
      expect(button).toBeDisabled()
    })

    it('accepts aria attributes', () => {
      render(
        <GhostButton aria-label="Custom label">Button</GhostButton>
      )
      const button = screen.getByLabelText('Custom label')
      expect(button).toBeInTheDocument()
    })
  })
})

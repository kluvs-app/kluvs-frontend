import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../../../components/ui/Button'

describe('Button', () => {
  it('defaults to the primary variant', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveClass('t-label', 'h-10', 'rounded-btn', 'px-6', 'bg-primary')
  })

  it.each([
    ['danger', 'bg-danger'],
    ['secondary', 'border-primary'],
    ['outlined', 'border-[var(--color-divider)]'],
  ] as const)('applies the %s variant', (variant, cls) => {
    render(<Button variant={variant}>Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass('px-6', cls)
  })

  it('uses the social layout without the standard side padding', () => {
    render(<Button variant="social">Continue with Google</Button>)
    const button = screen.getByRole('button', { name: 'Continue with Google' })
    expect(button).toHaveClass('w-full', 'px-4')
    expect(button).not.toHaveClass('px-6')
  })

  describe('text variant', () => {
    it('is grey by default', () => {
      render(<Button variant="text">Cancel</Button>)
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('px-3', 'text-[var(--color-text-secondary)]')
    })

    it('is copper when emphasized', () => {
      render(<Button variant="text" emphasized>Edit</Button>)
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('text-primary')
    })

    it('is red when destructive, even if also emphasized', () => {
      render(<Button variant="text" destructive emphasized>Delete</Button>)
      const button = screen.getByRole('button', { name: 'Delete' })
      expect(button).toHaveClass('text-danger')
      expect(button).not.toHaveClass('text-primary')
    })
  })

  it('appends className and forwards native props', () => {
    render(<Button className="w-full" type="submit">Submit</Button>)
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toHaveClass('w-full')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('calls onClick, and not when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<Button onClick={onClick} disabled>Save</Button>)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

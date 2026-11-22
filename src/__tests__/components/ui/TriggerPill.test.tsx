import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriggerPill from '../../../components/ui/TriggerPill'

describe('TriggerPill', () => {
  it('renders a non-submitting button with its label', () => {
    render(<TriggerPill>Copy</TriggerPill>)
    const pill = screen.getByRole('button', { name: 'Copy' })
    expect(pill).toHaveAttribute('type', 'button')
    expect(pill).toHaveClass('t-fine-print', 'rounded-full')
  })

  it('calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<TriggerPill onClick={onClick}>Copy</TriggerPill>)
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses the neutral style by default and the success style when success', () => {
    const { rerender } = render(<TriggerPill>Copy</TriggerPill>)
    expect(screen.getByRole('button')).not.toHaveClass('text-success')

    rerender(<TriggerPill success>Copied</TriggerPill>)
    expect(screen.getByRole('button')).toHaveClass('border-success', 'text-success')
  })

  it('appends className and forwards other props', () => {
    render(<TriggerPill className="ml-2" aria-label="Copy club ID" disabled>Copy</TriggerPill>)
    const pill = screen.getByRole('button', { name: 'Copy club ID' })
    expect(pill).toHaveClass('ml-2')
    expect(pill).toBeDisabled()
  })
})

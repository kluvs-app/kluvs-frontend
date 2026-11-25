import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShelfPill from '../../components/ShelfPill'
import type { ShelfValue } from '../../types'

describe('ShelfPill', () => {
  it('shows "Add to Shelf" when no shelf is set', () => {
    render(<ShelfPill shelf={null} onShelfChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Add to shelf' })).toHaveTextContent('Add to Shelf')
  })

  it('shows the current shelf label', () => {
    render(<ShelfPill shelf="read" onShelfChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Shelf: Read' })).toHaveTextContent('Read')
  })

  it('opens and closes the listbox from the trigger', async () => {
    const user = userEvent.setup()
    render(<ShelfPill shelf={null} onShelfChange={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Add to shelf' })

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('option')).toHaveLength(5)

    await user.click(trigger)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('marks the current shelf as selected', async () => {
    const user = userEvent.setup()
    render(<ShelfPill shelf="want_to_read" onShelfChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Shelf: Want to Read' }))
    expect(screen.getByRole('option', { name: 'Want to Read' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Read' })).toHaveAttribute('aria-selected', 'false')
  })

  it('reports the picked shelf and closes', async () => {
    const user = userEvent.setup()
    const onShelfChange = vi.fn()
    render(<ShelfPill shelf={null} onShelfChange={onShelfChange} />)
    await user.click(screen.getByRole('button', { name: 'Add to shelf' }))
    await user.click(screen.getByRole('option', { name: 'Currently Reading' }))
    expect(onShelfChange).toHaveBeenCalledWith('currently_reading')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('reports null when "None" is picked', async () => {
    const user = userEvent.setup()
    const onShelfChange = vi.fn()
    render(<ShelfPill shelf="read" onShelfChange={onShelfChange} />)
    await user.click(screen.getByRole('button', { name: 'Shelf: Read' }))
    await user.click(screen.getByRole('option', { name: 'None' }))
    expect(onShelfChange).toHaveBeenCalledWith(null)
  })

  it('closes when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <ShelfPill shelf={null} onShelfChange={vi.fn()} />
        <p>outside</p>
      </div>
    )
    await user.click(screen.getByRole('button', { name: 'Add to shelf' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByText('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('cannot be opened when disabled', async () => {
    const user = userEvent.setup()
    render(<ShelfPill shelf={null} onShelfChange={vi.fn()} disabled />)
    await user.click(screen.getByRole('button', { name: 'Add to shelf' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows a generic label for an unknown shelf and selects no option', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<ShelfPill shelf={'paused' as ShelfValue} onShelfChange={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Shelf: Shelved' })
    expect(trigger).toHaveTextContent('Shelved')
    await user.click(trigger)
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveAttribute('aria-selected', 'false')
    }
  })
})

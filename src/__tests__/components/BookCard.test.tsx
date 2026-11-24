import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BookCard from '../../components/BookCard'

describe('BookCard', () => {
  it('renders the title, author and year', () => {
    render(<BookCard title="Dune" author="Frank Herbert" year={1965} onClick={vi.fn()} />)
    expect(screen.getByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('Frank Herbert · 1965')).toBeInTheDocument()
  })

  it('renders only the year when there is no author', () => {
    render(<BookCard title="Dune" year={1965} onClick={vi.fn()} />)
    expect(screen.getByText('1965')).toBeInTheDocument()
  })

  it('omits the meta line when there is no author or year', () => {
    const { container } = render(<BookCard title="Dune" onClick={vi.fn()} />)
    expect(container.querySelector('.t-fine-print')).not.toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<BookCard title="Dune" onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows the read ribbon when a badge is given', () => {
    render(<BookCard title="Dune" onClick={vi.fn()} badge={{ label: 'Read by the club' }} />)
    expect(screen.getByLabelText('Read by the club')).toHaveClass('kluvs-read-ribbon--lg')
  })

  it('uses the compact width and md ribbon when compact', () => {
    render(<BookCard title="Dune" onClick={vi.fn()} compact badge={{ label: 'Read' }} />)
    expect(screen.getByRole('button')).toHaveClass('w-[80px]')
    expect(screen.getByLabelText('Read')).toHaveClass('kluvs-read-ribbon--md')
  })
})

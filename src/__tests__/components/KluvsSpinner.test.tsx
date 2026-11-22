import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KluvsSpinner from '../../components/KluvsSpinner'

describe('KluvsSpinner', () => {
  it('renders an accessible loading image', () => {
    render(<KluvsSpinner />)
    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument()
  })

  it('defaults to 64px and the primary color', () => {
    render(<KluvsSpinner />)
    const svg = screen.getByRole('img', { name: 'Loading' })
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
    expect(svg.querySelector('g')).toHaveAttribute('fill', 'var(--color-primary, #D16D30)')
  })

  it('applies custom size, color and className', () => {
    render(<KluvsSpinner size={14} color="var(--color-on-primary)" className="extra" />)
    const svg = screen.getByRole('img', { name: 'Loading' })
    expect(svg).toHaveAttribute('width', '14')
    expect(svg).toHaveClass('kluvs-spinner', 'extra')
    expect(svg.querySelector('g')).toHaveAttribute('stroke', 'var(--color-on-primary)')
  })
})

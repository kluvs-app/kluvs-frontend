import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KluvsReadRibbon from '../../components/KluvsReadRibbon'

describe('KluvsReadRibbon', () => {
  it('exposes the label to assistive tech and as a tooltip', () => {
    render(<KluvsReadRibbon label="Read by the club" />)
    const ribbon = screen.getByLabelText('Read by the club')
    expect(ribbon).toHaveAttribute('title', 'Read by the club')
  })

  it('defaults to the md size', () => {
    render(<KluvsReadRibbon label="Read" />)
    expect(screen.getByLabelText('Read')).toHaveClass('kluvs-read-ribbon--md')
  })

  it.each(['sm', 'lg'] as const)('applies the %s size modifier', (size) => {
    render(<KluvsReadRibbon label="Read" size={size} />)
    expect(screen.getByLabelText('Read')).toHaveClass(`kluvs-read-ribbon--${size}`)
  })
})

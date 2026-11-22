import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KluvsReadBadge from '../../components/KluvsReadBadge'

describe('KluvsReadBadge', () => {
  it('exposes the label to assistive tech and as a tooltip', () => {
    render(<KluvsReadBadge label="Read with Kluvs" />)
    const badge = screen.getByLabelText('Read with Kluvs')
    expect(badge).toHaveAttribute('title', 'Read with Kluvs')
  })

  it('renders the hexagon icon', () => {
    render(<KluvsReadBadge label="Read with Kluvs" />)
    expect(screen.getByLabelText('Read with Kluvs').querySelector('svg')).toBeInTheDocument()
  })
})

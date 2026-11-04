import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'
import { VERSION } from '../../version'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )
}

describe('Footer', () => {
  it('should render the brand slogan', () => {
    renderFooter()
    expect(screen.getByText('Reading is done best together.')).toBeInTheDocument()
  })

  it.each([
    ['Privacy', '/privacy'],
    ['Terms', '/terms'],
    ['Discord', '/discord'],
  ])('should link "%s" to %s', (name, href) => {
    renderFooter()
    const nav = screen.getByRole('navigation', { name: 'Footer' })
    expect(within(nav).getByRole('link', { name })).toHaveAttribute('href', href)
  })

  it('should render the copyright notice', () => {
    renderFooter()
    expect(screen.getByText(/© 2026 Kluvs/)).toBeInTheDocument()
  })

  it('should render the app version', () => {
    renderFooter()
    expect(screen.getByText(`v${VERSION}`)).toBeInTheDocument()
  })
})

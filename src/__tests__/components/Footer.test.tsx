import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from '../../components/Footer'
import { VERSION } from '../../version'

function renderFooter(props: { showVersion?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <Footer {...props} />
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

  it.each([
    ['GitHub', 'https://github.com/kluvs-app'],
    ['Instagram', 'https://www.instagram.com/kluvs.app'],
    ['X', 'https://x.com/KluvsApp'],
    ['TikTok', 'https://www.tiktok.com/@kluvs.app'],
  ])('should link %s in a new tab', (name, href) => {
    renderFooter()
    const list = screen.getByRole('list', { name: 'Social media' })
    const link = within(list).getByRole('link', { name: `Kluvs on ${name}` })
    expect(link).toHaveAttribute('href', href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('should render the copyright notice', () => {
    renderFooter()
    expect(screen.getByText(/© 2026 Kluvs/)).toBeInTheDocument()
  })

  it('should hide the app version by default', () => {
    renderFooter()
    expect(screen.queryByText(`v${VERSION}`)).not.toBeInTheDocument()
  })

  it('should render the app version when showVersion is set', () => {
    renderFooter({ showVersion: true })
    expect(screen.getByText(`v${VERSION}`)).toBeInTheDocument()
  })
})

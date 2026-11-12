import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import FaqPage from '../../pages/FaqPage'
import { faqCategories } from '../../content/faq'

function renderFaq(initialEntry = '/faq') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ThemeProvider>
        <FaqPage />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('FaqPage', () => {
  beforeEach(() => {
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders the page title', () => {
    renderFaq()
    expect(screen.getByRole('heading', { name: /Frequently asked questions/i, level: 1 })).toBeInTheDocument()
  })

  it('renders every category as a heading', () => {
    renderFaq()
    for (const category of faqCategories) {
      expect(screen.getByRole('heading', { name: category.title, level: 2 })).toBeInTheDocument()
    }
  })

  it('renders every question, collapsed by default', () => {
    renderFaq()
    for (const category of faqCategories) {
      for (const item of category.items) {
        const el = document.getElementById(item.id)
        expect(el).toBeInstanceOf(HTMLDetailsElement)
        expect((el as HTMLDetailsElement).open).toBe(false)
        expect(screen.getByText(item.question)).toBeInTheDocument()
      }
    }
  })

  it('opens and scrolls to the question named in the URL hash', () => {
    renderFaq('/faq#club-session-discussion')
    const el = document.getElementById('club-session-discussion') as HTMLDetailsElement
    expect(el.open).toBe(true)
    expect(el.scrollIntoView).toHaveBeenCalled()
  })

  it('leaves other questions closed when a hash is present', () => {
    renderFaq('/faq#club-session-discussion')
    expect((document.getElementById('what-is-kluvs') as HTMLDetailsElement).open).toBe(false)
  })

  it('ignores an unknown hash without throwing', () => {
    expect(() => renderFaq('/faq#does-not-exist')).not.toThrow()
  })

  it('renders internal Markdown links through the router', () => {
    renderFaq()
    const link = screen.getAllByRole('link', { name: 'Privacy Policy' })[0]
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('gives each question a permalink', () => {
    renderFaq()
    const el = document.getElementById('what-is-kluvs') as HTMLElement
    const permalink = el.querySelector('a[href="#what-is-kluvs"]')
    expect(permalink).not.toBeNull()
  })
})

describe('faq content contract', () => {
  const ids = faqCategories.flatMap((c) => c.items.map((i) => i.id))

  it('has unique, URL-safe ids', () => {
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('keeps the ids that other platforms may deep-link to', () => {
    // Removing or renaming any of these breaks external links; see the contract in content/faq.ts.
    expect(ids).toContain('club-session-discussion')
    expect(ids).toContain('connect-discord')
    expect(ids).toContain('delete-account')
  })
})

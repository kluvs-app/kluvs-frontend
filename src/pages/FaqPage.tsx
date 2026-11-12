import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown, { type Components } from 'react-markdown'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { faqCategories } from '../content/faq'
import { card } from '../constants/marketingStyles'

// FAQ answers only link to other pages of this site (e.g. /privacy), so route them through
// the router. A content test enforces that answers contain no external links.
const markdownComponents: Components = {
  a: ({ href, children }) => <Link to={href ?? '/'}>{children}</Link>,
}

function copyQuestionUrl(id: string) {
  // Best effort; the anchor's default navigation still updates the URL hash.
  navigator.clipboard?.writeText(`${window.location.origin}/faq#${id}`)?.catch(() => {})
}

export default function FaqPage() {
  const { hash } = useLocation()

  // Deep links (/faq#club-session-discussion): open the targeted question and scroll to it.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el instanceof HTMLDetailsElement) {
      el.open = true
      el.scrollIntoView?.({ block: 'start' })
    }
  }, [hash])

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header showDiscordLink={true} />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="font-serif font-medium text-[34px] leading-[1.15] text-[var(--color-text-primary)] mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)]">
            New to Kluvs? Start with how clubs, sessions, and discussions fit together.
          </p>
        </header>

        <div className="flex flex-col gap-12">
          {faqCategories.map((category) => (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              <h2
                id={`cat-${category.id}`}
                className="font-serif font-medium text-[24px] text-[var(--color-text-primary)] mb-4"
              >
                {category.title}
              </h2>

              <div className="flex flex-col gap-3">
                {category.items.map((item) => (
                  <div key={item.id} className="relative group/item">
                    {/* Permalink: sits outside the card's left edge, revealed on hover or keyboard
                        focus. Wide screens only; there is no room (or hover) on phones. */}
                    <a
                      href={`#${item.id}`}
                      aria-label={`Link to: ${item.question}`}
                      onClick={() => copyQuestionUrl(item.id)}
                      className="hidden lg:flex absolute -left-9 top-4 w-7 h-7 items-center justify-center rounded-btn text-[var(--color-text-meta)] hover:text-[var(--color-text-primary)] opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        link
                      </span>
                    </a>
                    <details id={item.id} className={`${card} group scroll-mt-24`}>
                      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 font-medium text-[var(--color-text-primary)]">
                        <span>{item.question}</span>
                        <span
                          className="material-symbols-outlined text-[var(--color-text-meta)] transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </summary>
                      <div className="px-5 pb-5 prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary-hover">
                        <ReactMarkdown components={markdownComponents}>{item.answer}</ReactMarkdown>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}

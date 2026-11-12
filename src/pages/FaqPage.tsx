import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown, { type Components } from 'react-markdown'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { faqCategories } from '../content/faq'
import { eyebrow, card } from '../constants/marketingStyles'

// Internal links (e.g. /privacy) go through the router; everything else is a plain anchor.
const markdownComponents: Components = {
  a: ({ href, children }) =>
    href?.startsWith('/') ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
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
          <p className={`${eyebrow} text-[var(--color-text-meta)] mb-3`}>FAQ</p>
          <h1 className="font-serif font-medium text-[34px] leading-[1.15] text-[var(--color-text-primary)] mb-3">
            Frequently asked questions
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
                  <details key={item.id} id={item.id} className={`${card} group scroll-mt-24`}>
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
                      <p className="not-prose mt-3">
                        <a
                          href={`#${item.id}`}
                          className="text-[12px] text-[var(--color-text-meta)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          Link to this question
                        </a>
                      </p>
                    </div>
                  </details>
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

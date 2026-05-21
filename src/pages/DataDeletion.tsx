import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import content from '../content/data-deletion.md?raw'

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-divider)] px-6 py-4 flex items-center gap-3">
        <img src="/ic-mark.svg" alt="Kluvs" className="h-7 w-7" />
        <span className="text-section-heading font-serif font-bold tracking-widest uppercase text-[var(--color-text-primary)]">Kluvs</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary-hover">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>

        <div className="mt-16 pt-8 border-t border-[var(--color-divider)]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-body text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Kluvs
          </Link>
        </div>
      </main>
    </div>
  )
}

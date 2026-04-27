import ReactMarkdown from 'react-markdown'
import Header from '../components/Header'
import content from '../content/terms-of-use.md?raw'

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary-hover">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </main>
    </div>
  )
}

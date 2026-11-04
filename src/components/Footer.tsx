import { Link } from 'react-router-dom'
import { VERSION } from '../version'

const eyebrowLink =
  'font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text-primary)] transition-colors'

function Dot() {
  return <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-disabled)] flex-shrink-0 inline-block" aria-hidden="true" />
}

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-divider)] px-6 pt-10 pb-8 text-center">
      <p className="font-serif italic text-[17px] leading-none text-[var(--color-text-meta)] mb-5">
        Reading is done best together.
      </p>
      <nav aria-label="Footer" className="inline-flex items-center gap-3 mb-5">
        <Link to="/privacy" className={eyebrowLink}>Privacy</Link>
        <Dot />
        <Link to="/terms" className={eyebrowLink}>Terms</Link>
        <Dot />
        <Link to="/discord" className={eyebrowLink}>Discord</Link>
      </nav>
      <p className="text-helper-sm text-[var(--color-text-meta)]">
        © 2026 Kluvs. All rights reserved.
      </p>
      <p className="absolute bottom-2 right-6 text-helper text-[var(--color-text-secondary)] opacity-50">
        v{VERSION}
      </p>
    </footer>
  )
}

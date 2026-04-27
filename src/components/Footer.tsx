import { Link } from 'react-router-dom'
import { VERSION } from '../version'

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-divider)] px-6 py-8 space-y-2 text-center">
      <p className="text-helper text-[var(--color-text-secondary)]">
        © 2026 Kluvs. All rights reserved.
      </p>
      <p className="text-helper space-x-3">
        <Link
          to="/privacy"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-[var(--color-divider)]">·</span>
        <Link
          to="/terms"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-2 transition-colors"
        >
          Terms of Use
        </Link>
      </p>
      <p className="absolute bottom-2 right-6 text-helper text-[var(--color-text-secondary)] opacity-50">
        v{VERSION}
      </p>
    </footer>
  )
}

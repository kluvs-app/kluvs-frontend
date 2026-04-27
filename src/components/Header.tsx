import { Link } from 'react-router-dom'

interface HeaderProps {
  showOpenAppButton?: boolean
}

export default function Header({ showOpenAppButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <img src="/ic-mark.svg" alt="Kluvs" className="h-8 w-8" />
        <span className="text-section-heading text-[var(--color-text-primary)]">Kluvs</span>
      </Link>

      {showOpenAppButton && (
        <Link
          to="/app"
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-body font-medium transition-colors"
        >
          Open App
        </Link>
      )}
    </header>
  )
}

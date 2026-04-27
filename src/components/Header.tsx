import { Link } from 'react-router-dom'

interface HeaderProps {
  clickable?: boolean
  showOpenAppButton?: boolean
}

export default function Header({ clickable = true, showOpenAppButton = false }: HeaderProps) {
  const logoContent = (
    <div className="flex items-center gap-3">
      <img src="/ic-mark.svg" alt="Kluvs" className="h-8 w-8" />
      <span className="text-section-heading text-[var(--color-text-primary)]">Kluvs</span>
    </div>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 py-4 flex items-center justify-between">
      {clickable ? (
        <Link to="/" className="flex items-center gap-3">
          {logoContent}
        </Link>
      ) : (
        logoContent
      )}

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

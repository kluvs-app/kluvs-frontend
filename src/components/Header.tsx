import { Link } from 'react-router-dom'

interface HeaderProps {
  showOpenAppButton?: boolean
}

export default function Header({ showOpenAppButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-7 w-auto dark:hidden" />
        <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-7 w-auto hidden dark:block" />
      </Link>

      {showOpenAppButton && (
        <a
          href={`${import.meta.env.VITE_OAUTH_REDIRECT_URL}/me`}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-body font-medium transition-colors"
        >
          Dashboard
        </a>
      )}
    </header>
  )
}

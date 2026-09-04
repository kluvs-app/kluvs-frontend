import { Link } from 'react-router-dom'

interface HeaderProps {
  showOpenAppButton?: boolean
}

// The real marketing sites (kluvs.com production, kluvs.xyz integration) are each a
// separate deployment from their own app.* subdomain, so they must jump cross-origin to
// VITE_OAUTH_REDIRECT_URL (the app.* host registered with the OAuth providers for that
// environment). Every other host — Vercel previews, localhost — serves marketing and app
// routes from the same origin, so this button should stay there instead of bouncing out
// to a different environment entirely.
const KNOWN_MARKETING_HOSTS = ['kluvs.com', 'www.kluvs.com', 'kluvs.xyz', 'www.kluvs.xyz']

export default function Header({ showOpenAppButton = false }: HeaderProps) {
  const dashboardHref = KNOWN_MARKETING_HOSTS.includes(window.location.hostname)
    ? `${import.meta.env.VITE_OAUTH_REDIRECT_URL}/me`
    : `${window.location.origin}/me`

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-7 w-auto dark:hidden" />
        <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-7 w-auto hidden dark:block" />
      </Link>

      {showOpenAppButton && (
        <a
          href={dashboardHref}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-body font-medium transition-colors"
        >
          Dashboard
        </a>
      )}
    </header>
  )
}

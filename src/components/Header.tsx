import { Link } from 'react-router-dom'
import DiscordIcon from './icons/DiscordIcon'
import { getAppHref } from '../utils/domainNav'

interface HeaderProps {
  showOpenAppButton?: boolean
  /** Marketing-domain only: /discord doesn't exist on the app domain. */
  showDiscordLink?: boolean
}

export default function Header({ showOpenAppButton = false, showDiscordLink = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center">
        <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-7 w-auto dark:hidden" />
        <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-7 w-auto hidden dark:block" />
      </Link>

      {(showDiscordLink || showOpenAppButton) && (
        <nav aria-label="Main" className="flex items-center gap-2">
          {showDiscordLink && (
            // Icon-only below sm so the bar fits on one line on phones; aria-label keeps the
            // accessible name "Discord" at every width.
            <Link
              to="/discord"
              aria-label="Discord"
              className="inline-flex items-center gap-2 p-2 sm:px-3 rounded-btn text-body font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <DiscordIcon className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Discord</span>
            </Link>
          )}
          {showOpenAppButton && (
            <a
              href={getAppHref('/me')}
              className="border border-[var(--color-divider)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-4 py-2 rounded-btn text-body font-medium transition-colors"
            >
              Open Kluvs
            </a>
          )}
        </nav>
      )}
    </header>
  )
}

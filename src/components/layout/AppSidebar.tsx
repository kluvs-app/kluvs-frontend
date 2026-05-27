import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarUrl } from '../../supabase'
import { VERSION } from '../../version'
import SignOutModal from '../modals/SignOutModal'
import DiscordLinkModal from '../modals/DiscordLinkModal'

// ─── Icons ────────────────────────────────────────────────────────────────────
// Material Symbols, weight 600, 24px — sourced from public/icons/

const MS_VIEWBOX = "0 -960 960 960"

function IconMe() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox={MS_VIEWBOX} fill="currentColor">
      <path d="M480-489.61q-74.48 0-126.85-52.37-52.37-52.37-52.37-126.85 0-74.48 52.37-126.56 52.37-52.09 126.85-52.09 74.48 0 126.85 52.09 52.37 52.08 52.37 126.56t-52.37 126.85Q554.48-489.61 480-489.61ZM140.78-131.17v-132.35q0-39.26 20.44-72.17 20.43-32.9 54.3-50.22 63.7-31.57 129.93-47.63 66.24-16.07 134.55-16.07 69.39 0 135.65 15.78 66.26 15.79 128.83 47.35 33.87 17.24 54.3 49.99 20.44 32.75 20.44 72.94v132.38H140.78Z" />
    </svg>
  )
}

function IconClubs() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox={MS_VIEWBOX} fill="currentColor">
      <path d="M264.65-107 48.74-480l215.91-373h430.7l215.91 373-215.91 373h-430.7Z" />
    </svg>
  )
}

function IconBooks() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox={MS_VIEWBOX} fill="currentColor">
      <path d="M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z" />
    </svg>
  )
}

// ─── Nav items config ─────────────────────────────────────────────────────────

const NAV = [
  { label: 'Me',    base: '/me',    Icon: IconMe },
  { label: 'Clubs', base: '/clubs', Icon: IconClubs },
  { label: 'Books', base: '/books', Icon: IconBooks },
]

function getClubsTo(): string {
  return '/clubs'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const { member } = useAuth()
  const location = useLocation()
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showDiscordLinkModal, setShowDiscordLinkModal] = useState(false)

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-[220px] bg-[var(--color-bg-raised)] border-r border-[var(--color-divider)] z-30">
        {/* Brand */}
        <a
          href={import.meta.env.VITE_OAUTH_REDIRECT_URL?.replace('app.', '') ?? '/'}
          className="flex items-center px-5 h-16 shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-6 w-auto dark:hidden" />
          <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-6 w-auto hidden dark:block" />
        </a>

        <hr className="border-t border-[var(--color-divider)] mx-4 mb-2" />

        {/* Profile card */}
        <Link
          to="/me"
          className="flex items-center gap-2.5 mx-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <div className="relative h-8 w-8 shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
              {member?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {member?.avatar_path && (
              <img
                src={getAvatarUrl(member.avatar_path)}
                alt={member.name}
                className="absolute inset-0 h-8 w-8 rounded-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate leading-tight">
              {member?.name ?? 'User'}
            </p>
            {member?.handle && (
              <p className="text-xs text-[var(--color-text-secondary)] truncate leading-tight">
                {member.handle.startsWith('@') ? member.handle : `@${member.handle}`}
              </p>
            )}
          </div>
        </Link>

        <hr className="border-t border-[var(--color-divider)] mx-4 my-2" />

        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5 px-3" aria-label="Main navigation">
          {NAV.map(({ label, base, Icon }) => {
            const active = location.pathname.startsWith(base)
            const to = label === 'Clubs' ? getClubsTo() : base
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'text-primary bg-[rgba(209,109,48,0.12)] shadow-[inset_3px_0_0_#D16D30]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer actions */}
        <div className="border-t border-dashed border-[var(--color-divider)] p-3 space-y-0.5">
          {/* Connect Discord — only shown when not yet linked */}
          {!member?.discord_id && (
            <button
              onClick={() => setShowDiscordLinkModal(true)}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm font-medium text-[#5865F2] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <img src="/ic-discord.svg" alt="" className="w-5 h-5 shrink-0" />
              Connect Discord
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={() => setShowSignOutModal(true)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-danger hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>

          {/* Version */}
          <p className="px-2 pt-1 text-xs text-[var(--color-text-secondary)] opacity-50">v{VERSION}</p>
        </div>
      </aside>

      <SignOutModal isOpen={showSignOutModal} onClose={() => setShowSignOutModal(false)} />
      <DiscordLinkModal isOpen={showDiscordLinkModal} onClose={() => setShowDiscordLinkModal(false)} />
    </>
  )
}


import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarUrl } from '../../supabase'
import { VERSION } from '../../version'
import SignOutModal from '../modals/SignOutModal'
import DiscordLinkModal from '../modals/DiscordLinkModal'

// ─── Icons ────────────────────────────────────────────────────────────────────
// Material Symbols, weight 600, 24px — unfilled (inactive) / filled (active)

function IconMe({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12q-1.65 0-2.825-1.175T8 8q0-1.65 1.175-2.825T12 5q1.65 0 2.825 1.175T16 8q0 1.65-1.175 2.825T12 12Zm-8 6v-.8q0-.85.438-1.563.437-.712 1.162-1.087 1.55-.775 3.15-1.163Q10.35 13 12 13t3.25.387q1.6.388 3.15 1.163.725.375 1.163 1.087Q20 16.35 20 17.2V18H4Z" />
    </svg>
  ) : (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function IconClubs({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 18v-1.575q0-.875.45-1.637.45-.763 1.3-1.163 1.775-.8 3.45-1.212Q6.875 12 8.6 12q1.725 0 3.4.413 1.675.412 3.45 1.212.85.4 1.3 1.163Q17.2 15.55 17.2 16.425V18H0Zm19 0v-1.575q0-1.15-.588-2.162-.587-1.013-1.637-1.638.9.125 1.713.375.812.25 1.537.6.7.35 1.087 1.012Q21 15.275 21 16.425V18h-2ZM8.6 11q-1.55 0-2.525-.975Q5.1 9.05 5.1 7.5q0-1.55.975-2.525Q7.05 4 8.6 4q1.55 0 2.525.975Q12.1 5.95 12.1 7.5q0 1.55-.975 2.525Q10.15 11 8.6 11Zm9.4-3.5q0 1.55-.975 2.525Q16.05 11 14.5 11q-.275 0-.7-.062-.425-.063-.7-.138.675-.8 1.037-1.775Q14.5 8.05 14.5 7.5q0-.55-.363-1.525Q13.775 4.975 13.1 4.2q.35-.125.7-.163Q14.15 4 14.5 4q1.55 0 2.525.975Q18 5.95 18 7.5Z" />
    </svg>
  ) : (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  )
}

function IconBooks({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
    </svg>
  ) : (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

// ─── Nav items config ─────────────────────────────────────────────────────────

const NAV = [
  { label: 'Me',    base: '/me',     Icon: IconMe },
  { label: 'Clubs', base: '/clubs',  Icon: IconClubs },
  { label: 'Books', base: '/books',  Icon: IconBooks },
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
          className="flex items-center gap-2.5 px-5 h-16 shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src="/ic-mark.svg" alt="" className="h-7 w-7" />
          <span className="font-serif font-bold text-lg tracking-widest uppercase text-[var(--color-text-primary)]">
            KLUVS
          </span>
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
                <Icon filled={active} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer actions */}
        <div className="border-t border-dashed border-[var(--color-divider)] p-3 space-y-0.5">
          {/* Discord */}
          {!member?.discord_id ? (
            <button
              onClick={() => setShowDiscordLinkModal(true)}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm font-medium text-[#5865F2] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <img src="/ic-discord.svg" alt="" className="w-5 h-5 shrink-0" />
              Connect Discord
            </button>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-[var(--color-text-secondary)]">
              <img src="/ic-discord.svg" alt="" className="w-5 h-5 shrink-0 opacity-40" />
              Connected
            </div>
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


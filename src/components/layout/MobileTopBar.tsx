import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useMobileTopBar } from '../../contexts/MobileTopBarContext'
import { getAvatarUrl } from '../../supabase'
import SignOutModal from '../modals/SignOutModal'
import EditProfileModal from '../modals/EditProfileModal'
import DiscordLinkModal from '../modals/DiscordLinkModal'
import DiscordIcon from '../icons/DiscordIcon'

const MS_VIEWBOX = '0 -960 960 960'

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' | 'system' }) {
  if (theme === 'dark') return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

export default function MobileTopBar() {
  const { member, refreshMemberData } = useAuth()
  const { theme, setTheme } = useTheme()
  const { state } = useMobileTopBar()

  const [menuOpen, setMenuOpen]               = useState(false)
  const [showSignOut, setShowSignOut]         = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showDiscordLink, setShowDiscordLink] = useState(false)

  const themeLabel = theme === 'dark' ? 'Dark' : 'Light'
  const cycleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const initials  = nameInitials(member?.name ?? '?')
  const avatarUrl = member?.avatar_path ? getAvatarUrl(member.avatar_path) : null
  const isDetail  = !!state.title

  const menuItemBase = 'flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors duration-120'

  const BackButton = () => {
    const inner = (
      <>
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="text-[13px] font-medium">
          {state.backLabel ?? 'Back'}
        </span>
      </>
    )

    const cls = 'flex items-center gap-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors'

    if (state.onBack) {
      return <button onClick={state.onBack} className={cls}>{inner}</button>
    }
    return (
      <Link to={state.backPath ?? '/'} className={cls}>
        {inner}
      </Link>
    )
  }

  return (
    <>
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14"
        style={{
          background: 'var(--color-bg-raised)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="h-full px-4 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: back button in detail mode, empty otherwise */}
          <div className="flex items-center">
            {isDetail && <BackButton />}
          </div>

          {/* Center: wordmark — always */}
          <a
            href={import.meta.env.VITE_OAUTH_REDIRECT_URL?.replace('app.', '') ?? '/'}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Kluvs home"
          >
            <img src="/kluvs-lockup-dark.svg" alt="Kluvs" className="h-6 w-auto dark:hidden" />
            <img src="/kluvs-lockup-light.svg" alt="Kluvs" className="h-6 w-auto hidden dark:block" />
          </a>

          {/* Right: avatar + kebab */}
          <div className="flex items-center justify-end">
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Open user menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors hover:bg-[var(--color-bg-elevated)]"
            >
              {/* Avatar */}
              <div className="relative w-8 h-8 shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-medium font-serif"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {initials}
                </div>
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={member?.name}
                    className="absolute inset-0 w-8 h-8 rounded-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>

              {/* more_vert */}
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" viewBox={MS_VIEWBOX} fill="currentColor" aria-hidden>
                <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                <div
                  className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl shadow-lg overflow-hidden"
                  style={{
                    background: 'var(--color-bg-raised)',
                    border: '1px solid var(--color-divider)',
                    maxWidth: 'calc(100vw - 1rem)',
                  }}
                  role="menu"
                >
                  {/* Identity header */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate leading-tight">
                      {member?.name ?? 'User'}
                    </p>
                    {member?.handle && (
                      <p className="text-xs text-[var(--color-text-secondary)] truncate leading-tight mt-0.5">
                        {member.handle.startsWith('@') ? member.handle : `@${member.handle}`}
                      </p>
                    )}
                  </div>

                  {/* Edit Profile */}
                  <button
                    role="menuitem"
                    onClick={() => { setShowEditProfile(true); setMenuOpen(false) }}
                    className={`${menuItemBase} text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]`}
                  >
                    <svg className="w-[18px] h-[18px] shrink-0" viewBox={MS_VIEWBOX} fill="currentColor">
                      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                    </svg>
                    Edit Profile
                  </button>

                  {!member?.discord_id && (
                    <button
                      role="menuitem"
                      onClick={() => { setShowDiscordLink(true); setMenuOpen(false) }}
                      className={`${menuItemBase} text-[#5865F2] hover:bg-[var(--color-bg-elevated)]`}
                    >
                      <DiscordIcon className="w-[18px] h-[18px] shrink-0" />
                      Connect Discord
                    </button>
                  )}

                  <div style={{ borderTop: '1px solid var(--color-divider)' }} />

                  {/* Appearance */}
                  <button
                    role="menuitem"
                    onClick={cycleTheme}
                    className={`${menuItemBase} text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]`}
                  >
                    <ThemeIcon theme={theme} />
                    <span className="flex-1 text-left">Appearance</span>
                    <span className="text-[12px] text-[var(--color-text-secondary)] ml-auto">{themeLabel}</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--color-divider)' }} />

                  {/* Sign Out */}
                  <button
                    role="menuitem"
                    onClick={() => { setShowSignOut(true); setMenuOpen(false) }}
                    className={`${menuItemBase} text-danger hover:bg-danger/10`}
                  >
                    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </header>

      <SignOutModal isOpen={showSignOut} onClose={() => setShowSignOut(false)} />
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onProfileUpdated={() => { refreshMemberData(); setShowEditProfile(false) }}
        onError={(err) => console.error('Profile update error:', err)}
        currentMember={member}
      />
      <DiscordLinkModal isOpen={showDiscordLink} onClose={() => setShowDiscordLink(false)} />
    </>
  )
}

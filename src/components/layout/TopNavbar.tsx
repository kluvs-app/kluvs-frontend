import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarUrl } from '../../supabase'
import ThemeToggle from '../ThemeToggle'
import SignOutModal from '../modals/SignOutModal'
import EditProfileModal from '../modals/EditProfileModal'
import type { Server } from '../../types'

interface TopNavbarProps {
  servers: Server[]
  selectedServer: string
  onServerChange: (serverId: string) => void
  onMenuToggle?: () => void
  isAdmin: boolean
}

export default function TopNavbar({ servers, selectedServer, onServerChange, onMenuToggle, isAdmin }: TopNavbarProps) {
  const { member, refreshMemberData } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[var(--color-bg)] border-b border-[var(--color-divider)] transition-colors">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Logo, Brand & Hamburger */}
          <div className="flex items-center gap-3">
            <img src="/ic-mark.svg" alt="Kluvs" className="h-8 w-8" />
            <h1 className="text-section-heading text-[var(--color-text-primary)]">
              Kluvs
            </h1>
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-btn text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: Server selector, Theme toggle, User */}
          <div className="flex items-center gap-3">
            {/* Server Selector (admin only, multiple servers) */}
            {servers.length > 1 && isAdmin && (
              <select
                value={selectedServer}
                onChange={(e) => onServerChange(e.target.value)}
                className="bg-[var(--color-input-bg)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-input text-sm border border-[var(--color-input-border)] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
              >
                {servers.map(server => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            )}

            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-btn text-sm hover:bg-[var(--color-bg-elevated)] transition-colors"
                aria-label="User menu"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="relative h-7 w-7">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {member?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  {member?.avatar_path && (
                    <img
                      src={getAvatarUrl(member.avatar_path)}
                      alt={member.name}
                      className="absolute inset-0 h-7 w-7 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </div>
                <span className="hidden sm:inline text-[var(--color-text-primary)] font-medium">
                  {member?.name || 'User'}
                </span>
                {isAdmin && (
                  <span className="hidden sm:inline px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                    Admin
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-[var(--color-bg-raised)] border border-[var(--color-divider)] rounded-card shadow-lg py-1" role="menu">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setShowEditProfileModal(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                      Edit Profile
                    </button>
                    <div className="border-t border-[var(--color-divider)] my-1" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setShowSignOutModal(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={() => {
          refreshMemberData()
          setShowEditProfileModal(false)
        }}
        onError={(error) => console.error('Profile update error:', error)}
        currentMember={member}
      />
    </>
  )
}

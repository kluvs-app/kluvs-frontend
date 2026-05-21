import { useState, useEffect } from 'react'
import { invokeFunction, getAvatarUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Club } from '../types'
import EditProfileModal from '../components/modals/EditProfileModal'

const MS = "0 -960 960 960"

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHive() {
  return (
    <svg className="w-5 h-5 shrink-0 text-primary" viewBox={MS} fill="currentColor">
      <path d="m661.17-504.52-68.56-121.7 68.56-121.13h134.57l69.13 121.13-69.13 121.7H661.17ZM412.43-358.3 343.87-480l68.56-121.7h135.7L616.7-480l-68.57 121.7h-135.7Zm0-291.87-68.56-121.7L412.43-893h135.14l68.56 121.13-68.56 121.7H412.43ZM164.26-504.52l-69.13-121.7 69.13-121.13h136.26l66.7 121.13-66.7 121.7H164.26Zm0 291.87L95.13-333.78l69.13-121.7h136.26l66.7 121.7-66.7 121.13H164.26ZM414.74-67l-70.87-121.13 68.56-121.7h135.14l68.56 121.7L547.57-67H414.74Zm246.43-145.65-68.56-121.13 68.56-121.7h134.57l69.13 121.7-69.13 121.13H661.17Z" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg className="w-5 h-5 shrink-0 text-primary" viewBox={MS} fill="currentColor">
      <path d="M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z" />
    </svg>
  )
}


// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { member, refreshMemberData } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

  useEffect(() => {
    if (!member?.clubs.length) { setLoading(false); return }

    Promise.all(
      member.clubs.map(c =>
        invokeFunction<Club>(
          `club?id=${encodeURIComponent(c.id)}&server_id=${encodeURIComponent(c.server_id)}`,
          { method: 'GET' }
        )
      )
    )
      .then(results => setClubs(results.flatMap(r => r.data ? [r.data] : [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [member])

  const memberSince = member?.created_at
    ? new Date(member.created_at).getFullYear()
    : null

  // Most proximal upcoming discussion across all clubs
  const nextDiscussion = clubs
    .flatMap(c =>
      (c.active_session?.discussions ?? []).map(d => ({ ...d, clubName: c.name }))
    )
    .filter(d => new Date(d.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null

  // Active readings across all clubs, with discussion progress
  const currentlyReading = clubs
    .filter(c => c.active_session)
    .map(c => {
      const session = c.active_session!
      const total = session.discussions.length
      const done = session.discussions.filter(d => new Date(d.date) <= new Date()).length
      return {
        book: session.book,
        clubName: c.name,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        done,
        total,
      }
    })

  return (
    <div className="px-6 py-6 divide-y divide-[var(--color-divider)]">
      {/* Profile */}
      <div className="pb-8">
        <h1 className="text-page-heading font-serif font-bold text-[var(--color-text-primary)] mb-6">Me</h1>
      <div className="flex items-center gap-5">
        {/* Avatar with edit button */}
        <div className="relative shrink-0">
          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
            {member?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          {member?.avatar_path && (
            <img
              src={getAvatarUrl(member.avatar_path)}
              alt={member.name}
              className="absolute inset-0 h-20 w-20 rounded-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary-hover transition-colors"
            aria-label="Edit profile"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>

        {/* Identity */}
        <div className="min-w-0">
          <p className="text-xl font-serif font-bold text-[var(--color-text-primary)] truncate">
            {member?.name ?? 'User'}
          </p>
          {member?.handle && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {member.handle.startsWith('@') ? member.handle : `@${member.handle}`}
            </p>
          )}
          {memberSince && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Member since {memberSince}</p>
          )}
        </div>
      </div>
      </div>

      {/* Your Statistics */}
      <section className="py-8">
        <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-5">
          Your Statistics
        </p>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <IconHive />
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Number of Clubs</p>
              <p className="text-base font-medium text-[var(--color-text-primary)]">{member?.clubs.length ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <IconBook />
            <div>
              <p className="text-xs text-[var(--color-text-secondary)]">Books Read</p>
              <p className="text-base font-medium text-[var(--color-text-primary)]">{member?.books_read ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Discussion */}
      <section className="py-8">
        {loading ? (
          <div className="h-20 bg-[var(--color-bg-elevated)] rounded-card animate-pulse" />
        ) : nextDiscussion ? (
          <div className="rounded-card border border-primary/40 bg-primary/[0.07] p-4 shadow-[inset_3px_0_0_#D16D30]">
            <p className="text-helper-sm font-medium uppercase tracking-wider text-primary mb-2">
              Next Discussion
            </p>
            <p className="font-medium text-[var(--color-text-primary)] leading-snug">
              {nextDiscussion.title}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5">
              {new Date(nextDiscussion.date).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {[nextDiscussion.clubName, nextDiscussion.location].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] italic">No upcoming discussions</p>
        )}
      </section>

      {/* Currently Reading */}
      <section className="py-8">
        <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-5">
          Currently Reading
        </p>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-10 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
            ))}
          </div>
        ) : currentlyReading.length > 0 ? (
          <div className="space-y-5">
            {currentlyReading.map(({ book, clubName, progress, done, total }, i) => (
              <div key={`${clubName}-${i}`}>
                <p className="font-serif italic text-[var(--color-text-primary)] text-base leading-snug">
                  {book.title}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{book.author}</p>
                {total > 0 && (
                  <div className="mt-3">
                    <div className="h-[3px] w-full bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                      {done}/{total} discussions · {progress}%
                    </p>
                  </div>
                )}
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{clubName}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] italic">No active reading sessions</p>
        )}
      </section>


      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={() => {
          refreshMemberData()
          setShowEditProfileModal(false)
        }}
        onError={() => {}}
        currentMember={member}
      />
    </div>
  )
}

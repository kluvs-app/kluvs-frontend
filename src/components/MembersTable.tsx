import { getAvatarUrl } from '../supabase'
import type { Club, Member } from '../types'

interface MembersTableProps {
  selectedClub: Club
  isAdmin: boolean
  onAddMember: () => void
  onEditMember: (member: Member) => void
  onDeleteMember: (member: Member) => void
}

export default function MembersTable({
  selectedClub,
  isAdmin,
  onAddMember,
  onEditMember,
  onDeleteMember
}: MembersTableProps) {
  return (
    <>
      {/* Section heading */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-section-heading text-[var(--color-text-primary)]">
          Members ({selectedClub.members.length})
        </h3>
        {isAdmin && (
          <button
            onClick={onAddMember}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            Add Member
          </button>
        )}
      </div>

      {/* Flat list */}
      <div className="overflow-y-auto max-h-96">
        {selectedClub.members.map(member => (
          <div
            key={member.id}
            className="flex items-center gap-4 py-3.5 border-b border-[var(--color-divider)] last:border-b-0 group"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-base">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {member.avatar_path && (
                <img
                  src={getAvatarUrl(member.avatar_path)}
                  alt={member.name}
                  className="absolute inset-0 h-11 w-11 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>

            {/* Name + handle */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--color-text-primary)] text-sm leading-tight">
                {member.name}
              </p>
              {(member.handle || member.discord_id) && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {(() => {
                    const raw = member.handle || member.discord_id || ''
                    return raw.startsWith('@') ? raw : `@${raw}`
                  })()}
                </p>
              )}
            </div>

            {/* Right side: pts + admin actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] font-medium tabular-nums">
                {member.books_read}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 -960 960 960" fill="currentColor">
                  <path d="M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z" />
                </svg>
              </span>

              {isAdmin && (
                <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditMember(member) }}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded transition-colors"
                    aria-label={`Edit ${member.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteMember(member) }}
                    className="text-danger hover:text-danger-hover p-1.5 rounded transition-colors"
                    aria-label={`Delete ${member.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

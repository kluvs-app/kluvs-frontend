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
    <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-divider)]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-section-heading text-[var(--color-text-primary)] flex items-center">
              <svg className="w-5 h-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.208V5.618a2 2 0 01.932-1.695l4.146-2.59A2 2 0 019.265 1h5.47a2 2 0 011.187.333l4.146 2.59A2 2 0 0121 5.618v1.757M15 19.128l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Club Members ({selectedClub.members.length})
            </h3>
            <p className="text-helper text-[var(--color-text-secondary)] mt-1">Reading community overview</p>
          </div>

          {/* Add Member Button */}
          {isAdmin && (
            <div className="hidden md:flex">
              <button
                onClick={onAddMember}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
              >
                Add Member
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-divider)] bg-[var(--color-bg-elevated)]">
              <th className="text-left py-3 px-6 text-helper text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Reader</th>
              <th className="text-center py-3 px-6 text-helper text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Books Read</th>
              <th className="text-left py-3 px-6 text-helper text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {selectedClub.members.map(member => (
              <tr key={member.id} className="border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-bg-elevated)] transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative h-9 w-9 mr-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {member.avatar_path && (
                          <img
                            src={getAvatarUrl(member.avatar_path)}
                            alt={member.name}
                            className="absolute inset-0 h-9 w-9 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                      </div>
                      <span className="text-[var(--color-text-primary)] font-medium">{member.name}</span>
                    </div>

                    {/* Edit/Delete buttons - appear on hover */}
                    {isAdmin && (
                      <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditMember(member)
                          }}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded transition-colors"
                          title="Edit member"
                          aria-label={`Edit ${member.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteMember(member)
                          }}
                          className="text-danger hover:text-danger-hover p-1.5 rounded transition-colors"
                          title="Delete member"
                          aria-label={`Delete ${member.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  <span className="text-[var(--color-text-primary)] font-medium">{member.books_read}</span>
                </td>
                <td className="py-4 px-6">
                  {selectedClub.shame_list.includes(member.id) ? (
                    <span className="bg-danger/10 text-danger px-3 py-1 rounded-full text-helper-sm font-semibold inline-flex items-center w-fit">
                      Shame List
                    </span>
                  ) : (
                    <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-helper-sm font-semibold inline-flex items-center w-fit">
                      Good Standing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

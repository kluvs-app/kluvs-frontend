import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { invokeFunction } from '../supabase'
import { isPast, parseLocalDate } from '../utils/dates'
import type { Club } from '../types'
import AddClubModal from '../components/modals/AddClubModal'
import BookCover from '../components/ui/BookCover'
import RoleEyebrow from '../components/ui/RoleEyebrow'
import Avatar from '../components/ui/Avatar'

interface ClubsPageProps {
  openNewModal?: boolean
}

export default function ClubsPage({ openNewModal = false }: ClubsPageProps) {
  const { member, refreshMemberData } = useAuth()
  const navigate = useNavigate()
  const [showAddClubModal, setShowAddClubModal] = useState(openNewModal)
  const [clubDetails, setClubDetails] = useState<Record<string, Club>>({})

  const clubs = member?.clubs ?? []

  // Fetch full club data for each club
  useEffect(() => {
    clubs.forEach((c) => {
      if (!clubDetails[c.id]) {
        invokeFunction<Club>(`club?id=${encodeURIComponent(c.id)}`, { method: 'GET' })
          .then(({ data }) => {
            if (data) setClubDetails((prev) => ({ ...prev, [c.id]: data }))
          })
          .catch(() => {})
      }
    })
  }, [clubs])

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      if (clubs.length === 0) return
      const lastClub = localStorage.getItem('kluvs:lastClub')
      const target =
        lastClub && clubs.some((c) => c.id === lastClub)
          ? lastClub
          : clubs[0]?.id
      if (target) navigate(`/clubs/${target}`, { replace: true })
    }
  }, [clubs, navigate])

  const handleClubCreated = () => {
    setShowAddClubModal(false)
    refreshMemberData()
  }

  // Zero state — shown on all screen sizes
  if (clubs.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-5 py-8 gap-8">
          <BookCover size="lg" title="Book cover placeholder" />
          <div className="text-center">
            <h2 className="font-serif italic text-[48px] font-medium text-[var(--color-text-primary)] mb-4">
              No clubs yet.
            </h2>
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-8 max-w-[280px] mx-auto leading-relaxed">
              Start a club to read alongside friends, or accept an invite to join one.
            </p>
            <button
              onClick={() => setShowAddClubModal(true)}
              className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-8 py-3 rounded-lg text-[15px] font-medium transition-all duration-120 cursor-pointer w-full max-w-[280px]"
            >
              Create your first club
            </button>
          </div>
        </div>
        <AddClubModal
          isOpen={showAddClubModal}
          onClose={() => setShowAddClubModal(false)}
          onClubCreated={handleClubCreated}
          onError={() => {}}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:hidden">
      {/* Mobile Header */}
      <div className="border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-5 py-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
            Your
          </span>
          <button
            onClick={() => setShowAddClubModal(true)}
            className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-120 cursor-pointer"
          >
            + New
          </button>
        </div>
        <h1 className="font-serif text-[48px] font-medium leading-[1] text-[var(--color-text-primary)] tracking-[-0.022em]">
          Clubs
        </h1>
      </div>

      {/* Mobile club list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[var(--color-divider)]">
          {clubs.map((club) => {
            const fullClub = clubDetails[club.id]
            return (
              <Link
                key={club.id}
                to={`/clubs/${club.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-divider)] hover:bg-[var(--color-bg-elevated)] active:bg-[var(--color-bg-elevated)] transition-colors"
              >
                {/* Cover */}
                <BookCover
                  imageUrl={fullClub?.active_session?.book?.image_url}
                  title={`${club.name} book cover`}
                  size="sm"
                />

                {/* Club info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Club name + role */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-serif text-[21px] font-medium text-[var(--color-text-primary)] truncate">
                      {club.name}
                    </h3>
                    <RoleEyebrow role={club.role} />
                  </div>

                  {/* Book title */}
                  {fullClub?.active_session?.book?.title && (
                    <p className="font-serif italic text-[16px] text-[var(--color-text-secondary)] mb-2 truncate">
                      {fullClub.active_session.book.title}
                    </p>
                  )}

                  {/* Member avatars + next date */}
                  <div className="flex items-center gap-2">
                    {fullClub?.members && fullClub.members.length > 0 && (
                      <div className="flex -space-x-2 items-center">
                        {fullClub.members.slice(0, 5).map((m) => (
                          <div key={m.id} className="border border-[var(--color-bg)] rounded-full">
                            <Avatar name={m.name} userId={String(m.id)} size="sm" isOwn={member?.id != null && m.id === member.id} />
                          </div>
                        ))}
                        {fullClub.members.length > 5 && (
                          <span className="text-[11px] text-[var(--color-text-secondary)] ml-1">
                            +{fullClub.members.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                    {fullClub?.active_session?.discussions && fullClub.active_session.discussions.length > 0 && (() => {
                      const next = fullClub.active_session.discussions.find((d) => !isPast(d.date, d.time))
                      if (!next || !next.date) return null
                      const parsedDate = parseLocalDate(next.date)
                      if (isNaN(parsedDate.getTime())) return null
                      return (
                        <span className="text-[12px] text-[var(--color-text-secondary)] font-medium uppercase tracking-[0.02em]">
                          Next · {parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                {/* Chevron */}
                <div className="text-[var(--color-text-secondary)] text-lg flex-shrink-0">›</div>
              </Link>
            )
          })}
        </div>
      </div>

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        onClubCreated={handleClubCreated}
        onError={() => {}}
      />
    </div>
  )
}

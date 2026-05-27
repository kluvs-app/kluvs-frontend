import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { invokeFunction } from '../supabase'
import { isPast, parseLocalDate } from '../utils/dates'
import type { Club } from '../types'
import AddClubModal from '../components/modals/AddClubModal'
import CoverSlot from '../components/ui/CoverSlot'
import RoleEyebrow from '../components/ui/RoleEyebrow'

interface ClubsPageProps {
  openNewModal?: boolean
}

const AVATAR_HUES = [
  '#5865F2',
  '#5BAA5C',
  '#9B59B6',
  '#E67E22',
  '#3498DB',
  '#E74C3C',
  '#16A085',
  '#F39C12',
  '#8E44AD',
  '#2ECC71',
]

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
        invokeFunction<Club>(`club?id=${encodeURIComponent(c.id)}`, {
          method: 'GET',
        })
          .then(({ data }) => {
            if (data) {
              setClubDetails((prev) => ({ ...prev, [c.id]: data }))
            }
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
      if (target) {
        navigate(`/clubs/${target}`, { replace: true })
      }
    }
  }, [clubs, navigate])


  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:hidden">
      {/* Mobile Header */}
      <div className="border-b border-[var(--color-divider)] bg-[var(--color-bg)] px-5 py-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
            Yours
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

      {/* Club list or empty state */}
      {clubs.length === 0 ? (
        // Mobile zero clubs state
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-8">
          <div>
            <CoverSlot
              width={120}
              height={140}
              alt="Book cover placeholder"
            />
          </div>
          <div className="text-center">
            <h2 className="font-serif italic text-[48px] font-medium text-[var(--color-text-primary)] mb-4">
              No clubs yet.
            </h2>
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-8 max-w-[280px] mx-auto leading-relaxed">
              Start a club to read alongside friends, or accept an invite to join one.
            </p>
            <button
              onClick={() => setShowAddClubModal(true)}
              className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-8 py-3 rounded-lg text-[15px] font-medium transition-all duration-120 cursor-pointer w-full"
            >
              Create your first club
            </button>
          </div>
        </div>
      ) : (
        // Mobile club list
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-[var(--color-divider)]">
            {clubs.map((club) => {
              const fullClub = clubDetails[club.id]
              return (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(242,237,229,0.08)] hover:bg-[rgba(242,237,229,0.04)] active:bg-[rgba(242,237,229,0.08)] transition-colors"
                >
                  {/* Cover */}
                  <CoverSlot
                    width={56}
                    height={72}
                    alt={`${club.name} book cover`}
                  />

                  {/* Club info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Club name + role on same line */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-serif text-[19px] font-medium text-[var(--color-text-primary)] truncate">
                        {club.name}
                      </h3>
                      <RoleEyebrow role={club.role} />
                    </div>

                    {/* Book title in Garamond italic */}
                    {fullClub?.active_session?.book?.title && (
                      <p className="font-serif italic text-[14px] text-[var(--color-text-secondary)] mb-2 truncate">
                        {fullClub.active_session.book.title}
                      </p>
                    )}

                    {/* Member avatars + next date inline */}
                    <div className="flex items-center gap-2">
                      {fullClub?.members && fullClub.members.length > 0 && (
                        <div className="flex -space-x-2 items-center">
                          {fullClub.members.slice(0, 5).map((m) => (
                            <div
                              key={m.id}
                              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-medium border border-[var(--color-bg)]"
                              style={{
                                backgroundColor:
                                  AVATAR_HUES[
                                    Math.abs(Number(m.id)) % AVATAR_HUES.length
                                  ],
                              }}
                              title={m.name}
                            >
                              {m.name[0].toUpperCase()}
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
                        const nextDiscussion = fullClub.active_session.discussions.find((d) => !isPast(d.date, d.time))
                        return nextDiscussion ? (
                          <span className="text-[12px] text-[var(--color-text-secondary)] font-medium uppercase tracking-[0.02em]">
                            Next · {parseLocalDate(nextDiscussion.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="text-[var(--color-text-secondary)] text-lg flex-shrink-0">
                    ›
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        onClubCreated={() => {
          setShowAddClubModal(false)
          refreshMemberData()
        }}
        onError={() => {}}
      />
    </div>
  )
}

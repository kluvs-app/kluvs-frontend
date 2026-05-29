import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { invokeFunction } from '../supabase'
import type { Club, Discussion, Member } from '../types'
import EditBookModal from '../components/modals/EditBookModal'
import NewSessionModal from '../components/modals/NewSessionModal'
import DiscussionModal from '../components/modals/DiscussionModal'
import MemberModal from '../components/modals/MemberModal'
import AddMemberModal from '../components/modals/AddMemberModal'
import DeleteMemberModal from '../components/modals/DeleteMemberModal'
import DeleteDiscussionModal from '../components/modals/DeleteDiscussionModal'
import DeleteClubModal from '../components/modals/DeleteClubModal'
import EditClubModal from '../components/modals/EditClubModal'
import AddClubModal from '../components/modals/AddClubModal'
import ShareClubModal from '../components/modals/ShareClubModal'
import { useAuth } from '../contexts/AuthContext'
import { parseLocalDate, isPast } from '../utils/dates'
import KluvsSpinner from '../components/KluvsSpinner'
import BookCover from '../components/ui/BookCover'
import RoleEyebrow from '../components/ui/RoleEyebrow'
import GhostButton from '../components/ui/GhostButton'
import KebabMenu from '../components/ui/KebabMenu'
import Avatar from '../components/ui/Avatar'

type MobileTab = 'overview' | 'discussions' | 'members'

function DiscordIndicator({ club, isAdmin }: { club: Club; isAdmin: boolean }) {
  const hasDiscord = !!club.discord_channel
  if (!hasDiscord && !isAdmin) return null
  return (
    <div className="relative group">
      <div className="flex items-center justify-center w-[26px] h-[26px] rounded-full cursor-default transition-colors hover:bg-[rgba(88,101,242,0.1)]">
        <img
          src="/ic-discord.svg"
          alt="Discord"
          className="w-[15px] h-[15px]"
          style={{ opacity: hasDiscord ? 0.6 : 0.25 }}
        />
      </div>
      <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-[120ms] z-50">
        <div
          className="rounded-lg px-3 py-2.5 text-left whitespace-nowrap"
          style={{ background: '#1A140F', border: '1px solid rgba(242,237,229,0.12)' }}
        >
          {hasDiscord ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: '#5865F2' }}>Discord</p>
              {club.server_id && (
                <div className="flex items-baseline justify-between gap-5">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Server</span>
                  <span className="text-[11px] font-mono text-[var(--color-text-primary)]">{club.server_id}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Channel</span>
                <span className="text-[11px] font-mono text-[var(--color-text-primary)]">{club.discord_channel}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[var(--color-text-secondary)]">Not connected to Discord</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { member, getRoleForClub, refreshMemberData } = useAuth()

  const memberClub = member?.clubs.find((c) => c.id === slug)
  const serverId = memberClub?.server_id ?? ''

  const [club, setClub] = useState<Club | null>(null)
  const [sidebarClubs, setSidebarClubs] = useState<Record<string, Club>>({})

  const [loading, setLoading] = useState(true)
  const [clubLoading, setClubLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('overview')
  const [idCopied, setIdCopied] = useState(false)

  const clubRole = club ? getRoleForClub(club.id) : null
  const isAdmin = clubRole === 'admin' || clubRole === 'owner'

  // Modal state
  const [showEditBookModal, setShowEditBookModal] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [showAddDiscussionModal, setShowAddDiscussionModal] = useState(false)
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null)
  const [showDeleteDiscussionModal, setShowDeleteDiscussionModal] = useState(false)
  const [discussionToDelete, setDiscussionToDelete] = useState<Discussion | null>(null)
  const [showEditClubModal, setShowEditClubModal] = useState(false)
  const [showDeleteClubModal, setShowDeleteClubModal] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<{ id: string; name: string } | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [showAddClubModal, setShowAddClubModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Track which club IDs have been fetched for the sidebar to avoid duplicate requests
  const sidebarFetchedRef = useRef(new Set<string>())

  // Sync the active club into the sidebar map whenever it changes
  useEffect(() => {
    if (club) setSidebarClubs(prev => ({ ...prev, [club.id]: club }))
  }, [club])

  // Pre-fetch all other clubs so the sidebar is always fully populated
  useEffect(() => {
    const clubs = member?.clubs ?? []
    for (const c of clubs) {
      if (sidebarFetchedRef.current.has(c.id)) continue
      sidebarFetchedRef.current.add(c.id)
      invokeFunction<Club>(`club?id=${encodeURIComponent(c.id)}`, { method: 'GET' })
        .then(({ data }) => {
          if (data) setSidebarClubs(prev => ({ ...prev, [c.id]: data }))
        })
        .catch(() => {})
    }
  }, [member?.clubs])

  // Persist last-visited club slug
  useEffect(() => {
    if (slug) localStorage.setItem('kluvs:lastClub', slug)
  }, [slug])

  // Redirect if this club isn't in the member's list
  useEffect(() => {
    if (member && !memberClub) navigate('/clubs', { replace: true })
  }, [member, memberClub, navigate])

  // Warm up edge functions
  useEffect(() => {
    invokeFunction('session', { method: 'GET' }).catch(() => {})
    invokeFunction('book', { method: 'GET' }).catch(() => {})
  }, [])

  // Fetch club details whenever slug changes
  useEffect(() => {
    if (!slug) return
    fetchClub(slug)
  }, [slug, serverId])

  const fetchClub = async (clubId: string) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: err } = await invokeFunction<Club>(
        `club?id=${encodeURIComponent(clubId)}`,
        { method: 'GET' }
      )
      if (err) throw err
      setClub(data)
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to fetch club details'
      )
    } finally {
      setLoading(false)
    }
  }

  const refreshClub = async () => {
    if (!slug) return
    try {
      setClubLoading(true)
      const { data, error: err } = await invokeFunction<Club>(
        `club?id=${encodeURIComponent(slug)}`,
        { method: 'GET' }
      )
      if (err) throw err
      setClub(data)
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to refresh club details'
      )
    } finally {
      setClubLoading(false)
    }
  }

  // Handlers
  const handleAddDiscussion = () => {
    setEditingDiscussion(null)
    setShowAddDiscussionModal(true)
  }
  const handleEditDiscussion = (d: Discussion) => {
    setEditingDiscussion(d)
    setShowAddDiscussionModal(true)
  }
  const handleDeleteDiscussion = (d: Discussion) => {
    setDiscussionToDelete(d)
    setShowDeleteDiscussionModal(true)
  }
  const handleAddMember = () => {
    setShowAddMemberModal(true)
  }
  const handleEditMember = (m: Member) => {
    setEditingMember(m)
    setShowMemberModal(true)
  }
  const handleDeleteMember = (m: Member) => {
    setMemberToDelete(m)
    setShowDeleteMemberModal(true)
  }

  const getDiscussionStatus = (discussion: Discussion) => {
    if (isPast(discussion.date, discussion.time)) return 'past'
    // Find the first non-past discussion (the "next" one)
    if (club?.active_session?.discussions) {
      const nextIdx = club.active_session.discussions.findIndex(
        (d) => !isPast(d.date, d.time)
      )
      const isNext = nextIdx >= 0 && club.active_session.discussions[nextIdx]?.id === discussion.id
      return isNext ? 'next' : 'upcoming'
    }
    return 'upcoming'
  }

  const getSessionProgress = () => {
    if (!club?.active_session?.discussions) return { completed: 0, total: 0 }
    const total = club.active_session.discussions.length
    const completed = club.active_session.discussions.filter((d) =>
      isPast(d.date, d.time)
    ).length
    return { completed, total }
  }

  const getSessionStartDate = () => {
    if (!club?.active_session?.discussions) return null
    const firstDiscussion = club.active_session.discussions[0]
    if (firstDiscussion) return parseLocalDate(firstDiscussion.date)
    return null
  }

  const getProgressPercent = () => {
    const { completed, total } = getSessionProgress()
    return total === 0 ? 0 : Math.round((completed / total) * 100)
  }

  const getSortedMembers = (members: Member[]) => {
    const roleOrder = { 'owner': 0, 'admin': 1, 'member': 2 }
    return [...members].sort((a, b) => {
      const aRole = (a as typeof a & { role?: string }).role || 'member'
      const bRole = (b as typeof b & { role?: string }).role || 'member'
      return (roleOrder[aRole as keyof typeof roleOrder] ?? 2) - (roleOrder[bRole as keyof typeof roleOrder] ?? 2)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <KluvsSpinner size={64} className="mx-auto" />
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">
            Loading club…
          </p>
        </div>
      </div>
    )
  }

  if (!club) {
    return error ? (
      <main className="px-6 py-6">
        <div className="bg-danger/10 border border-danger/30 rounded-card p-4">
          <p className="text-danger font-medium">{error}</p>
        </div>
      </main>
    ) : null
  }

  const clubs = member?.clubs ?? []

  return (
    <>
      {/* Desktop split-view: lg+ only */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr] h-screen bg-[var(--color-bg)] overflow-hidden">
        {/* Left rail */}
        <div className="border-r border-[var(--color-divider)] overflow-y-auto bg-[var(--color-bg)]">
          {/* Rail header */}
          <div className="border-b border-[var(--color-divider)] px-6 py-[18px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                YOUR CLUBS
              </span>
              <button
                onClick={() => setShowAddClubModal(true)}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-120 hover:bg-[rgba(242,237,229,0.06)] text-[var(--color-text-secondary)] text-[20px] font-light leading-none"
                title="Add club"
              >
                +
              </button>
            </div>
          </div>

          {/* Club rows */}
          <div className="divide-y divide-[var(--color-divider)]">
            {clubs.map((c) => {
              const isActive = c.id === club.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    navigate(`/clubs/${c.id}`, { replace: true })
                  }}
                  className={[
                    'w-full text-left px-6 py-3.5 border-l-[3px] transition-colors duration-120 relative',
                    isActive
                      ? 'border-l-primary bg-[rgba(209,109,48,0.06)]'
                      : 'border-l-transparent hover:bg-[rgba(242,237,229,0.03)]',
                  ].join(' ')}
                >
                  {/* Club name + role */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-serif text-[19px] font-medium text-[var(--color-text-primary)] truncate">
                      {c.name}
                    </p>
                    <RoleEyebrow role={c.role} />
                  </div>

                  {/* Book reading */}
                  {sidebarClubs[c.id]?.active_session?.book?.title && (
                    <p className="text-[13px] italic text-[var(--color-text-secondary)] truncate mb-2">
                      {sidebarClubs[c.id].active_session!.book!.title}
                    </p>
                  )}

                  {/* Members + next date */}
                  {sidebarClubs[c.id]?.members ? (
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] uppercase tracking-[0.04em]">
                      <div>{sidebarClubs[c.id].members.length} MEMBERS</div>
                      {sidebarClubs[c.id].active_session?.discussions && sidebarClubs[c.id].active_session!.discussions!.length > 0 && (
                        <div>
                          NEXT · {parseLocalDate(
                            sidebarClubs[c.id].active_session!.discussions!.find((d) => !isPast(d.date, d.time))
                              ?.date || ''
                          ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[var(--color-text-secondary)]">—</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right detail pane */}
        <div className="overflow-y-auto flex flex-col">
          {/* Detail content */}
          <div className="flex-1">
            {clubLoading ? (
              <div className="py-12 text-center">
                <KluvsSpinner size={48} className="mx-auto" />
              </div>
            ) : (
              <div className="px-14 pt-10 pb-16 max-w-[1080px]">
                {/* Masthead */}
                <div className="mb-10 pb-8 border-b border-[var(--color-divider)]">
                  {/* Util row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                      CLUB
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <GhostButton
                          variant="md"
                          onClick={() => setShowShareModal(true)}
                        >
                          Share
                        </GhostButton>
                        <GhostButton
                          variant="md"
                          onClick={() => setShowEditClubModal(true)}
                        >
                          Edit club
                        </GhostButton>
                      </div>
                    )}
                  </div>

                  {/* Club name */}
                  <h1 className="font-serif text-[64px] font-medium leading-[1] text-[var(--color-text-primary)] mb-3 tracking-[-0.022em]">
                    {club.name}
                  </h1>

                  {/* Meta row */}
                  <div className="flex items-center gap-3.5 flex-wrap mb-3">
                    <RoleEyebrow role={clubRole || 'member'} />
                    <span className="inline-block w-1 h-1 rounded-full bg-[#332B24]" />
                    {club.founded_date && (
                      <>
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                          FOUNDED {parseLocalDate(club.founded_date).getFullYear()}
                        </span>
                        <span className="inline-block w-1 h-1 rounded-full bg-[#332B24]" />
                      </>
                    )}
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                      {club.members.length} MEMBERS
                    </span>
                  </div>

                  {/* Utility row — admin only */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(club.id)
                          setIdCopied(true)
                          setTimeout(() => setIdCopied(false), 1500)
                        }}
                        className="transition-all duration-[120ms]"
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: `1px solid ${idCopied ? '#48A480' : 'rgba(242,237,229,0.14)'}`,
                          color: idCopied ? '#48A480' : 'var(--color-text-secondary)',
                          background: 'transparent',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.04em',
                        }}
                        title="Copy Club ID"
                      >
                        {idCopied ? 'Copied!' : 'Copy Club ID'}
                      </button>
                      <DiscordIndicator club={club} isAdmin={isAdmin} />
                    </div>
                  )}
                </div>

                {/* Current session */}
                <div className="mb-12">
                  {/* Book / session area */}
                  {club.active_session ? (
                    <div className="grid grid-cols-[128px_1fr] gap-9 mb-12 pb-12 border-b border-[var(--color-divider)]">
                      <BookCover
                        imageUrl={club.active_session.book?.image_url}
                        title={club.active_session.book?.title || 'Book cover'}
                        size="lg"
                      />

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-3.5">
                          NOW READING
                        </p>
                        <h2 className="font-serif italic text-[52px] font-medium leading-[1.05] text-[var(--color-text-primary)] mb-2 tracking-[-0.015em]">
                          {club.active_session.book?.title || '(Untitled)'}
                        </h2>
                        <p className="text-[16px] text-[var(--color-text-secondary)] mb-4">
                          {club.active_session.book?.author}
                        </p>

                        {/* Progress bar */}
                        <div className="flex items-center gap-4 max-w-[420px] mb-3">
                          <div className="flex-1 h-1 rounded-full bg-[#332B24] overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{
                                width: `${getProgressPercent()}%`,
                              }}
                            />
                          </div>
                          <span className="text-[13px] text-[var(--color-text-secondary)] font-mono">
                            {getSessionProgress().completed} of {getSessionProgress().total}
                          </span>
                        </div>

                        <p className="text-[12px] text-[var(--color-text-secondary)]">
                          {getProgressPercent()}% through this session · started{' '}
                          {getSessionStartDate()?.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center mb-12 pb-12 border-b border-[var(--color-divider)]">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-3">
                        GETTING STARTED
                      </p>
                      <h2 className="font-serif italic text-[48px] font-medium leading-[1.1] tracking-[-0.015em] text-[var(--color-text-primary)] mb-3">
                        Start reading together.
                      </h2>
                      <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-[360px]">
                        Pick a book and kick off your club's first session.
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => setShowNewSessionModal(true)}
                          className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-6 py-2.5 rounded-btn text-[14px] font-medium transition-all duration-120 cursor-pointer"
                        >
                          Start Session
                        </button>
                      )}
                    </div>
                  )}

                  {/* Discussions + Members: two-column layout */}
                  <div className="grid grid-cols-[1.4fr_1fr] gap-14">
                    {/* Discussions section */}
                    <div>
                      <div className="flex items-center justify-between mb-9">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                            DISCUSSIONS
                          </span>
                          {club.active_session && club.active_session.discussions.length > 0 && (
                            <span className="font-serif italic text-[16px] text-[var(--color-text-secondary)]">
                              {club.active_session.discussions.length} scheduled
                            </span>
                          )}
                        </div>
                        {isAdmin && club.active_session && (
                          <GhostButton
                            variant="sm"
                            icon="+"
                            onClick={handleAddDiscussion}
                          >
                            Add
                          </GhostButton>
                        )}
                      </div>

                      {!club.active_session ? (
                        <div className="py-6 flex flex-col items-center text-center">
                          <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug">
                            {isAdmin
                              ? 'Start a session above to schedule discussions.'
                              : 'Discussions will appear here once a session begins.'}
                          </p>
                        </div>
                      ) : club.active_session.discussions.length === 0 ? (
                        <div className="py-6 flex flex-col items-center text-center">
                          <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug mb-5">
                            No discussions scheduled yet.
                          </p>
                          {isAdmin && (
                            <button
                              onClick={handleAddDiscussion}
                              className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
                            >
                              Schedule Discussion
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-7">
                          {club.active_session?.discussions.map((discussion, idx) => {
                            const status = getDiscussionStatus(discussion)
                            const isLast = idx === (club.active_session?.discussions.length ?? 0) - 1

                            return (
                              <div
                                key={discussion.id}
                                className={[
                                  'grid grid-cols-[76px_24px_1fr] gap-6',
                                  status === 'past' && 'opacity-72',
                                ].join(' ')}
                              >
                                {/* Date column */}
                                <div className="text-right pr-3.5">
                                  <p
                                    className={[
                                      'text-[12px] font-medium font-mono tracking-[0.02em]',
                                      status === 'past'
                                        ? 'text-[var(--color-text-secondary)]'
                                        : status === 'next'
                                          ? 'text-primary'
                                          : 'text-[var(--color-text-secondary)]',
                                    ].join(' ')}
                                  >
                                    {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 opacity-80">
                                    {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                    })}
                                  </p>
                                </div>

                                {/* Rail column */}
                                <div className="relative flex justify-center">
                                  {/* Dot */}
                                  <div className="relative z-10 mt-1">
                                    {status === 'past' && (
                                      <div className="w-2 h-2 rounded-full bg-[#4D4033]" />
                                    )}
                                    {status === 'next' && (
                                      <div
                                        className="w-3.5 h-3.5 rounded-full bg-primary"
                                        style={{
                                          boxShadow: '0 0 0 5px rgba(209,109,48,0.10)',
                                        }}
                                      />
                                    )}
                                    {status === 'upcoming' && (
                                      <div className="w-2 h-2 rounded-full bg-[var(--color-bg)] border-[1.5px] border-[#4D4033]" />
                                    )}
                                  </div>

                                  {/* Rail line */}
                                  {!isLast && (
                                    <div
                                      className="absolute top-[12px] bottom-[-28px] left-[50%] w-px bg-[rgba(242,237,229,0.14)] transform -translate-x-1/2"
                                      style={{
                                        height: 'calc(100% + 28px)',
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Content column */}
                                <div className="flex items-start justify-between gap-4 pt-0.5">
                                  <div>
                                    {status === 'next' && (
                                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-1">
                                        UP NEXT
                                      </p>
                                    )}
                                    <p className="font-serif text-[24px] font-medium leading-[1.2] text-[var(--color-text-primary)] tracking-[-0.005em]">
                                      {discussion.title}
                                    </p>
                                    {discussion.location && (
                                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                                        {discussion.location}
                                      </p>
                                    )}
                                  </div>

                                  {isAdmin && (
                                    <KebabMenu
                                      items={[
                                        {
                                          label: 'Edit',
                                          onClick: () => handleEditDiscussion(discussion),
                                        },
                                        {
                                          label: 'Delete',
                                          danger: true,
                                          onClick: () => handleDeleteDiscussion(discussion),
                                        },
                                      ]}
                                    />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Members section (right column of grid) */}
                    <div>
                      <div className="flex items-center justify-between mb-9">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                            MEMBERS
                          </span>
                          <span className="font-serif italic text-[16px] text-[var(--color-text-secondary)]">
                            {club.members.length}
                          </span>
                        </div>
                        {isAdmin && (
                          <GhostButton
                            variant="sm"
                            icon="+"
                            onClick={handleAddMember}
                          >
                            Invite
                          </GhostButton>
                        )}
                      </div>

                      {/* Members list */}
                      <div className="space-y-2.5">
                        {getSortedMembers(club.members).map((clubMember) => {
                          const memberWithRole = clubMember as Member & { role?: string }
                          const memberRole = memberWithRole.role || 'member'
                          const isOwn = member?.id != null && member.id === clubMember.id

                          return (
                            <div
                              key={clubMember.id}
                              className="flex items-center gap-3.5 py-2.5 border-b border-[var(--color-divider)]"
                            >
                              {/* Avatar */}
                              <Avatar
                                name={clubMember.name}
                                userId={String(clubMember.id)}
                                size="lg"
                                isOwn={isOwn}
                              />

                              {/* Name + handle */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                                    {clubMember.name}
                                  </p>
                                  {isOwn && (
                                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                                  @{clubMember.handle || clubMember.discord_id || 'unknown'}
                                </p>
                              </div>

                              {/* Role + kebab */}
                              <div className="flex items-center gap-3">
                                <RoleEyebrow
                                  role={memberRole as 'owner' | 'admin' | 'member'}
                                />
                                {isAdmin && !isOwn && memberRole !== 'owner' && (
                                  <KebabMenu
                                    items={[
                                      {
                                        label: 'Edit role',
                                        onClick: () => handleEditMember(clubMember),
                                      },
                                      {
                                        label: 'Remove',
                                        danger: true,
                                        onClick: () => handleDeleteMember(clubMember),
                                      },
                                    ]}
                                  />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Invite CTA when flying solo */}
                      {club.members.length <= 1 && isAdmin && (
                        <div className="mt-5 flex flex-col items-center text-center py-4">
                          <p className="font-serif italic text-[20px] font-medium text-[var(--color-text-secondary)] leading-snug mb-4">
                            Invite others to get the conversation going.
                          </p>
                          <button
                            onClick={handleAddMember}
                            className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
                          >
                            Invite Members
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile layout: < lg */}
      <div className="lg:hidden min-h-screen bg-[var(--color-bg)] flex flex-col">
        {/* Mobile header with back, title, edit, kebab */}
        <div className="px-5 py-3 border-b border-[var(--color-divider)] flex items-center justify-between gap-3">
          <Link
            to="/clubs"
            className="text-[var(--color-text-secondary)] text-[16px] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ← Clubs
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <GhostButton
                  variant="sm"
                  onClick={() => setShowShareModal(true)}
                >
                  Share
                </GhostButton>
                <GhostButton
                  variant="sm"
                  onClick={() => setShowEditClubModal(true)}
                >
                  Edit club
                </GhostButton>
              </>
            )}
            <KebabMenu
              items={[
                {
                  label: 'Edit club',
                  onClick: () => setShowEditClubModal(true),
                },
                {
                  label: 'Delete club',
                  danger: true,
                  onClick: () => {
                    setClubToDelete({ id: club.id, name: club.name })
                    setShowDeleteClubModal(true)
                  },
                },
              ]}
            />
          </div>
        </div>

        {/* Masthead */}
        <div className="px-5 py-6 border-b border-[var(--color-divider)]">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] block mb-2">
            CLUB
          </span>
          <h1 className="font-serif text-[40px] font-medium leading-[1] text-[var(--color-text-primary)] mb-4 tracking-[-0.022em]">
            {club.name}
          </h1>
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <RoleEyebrow role={clubRole || 'member'} />
            {club.founded_date && (
              <>
                <span className="inline-block w-1 h-1 rounded-full bg-[#332B24]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  FOUNDED {parseLocalDate(club.founded_date).getFullYear()}
                </span>
              </>
            )}
            <span className="inline-block w-1 h-1 rounded-full bg-[#332B24]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              {club.members.length} MEMBERS
            </span>
          </div>

          {/* Utility row — admin only */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <DiscordIndicator club={club} isAdmin={isAdmin} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(club.id)
                  setIdCopied(true)
                  setTimeout(() => setIdCopied(false), 1500)
                }}
                className="transition-all duration-[120ms]"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: `1px solid ${idCopied ? '#48A480' : 'rgba(242,237,229,0.14)'}`,
                  color: idCopied ? '#48A480' : 'var(--color-text-secondary)',
                  background: 'transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.04em',
                }}
                title="Copy Club ID"
              >
                {idCopied ? 'Copied!' : 'Copy Club ID'}
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="sticky top-0 z-20 border-b border-[var(--color-divider)] bg-[var(--color-bg)] flex">
          {(['overview', 'discussions', 'members'] as const).map((tab) => {
            const isActive = mobileTab === tab
            const tabCounts = {
              overview: 0,
              discussions: club.active_session?.discussions.length || 0,
              members: club.members.length,
            }
            return (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={[
                  'flex-1 px-4 py-3.5 text-[13px] font-medium relative transition-colors duration-120',
                  isActive
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)]',
                ].join(' ')}
              >
                <span className="capitalize">{tab}</span>
                {tabCounts[tab] > 0 && (
                  <span
                    className={[
                      'ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block',
                      isActive
                        ? 'bg-[rgba(209,109,48,0.10)] text-primary'
                        : 'bg-transparent border border-[var(--color-divider)] text-[var(--color-text-secondary)]',
                    ].join(' ')}
                  >
                    {tabCounts[tab]}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-12">
          {clubLoading ? (
            <div className="flex items-center justify-center py-12">
              <KluvsSpinner size={48} className="mx-auto" />
            </div>
          ) : mobileTab === 'overview' ? (
            <div className="space-y-6">
              {/* NOW READING */}
              {!club.active_session && (
                <div className="flex flex-col items-center text-center py-4 pb-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] mb-2">
                    NO SESSION YET
                  </p>
                  <p className="font-serif italic text-[28px] font-medium text-[var(--color-text-primary)] leading-snug mb-4">
                    Start reading together.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-6 py-2.5 rounded-btn text-[14px] font-medium transition-all duration-120 cursor-pointer"
                    >
                      Start Session
                    </button>
                  )}
                </div>
              )}
              {club.active_session && (
              <div className="grid grid-cols-[80px_1fr] gap-5 items-center">
                <BookCover
                  imageUrl={club.active_session.book?.image_url}
                  title={club.active_session.book?.title || 'Book cover'}
                  size="md"
                />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-2">
                    NOW READING
                  </p>
                  <h3 className="font-serif italic text-[28px] font-medium leading-[1.05] text-[var(--color-text-primary)] mb-0.5">
                    {club.active_session.book?.title || '(Untitled)'}
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mb-2">
                    {club.active_session.book?.author}
                  </p>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex-1 h-1 rounded-full bg-[#332B24] overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${getProgressPercent()}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-mono whitespace-nowrap ml-2">
                      {getSessionProgress().completed} of {getSessionProgress().total}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {getProgressPercent()}% through · started{' '}
                    {getSessionStartDate()?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              )}

              {/* UP NEXT */}
              {club.active_session?.discussions && club.active_session.discussions.length > 0 && (
                <div className="border-t border-b border-[var(--color-divider)] py-4">
                  <div className="flex items-baseline justify-between mb-2 gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                      UP NEXT
                    </p>
                    {(() => {
                      const nextDiscussion = club.active_session.discussions.find(
                        (d) => !isPast(d.date, d.time)
                      )
                      return nextDiscussion ? (
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                          {parseLocalDate(nextDiscussion.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          }).toUpperCase()}
                        </p>
                      ) : null
                    })()}
                  </div>
                  {(() => {
                    const nextDiscussion = club.active_session.discussions.find(
                      (d) => !isPast(d.date, d.time)
                    )
                    return nextDiscussion ? (
                      <div>
                        <p className="font-serif text-[20px] font-medium text-[var(--color-text-primary)] mb-1">
                          {nextDiscussion.title}
                        </p>
                        {nextDiscussion.location && (
                          <p className="text-[12px] text-[var(--color-text-secondary)]">
                            {nextDiscussion.location}
                          </p>
                        )}
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* THE ROSTER */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                    THE ROSTER
                  </p>
                  <button
                    onClick={() => setMobileTab('members')}
                    className="text-[12px] text-primary font-medium"
                  >
                    See all {club.members.length}
                  </button>
                </div>

                {/* Avatars + names text on same row */}
                <div className="flex items-center gap-3 mb-2.5">
                  {/* Avatar row */}
                  <div className="flex -space-x-2 items-center flex-shrink-0">
                    {club.members.slice(0, 4).map((m) => (
                      <div key={m.id} className="border-2 border-[var(--color-bg)] rounded-full">
                        <Avatar
                          name={m.name}
                          userId={String(m.id)}
                          size="md"
                          isOwn={member?.id != null && m.id === member.id}
                        />
                      </div>
                    ))}
                    {club.members.length > 4 && (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-medium bg-[#4D4033] border-2 border-[var(--color-bg)]">
                        +{club.members.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Names text */}
                  <p className="text-[15px] text-[var(--color-text-primary)] font-medium">
                    {(() => {
                      const displayCount = Math.min(3, club.members.length)
                      const displayed = club.members.slice(0, displayCount)
                      const remaining = club.members.length - displayCount
                      const displayedNames = displayed.map((m) => m.name.split(' ')[0]).join(', ')
                      return remaining > 0 ? `${displayedNames} & ${remaining} more` : displayedNames
                    })()}
                  </p>
                </div>

                {/* Role breakdown */}
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  {(() => {
                    const owners = club.members.filter((m) => {
                      const memberWithRole = m as typeof m & { role?: string }
                      return memberWithRole.role === 'owner'
                    }).length
                    const admins = club.members.filter((m) => {
                      const memberWithRole = m as typeof m & { role?: string }
                      return memberWithRole.role === 'admin'
                    }).length
                    const parts = []
                    if (owners > 0) parts.push(`${owners} owner${owners > 1 ? 's' : ''}`)
                    if (admins > 0) parts.push(`${admins} admin${admins > 1 ? 's' : ''}`)
                    parts.push(`${club.members.length} member${club.members.length > 1 ? 's' : ''}`)
                    return parts.join(' · ')
                  })()}
                </p>
              </div>
            </div>
          ) : mobileTab === 'discussions' ? (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="font-serif italic text-[16px] text-[var(--color-text-secondary)]">
                  {club.active_session
                    ? `${club.active_session.discussions.length} scheduled`
                    : 'Discussions'}
                </p>
                {isAdmin && club.active_session && (
                  <button
                    onClick={handleAddDiscussion}
                    className="border border-[var(--color-divider)] text-[var(--color-text-primary)] text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-[rgba(242,237,229,0.04)] transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>

              {!club.active_session ? (
                <div className="flex flex-col items-center text-center py-6">
                  <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug mb-4">
                    {isAdmin
                      ? 'Start a session first to schedule discussions.'
                      : 'Discussions will appear here once a session begins.'}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
                    >
                      Start Session
                    </button>
                  )}
                </div>
              ) : club.active_session.discussions.length === 0 ? (
                <div className="flex flex-col items-center text-center py-6">
                  <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug mb-4">
                    No discussions scheduled yet.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={handleAddDiscussion}
                      className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
                    >
                      Schedule Discussion
                    </button>
                  )}
                </div>
              ) : null}

              {/* Timeline */}
              <div className="space-y-5">
                {club.active_session?.discussions.map((discussion, idx) => {
                  const status = getDiscussionStatus(discussion)
                  const isLast = idx === (club.active_session?.discussions.length ?? 1) - 1

                  return (
                    <div
                      key={discussion.id}
                      className={[
                        'grid grid-cols-[54px_16px_1fr] gap-3',
                        status === 'past' && 'opacity-60',
                      ].join(' ')}
                    >
                      {/* Date column */}
                      <div className="text-right pr-1">
                        <p className={[
                          'text-[13px] font-medium font-mono tracking-[0.02em]',
                          status === 'past'
                            ? 'text-[var(--color-text-secondary)]'
                            : status === 'next'
                              ? 'text-primary font-medium'
                              : 'text-[var(--color-text-secondary)]',
                        ].join(' ')}>
                          {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 opacity-70">
                          {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </p>
                      </div>

                      {/* Dot column */}
                      <div className="relative flex justify-center pt-2">
                        {/* Connecting line - only on non-last items */}
                        {!isLast && (
                          <div
                            className="absolute left-1/2 -translate-x-1/2 w-px bg-[rgba(242,237,229,0.14)]"
                            style={{ top: '12px', bottom: '-28px', height: 'calc(100% + 28px)' }}
                          />
                        )}

                        <div className="relative z-10">
                          {status === 'past' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4D4033]" />
                          )}
                          {status === 'next' && (
                            <div
                              className="w-3 h-3 rounded-full bg-primary"
                              style={{
                                boxShadow: '0 0 0 4px rgba(209,109,48,0.10)',
                              }}
                            />
                          )}
                          {status === 'upcoming' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-bg)] border border-[#4D4033]" />
                          )}
                        </div>
                      </div>

                      {/* Content column */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {status === 'next' && (
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-1">
                              UP NEXT
                            </p>
                          )}
                          <p className={[
                            'font-serif font-medium text-[var(--color-text-primary)]',
                            status === 'next' ? 'text-[22px]' : 'text-[18px]',
                          ].join(' ')}>
                            {discussion.title}
                          </p>
                          {discussion.location && (
                            <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                              {discussion.location}
                            </p>
                          )}
                        </div>

                        {isAdmin && (
                          <KebabMenu
                            items={[
                              {
                                label: 'Edit',
                                onClick: () => handleEditDiscussion(discussion),
                              },
                              {
                                label: 'Delete',
                                danger: true,
                                onClick: () => handleDeleteDiscussion(discussion),
                              },
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : mobileTab === 'members' ? (
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <p className="font-serif italic text-[16px] text-[var(--color-text-secondary)]">
                  {club.members.length} members
                </p>
                {isAdmin && (
                  <button
                    onClick={handleAddMember}
                    className="border border-[var(--color-divider)] text-[var(--color-text-primary)] text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-[rgba(242,237,229,0.04)] transition-colors"
                  >
                    + Invite
                  </button>
                )}
              </div>

              {/* Members list */}
              <div className="space-y-3">
                {getSortedMembers(club.members).map((clubMember) => {
                  const memberWithRole = clubMember as Member & { role?: string }
                  const memberRole = memberWithRole.role || 'member'
                  const isOwn = member?.id != null && member.id === clubMember.id

                  return (
                    <div
                      key={clubMember.id}
                      className="flex items-center gap-3 py-3 border-b border-[var(--color-divider)]"
                    >
                      <Avatar
                        name={clubMember.name}
                        userId={String(clubMember.id)}
                        size="lg"
                        isOwn={isOwn}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                            {clubMember.name}
                          </p>
                          {isOwn && (
                            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[var(--color-text-secondary)]">
                          @{clubMember.handle || clubMember.discord_id || 'unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RoleEyebrow
                          role={memberRole as 'owner' | 'admin' | 'member'}
                        />
                        {isAdmin && !isOwn && memberRole !== 'owner' && (
                          <KebabMenu
                            items={[
                              {
                                label: 'Edit role',
                                onClick: () => handleEditMember(clubMember),
                              },
                              {
                                label: 'Remove',
                                danger: true,
                                onClick: () => handleDeleteMember(clubMember),
                              },
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Invite CTA when flying solo */}
              {club.members.length <= 1 && isAdmin && (
                <div className="mt-5 flex flex-col items-center text-center py-4">
                  <p className="font-serif italic text-[20px] font-medium text-[var(--color-text-secondary)] leading-snug mb-4">
                    Invite others to get the conversation going.
                  </p>
                  <button
                    onClick={handleAddMember}
                    className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
                  >
                    Invite Members
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      <EditBookModal
        isOpen={showEditBookModal}
        onClose={() => setShowEditBookModal(false)}
        selectedClub={club}
        onBookUpdated={refreshClub}
        onError={setError}
      />
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        selectedClub={club}
        onSessionCreated={refreshClub}
        onError={setError}
      />
      <DiscussionModal
        isOpen={showAddDiscussionModal}
        onClose={() => {
          setShowAddDiscussionModal(false)
          setEditingDiscussion(null)
        }}
        selectedClub={club}
        editingDiscussion={editingDiscussion}
        onDiscussionSaved={refreshClub}
        onError={setError}
      />
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        selectedClub={club}
        onMemberAdded={refreshClub}
        onClubUpdated={refreshClub}
        onError={setError}
      />
      <MemberModal
        isOpen={showMemberModal}
        onClose={() => {
          setShowMemberModal(false)
          setEditingMember(null)
        }}
        selectedClub={club}
        editingMember={editingMember}
        editorRole={clubRole}
        onMemberSaved={refreshClub}
        onError={setError}
      />
      <DeleteMemberModal
        isOpen={showDeleteMemberModal}
        onClose={() => {
          setShowDeleteMemberModal(false)
          setMemberToDelete(null)
        }}
        memberToDelete={memberToDelete}
        clubId={club.id}
        onMemberDeleted={refreshClub}
        onError={setError}
      />
      <DeleteDiscussionModal
        isOpen={showDeleteDiscussionModal}
        onClose={() => {
          setShowDeleteDiscussionModal(false)
          setDiscussionToDelete(null)
        }}
        discussionToDelete={discussionToDelete}
        selectedClub={club}
        onDiscussionDeleted={refreshClub}
        onError={setError}
      />
      <EditClubModal
        isOpen={showEditClubModal}
        onClose={() => setShowEditClubModal(false)}
        club={club}
        onClubUpdated={refreshClub}
        onDeleteClub={() => {
          setShowEditClubModal(false)
          setClubToDelete({ id: club.id, name: club.name })
          setShowDeleteClubModal(true)
        }}
        onError={setError}
      />
      <DeleteClubModal
        isOpen={showDeleteClubModal}
        onClose={() => {
          setShowDeleteClubModal(false)
          setClubToDelete(null)
        }}
        clubToDelete={clubToDelete}
        selectedServer={serverId}
        selectedClub={club}
        onClubDeleted={() => { refreshMemberData(); navigate('/clubs', { replace: true }) }}
        onError={setError}
      />
      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        onClubCreated={() => {
          setShowAddClubModal(false)
          refreshMemberData()
        }}
        onError={setError}
      />
      <ShareClubModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        club={club}
        onUpdated={(patch) => setClub(prev => prev ? { ...prev, ...patch } : prev)}
      />
    </>
  )
}

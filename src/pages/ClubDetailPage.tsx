import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { invokeFunction } from '../supabase'
import type { Club, Server, Discussion, Member } from '../types'
import EditBookModal from '../components/modals/EditBookModal'
import NewSessionModal from '../components/modals/NewSessionModal'
import DiscussionModal from '../components/modals/DiscussionModal'
import MemberModal from '../components/modals/MemberModal'
import DeleteMemberModal from '../components/modals/DeleteMemberModal'
import DeleteDiscussionModal from '../components/modals/DeleteDiscussionModal'
import DeleteClubModal from '../components/modals/DeleteClubModal'
import DiscussionsTimeline from '../components/DiscussionsTimeline'
import MembersTable from '../components/MembersTable'
import BookInfo from '../components/BookInfo'
import { useAuth } from '../contexts/AuthContext'

type TabId = 'general' | 'session' | 'members'

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { member, getRoleForClub } = useAuth()

  const memberClub = member?.clubs.find(c => c.id === slug)
  const serverId = memberClub?.server_id ?? ''

  const [club, setClub] = useState<Club | null>(null)
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [clubLoading, setClubLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedServerData = servers.find(s => s.id === serverId)
  const clubRole = club ? getRoleForClub(club.id) : null
  const isAdmin = clubRole === 'admin' || clubRole === 'owner'

  // Tab state lives in ?tab= URL param, replaceState only
  const activeTab = (searchParams.get('tab') ?? 'general') as TabId
  const setTab = (tab: TabId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    }, { replace: true })
  }

  // Modal state
  const [showEditBookModal, setShowEditBookModal] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [showAddDiscussionModal, setShowAddDiscussionModal] = useState(false)
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null)
  const [showDeleteDiscussionModal, setShowDeleteDiscussionModal] = useState(false)
  const [discussionToDelete, setDiscussionToDelete] = useState<Discussion | null>(null)
  const [showDeleteClubModal, setShowDeleteClubModal] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<{ id: string; name: string } | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  // Persist last-visited club slug
  useEffect(() => {
    if (slug) localStorage.setItem('kluvs:lastClub', slug)
  }, [slug])

  // Redirect if this club isn't in the member's list
  useEffect(() => {
    if (member && !memberClub) navigate('/clubs', { replace: true })
  }, [member, memberClub, navigate])

  // Warm up edge functions called only on user action
  useEffect(() => {
    invokeFunction('session', { method: 'GET' }).catch(() => {})
    invokeFunction('book', { method: 'GET' }).catch(() => {})
    invokeFunction<{ servers: Server[] }>('server', { method: 'GET' })
      .then(({ data }) => { if (data?.servers) setServers(data.servers) })
      .catch(() => {})
  }, [])

  // Fetch club details whenever slug changes
  useEffect(() => {
    if (!slug || !serverId) return
    fetchClub(slug, serverId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, serverId])

  const fetchClub = async (clubId: string, srvId: string) => {
    try {
      setLoading(true)
      setError(null)
      const fn = `club?id=${encodeURIComponent(clubId)}&server_id=${encodeURIComponent(srvId)}`
      const { data, error: err } = await invokeFunction<Club>(fn, { method: 'GET' })
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
    if (!slug || !serverId) return
    try {
      setClubLoading(true)
      const fn = `club?id=${encodeURIComponent(slug)}&server_id=${encodeURIComponent(serverId)}`
      const { data, error: err } = await invokeFunction<Club>(fn, { method: 'GET' })
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

  // Discussion handlers
  const handleAddDiscussion = () => { setEditingDiscussion(null); setShowAddDiscussionModal(true) }
  const handleEditDiscussion = (d: Discussion) => { setEditingDiscussion(d); setShowAddDiscussionModal(true) }
  const handleDeleteDiscussion = (d: Discussion) => { setDiscussionToDelete(d); setShowDeleteDiscussionModal(true) }

  // Member handlers
  const handleAddMember = () => { setEditingMember(null); setShowMemberModal(true) }
  const handleEditMember = (m: Member) => { setEditingMember(m); setShowMemberModal(true) }
  const handleDeleteMember = (m: Member) => { setMemberToDelete(m); setShowDeleteMemberModal(true) }

  const nextDiscussion = club?.active_session
    ? [...club.active_session.discussions]
        .filter(d => new Date(d.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent mx-auto" />
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading club…</p>
        </div>
      </div>
    )
  }

  if (!club) return null

  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Mobile back link */}
        <Link
          to="/clubs"
          className="lg:hidden inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Clubs
        </Link>

        {error && (
          <div className="mb-5 bg-danger/10 border border-danger/30 rounded-card p-4">
            <p className="text-danger font-medium">{error}</p>
          </div>
        )}

        {/* Club header */}
        <div className="mb-5">
          <h1 className="text-page-heading font-serif font-bold text-[var(--color-text-primary)]">
            {club.name}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {[
              `${club.members.length} member${club.members.length !== 1 ? 's' : ''}`,
              club.founded_date && `Founded in ${new Date(club.founded_date).getFullYear()}`
            ].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Tab bar */}
        <div className="border-b border-[var(--color-divider)] mb-6">
          <nav className="-mb-px flex gap-1">
            {([
              { id: 'general',  label: 'General' },
              { id: 'session',  label: 'Active Session' },
              { id: 'members',  label: 'Members' },
            ] as { id: TabId; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'text-primary border-primary'
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab panels */}
        {clubLoading ? (
          <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-r-transparent mx-auto" />
          </div>
        ) : (
          <div key={activeTab}>
            {/* General */}
            {activeTab === 'general' && (
              <div className="divide-y divide-[var(--color-divider)]">
                <div className="pb-5">
                  <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">Current Book</p>
                  {club.active_session ? (
                    <BookInfo book={club.active_session.book} dueDate={club.active_session.due_date} />
                  ) : (
                    <>
                      <p className="text-body text-[var(--color-text-secondary)] italic">No active reading session</p>
                      {isAdmin && (
                        <button
                          onClick={() => setShowNewSessionModal(true)}
                          className="mt-3 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
                        >
                          Start Session
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="pt-5">
                  <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">Next Discussion</p>
                  {nextDiscussion ? (
                    <>
                      <h4 className="font-medium text-[var(--color-text-primary)]">{nextDiscussion.title}</h4>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {[
                          nextDiscussion.location,
                          new Date(nextDiscussion.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </>
                  ) : (
                    <p className="text-body text-[var(--color-text-secondary)] italic">No upcoming discussion</p>
                  )}
                </div>
              </div>
            )}

            {/* Active Session */}
            {activeTab === 'session' && (
              <div>
                {club.active_session ? (
                  <div className="divide-y divide-[var(--color-divider)]">
                    <div className="pb-6">
                      <BookInfo
                        book={club.active_session.book}
                        dueDate={club.active_session.due_date}
                        isAdmin={isAdmin}
                        onEditBook={() => setShowEditBookModal(true)}
                        onNewSession={() => setShowNewSessionModal(true)}
                      />
                    </div>
                    <div className="pt-6">
                      <DiscussionsTimeline
                        selectedClub={club}
                        isAdmin={isAdmin}
                        onAddDiscussion={handleAddDiscussion}
                        onEditDiscussion={handleEditDiscussion}
                        onDeleteDiscussion={handleDeleteDiscussion}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[var(--color-text-secondary)]">No active reading session</p>
                    {isAdmin && (
                      <button
                        onClick={() => setShowNewSessionModal(true)}
                        className="mt-4 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
                      >
                        Start Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Members */}
            {activeTab === 'members' && (
              <MembersTable
                selectedClub={club}
                isAdmin={isAdmin}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
              />
            )}
          </div>
        )}
      </main>

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
        onClose={() => { setShowAddDiscussionModal(false); setEditingDiscussion(null) }}
        selectedClub={club}
        editingDiscussion={editingDiscussion}
        onDiscussionSaved={refreshClub}
        onError={setError}
      />
      <MemberModal
        isOpen={showMemberModal}
        onClose={() => { setShowMemberModal(false); setEditingMember(null) }}
        selectedClub={club}
        selectedServerData={selectedServerData}
        editingMember={editingMember}
        onMemberSaved={refreshClub}
        onError={setError}
      />
      <DeleteMemberModal
        isOpen={showDeleteMemberModal}
        onClose={() => { setShowDeleteMemberModal(false); setMemberToDelete(null) }}
        memberToDelete={memberToDelete}
        onMemberDeleted={refreshClub}
        onError={setError}
      />
      <DeleteDiscussionModal
        isOpen={showDeleteDiscussionModal}
        onClose={() => { setShowDeleteDiscussionModal(false); setDiscussionToDelete(null) }}
        discussionToDelete={discussionToDelete}
        selectedClub={club}
        onDiscussionDeleted={refreshClub}
        onError={setError}
      />
      <DeleteClubModal
        isOpen={showDeleteClubModal}
        onClose={() => { setShowDeleteClubModal(false); setClubToDelete(null) }}
        clubToDelete={clubToDelete}
        selectedServer={serverId}
        selectedClub={club}
        onClubDeleted={() => navigate('/clubs', { replace: true })}
        onError={setError}
      />
    </>
  )
}

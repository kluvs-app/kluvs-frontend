import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
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

  if (!club) {
    return error ? (
      <main className="px-6 py-6">
        <div className="bg-danger/10 border border-danger/30 rounded-card p-4">
          <p className="text-danger font-medium">{error}</p>
        </div>
      </main>
    ) : null
  }

  return (
    <>
      <main className="px-6 py-6">
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
        <div className="sticky top-0 z-10 bg-[var(--color-bg)] -mx-6 px-6 py-4 mb-2 border-b border-[var(--color-divider)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-page-heading font-serif font-bold text-[var(--color-text-primary)]">
                {club.name}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {[
                  `${club.members.length} member${club.members.length !== 1 ? 's' : ''}`,
                  club.founded_date && `Founded in ${new Date(club.founded_date).getFullYear()}`
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setClubToDelete({ id: club.id, name: club.name }); setShowDeleteClubModal(true) }}
                className="shrink-0 p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-danger hover:bg-[var(--color-bg-elevated)] transition-colors"
                aria-label="Delete club"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {clubLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-r-transparent mx-auto" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-divider)]">
            {/* Active Session */}
            <section className="pt-6 pb-10">
              <p className="text-helper-sm font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
                Active Session
              </p>
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
                <div>
                  <p className="text-body text-[var(--color-text-secondary)] italic">No active reading session</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className="mt-3 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
                    >
                      Start Session
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Members */}
            <section className="pt-6">
              <MembersTable
                selectedClub={club}
                isAdmin={isAdmin}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
              />
            </section>
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

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Club, Server, Discussion, Member } from "../types"
import AddClubModal from '../components/modals/AddClubModal'
import EditBookModal from '../components/modals/EditBookModal'
import NewSessionModal from '../components/modals/NewSessionModal'
import DiscussionModal from '../components/modals/DiscussionModal'
import MemberModal from '../components/modals/MemberModal'
import DeleteMemberModal from '../components/modals/DeleteMemberModal'
import DeleteDiscussionModal from '../components/modals/DeleteDiscussionModal'
import DeleteClubModal from '../components/modals/DeleteClubModal'
import TopNavbar from '../components/layout/TopNavbar'
import Sidebar from '../components/layout/Sidebar'
import DiscussionsTimeline from '../components/DiscussionsTimeline'
import MembersTable from '../components/MembersTable'
import BookInfo from '../components/BookInfo'
import { useAuth } from '../contexts/AuthContext'

export default function ClubsDashboard() {
  const [servers, setServers] = useState<Server[]>([])
  const [selectedServer, setSelectedServer] = useState<string>('')
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [clubLoading, setClubLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getRoleForClub } = useAuth()
  const clubRole = selectedClub ? getRoleForClub(selectedClub.id) : null
  const isAdmin = clubRole === 'admin' || clubRole === 'owner'

  // Add Club Modal State
  const [showAddClubModal, setShowAddClubModal] = useState(false)

  // Edit Book Modal State
  const [showEditBookModal, setShowEditBookModal] = useState(false)

  // New Session Modal State
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  // Discussion Modal State
  const [showAddDiscussionModal, setShowAddDiscussionModal] = useState(false)
  const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null)

  // Delete Discussion Modal State
  const [showDeleteDiscussionModal, setShowDeleteDiscussionModal] = useState(false)
  const [discussionToDelete, setDiscussionToDelete] = useState<Discussion | null>(null)

  // Delete Club Modal State
  const [showDeleteClubModal, setShowDeleteClubModal] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<{ id: string; name: string } | null>(null)

  // Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)

  // Delete Member Modal State
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  // Sidebar mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Tab state for selected club view
  const [activeTab, setActiveTab] = useState<'general' | 'session' | 'members'>('general')

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers(false) // Don't preserve selection on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset to General tab whenever a different club is selected
  useEffect(() => {
    setActiveTab('general')
  }, [selectedClub?.id])

  const fetchServers = async (preserveSelection = true) => {
    try {
      setLoading(true)
      setError(null)

      // Preserve current selection if requested
      const currentSelection = preserveSelection ? selectedServer : null

      const { data, error } = await supabase.functions.invoke('server', {
        method: 'GET'
      })

      if (error) throw error

      if (data?.servers) {
        setServers(data.servers)

        // Smart selection logic
        if (currentSelection && data.servers.find((s: Server) => s.id === currentSelection)) {
          // Preserve selection if the server still exists
          setSelectedServer(currentSelection)
        } else {
          // Default to "Blingers' Books" server, fallback to first server
          const blingersServer = data.servers.find((s: Server) => s.name === "Blingers' Books")
          if (blingersServer) {
            setSelectedServer(blingersServer.id)
          } else if (data.servers.length > 0) {
            setSelectedServer(data.servers[0].id)
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching servers:', err)
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to fetch servers'
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchClubDetails = async (clubId: string, serverId?: string) => {
    const serverIdToUse = serverId ?? selectedServer
    try {
      console.log('🏢 [CLUB-FETCH] Starting fetchClubDetails for clubId:', clubId)
      console.log('🏢 [CLUB-FETCH] Selected server:', serverIdToUse)

      setClubLoading(true) // Start loading
      setError(null)

      // Build URL with query parameters since Edge Function expects GET with query params
      const functionName = `club?id=${encodeURIComponent(clubId)}&server_id=${encodeURIComponent(serverIdToUse)}`
      console.log('🏢 [CLUB-FETCH] Calling Edge Function with URL:', functionName)

      const { data, error } = await supabase.functions.invoke(functionName, {
        method: 'GET'
      })

      console.log('🏢 [CLUB-FETCH] Edge Function response:', {
        success: !error,
        error: error?.message || null,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : null
      })

      if (error) {
        console.error('🏢 [CLUB-FETCH] Edge Function error:', error)
        throw error
      }

      console.log('🏢 [CLUB-FETCH] Setting selected club:', {
        clubId: data?.id,
        clubName: data?.name,
        hasActiveSession: !!data?.active_session,
        membersCount: data?.members?.length || 0
      })

      setSelectedClub(data)
      console.log('🏢 [CLUB-FETCH] Successfully completed fetchClubDetails')

    } catch (err: unknown) {
      console.error('🏢 [CLUB-FETCH] ERROR in fetchClubDetails:', err)
      console.error('🏢 [CLUB-FETCH] Error details:', {
        message: err && typeof err === 'object' && 'message' in err ? err.message : String(err),
        clubId,
        selectedServer
      })

      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to fetch club details'
      )
    } finally {
      console.log('🏢 [CLUB-FETCH] Setting clubLoading to false')
      setClubLoading(false) // Stop loading
    }
  }

  // Club handlers
  const confirmDeleteClub = (club: { id: string; name: string }) => {
    setClubToDelete(club)
    setShowDeleteClubModal(true)
  }

  // Discussion handlers
  const handleAddDiscussion = () => {
    setEditingDiscussion(null) // Clear any editing discussion
    setShowAddDiscussionModal(true)
  }

  const handleEditDiscussion = (discussion: Discussion) => {
    setEditingDiscussion(discussion)
    setShowAddDiscussionModal(true)
  }

  const handleDeleteDiscussion = (discussion: Discussion) => {
    setDiscussionToDelete(discussion)
    setShowDeleteDiscussionModal(true)
  }

  // Member handlers
  const handleAddMember = () => {
    setEditingMember(null) // Clear any editing member
    setShowMemberModal(true)
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setShowMemberModal(true)
  }

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member)
    setShowDeleteMemberModal(true)
  }

  const selectedServerData = servers.find(s => s.id === selectedServer)

  const nextDiscussion = selectedClub?.active_session
    ? [...selectedClub.active_session.discussions]
        .filter(d => new Date(d.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent mx-auto"></div>
          <p className="mt-6 text-[var(--color-text-primary)] text-lg font-medium">Loading your book clubs...</p>
          <div className="mt-2 text-[var(--color-text-secondary)] text-sm">Organizing your library</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Top Navigation */}
      <TopNavbar
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        isAdmin={isAdmin}
      />

      {/* Sidebar + Main Content */}
      <div className="flex pt-16">
        <Sidebar
          servers={servers}
          selectedClub={selectedClub}
          onClubSelect={(clubId, serverId) => {
            setSidebarOpen(false)
            setSelectedServer(serverId)
            fetchClubDetails(clubId, serverId)
          }}
          onAddClub={() => setShowAddClubModal(true)}
          onDeleteClub={confirmDeleteClub}
          isAdmin={isAdmin}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6">
          {error && (
            <div className="mb-6 bg-danger/10 border border-danger/30 rounded-card p-4">
              <div className="flex items-center">
                <p className="text-danger font-medium">{error}</p>
              </div>
            </div>
          )}

          {clubLoading ? (
            /* Loading spinner when fetching club data */
            <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-r-transparent mx-auto mb-6"></div>
                <h3 className="text-section-heading text-[var(--color-text-primary)] mb-3">Loading Club Details</h3>
                <p className="text-[var(--color-text-secondary)]">Fetching the latest information about this book club...</p>
              </div>
            </div>
          ) : selectedClub ? (
            <div>
              {/* Club Header */}
              <div className="mb-4">
                <h2 className="text-page-heading text-[var(--color-text-primary)]">{selectedClub.name}</h2>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {[
                    `${selectedClub.members.length} member${selectedClub.members.length !== 1 ? 's' : ''}`,
                    selectedClub.founded_date && `Founded in ${new Date(selectedClub.founded_date).getFullYear()}`
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>

              {/* Tab Bar */}
              <div className="border-b border-[var(--color-divider)] mb-5">
                <nav className="-mb-px flex">
                  {[
                    { id: 'general', label: 'General' },
                    { id: 'session', label: 'Active Session' },
                    { id: 'members', label: 'Members' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as typeof activeTab)}
                      className={`px-4 py-2.5 text-sm font-semibold text-primary border-b-2 transition-colors ${
                        activeTab === id ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab: General */}
              {activeTab === 'general' && (
                <div className="divide-y divide-[var(--color-divider)]">
                  {/* Current Book */}
                  <div className="pb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">Current Book</p>
                    {selectedClub.active_session ? (
                      <BookInfo
                        book={selectedClub.active_session.book}
                        dueDate={selectedClub.active_session.due_date}
                      />
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

                  {/* Next Discussion */}
                  <div className="pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">Next Discussion</p>
                    {nextDiscussion ? (
                      <>
                        <h4 className="font-semibold text-[var(--color-text-primary)]">{nextDiscussion.title}</h4>
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

              {/* Tab: Active Session */}
              {activeTab === 'session' && (
                <div>
                  {selectedClub.active_session ? (
                    <div className="divide-y divide-[var(--color-divider)]">
                      {/* Book info */}
                      <div className="pb-6">
                        <BookInfo
                          book={selectedClub.active_session.book}
                          dueDate={selectedClub.active_session.due_date}
                          isAdmin={isAdmin}
                          onEditBook={() => setShowEditBookModal(true)}
                          onNewSession={() => setShowNewSessionModal(true)}
                        />
                      </div>
                      {/* Timeline */}
                      <div className="pt-6">
                        <DiscussionsTimeline
                          selectedClub={selectedClub}
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

              {/* Tab: Members */}
              {activeTab === 'members' && (
                <MembersTable
                  selectedClub={selectedClub}
                  isAdmin={isAdmin}
                  onAddMember={handleAddMember}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                />
              )}
            </div>
          ) : (
            /* No club selected state */
            <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {/* Hexagon — Clubs icon from Kluvs design system */}
                  <svg className="w-10 h-10 text-primary" viewBox="0 -960 960 960" fill="currentColor">
                    <path d="M264.65-107 48.74-480l215.91-373h430.7l215.91 373-215.91 373h-430.7Z" />
                  </svg>
                </div>
                <h3 className="text-section-heading text-[var(--color-text-primary)] mb-3">Select a Book Club</h3>
                <p className="text-[var(--color-text-secondary)]">Choose a club from the sidebar to explore its members, current reading session, and upcoming discussions.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* All Modals - Clean and Organized! */}

      {/* Add Club Modal */}
      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        selectedServer={selectedServer}
        selectedServerData={selectedServerData}
        onClubCreated={async (clubId) => {
          await fetchServers() // Will preserve selection by default
          await fetchClubDetails(clubId) // Auto-select the new club
        }}
        onError={setError}
      />

      {/* Edit Book Modal */}
      {selectedClub && (
        <EditBookModal
          isOpen={showEditBookModal}
          onClose={() => setShowEditBookModal(false)}
          selectedClub={selectedClub}
          onBookUpdated={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show updated book
          }}
          onError={setError}
        />
      )}

      {/* New Session Modal */}
      {selectedClub && (
        <NewSessionModal
          isOpen={showNewSessionModal}
          onClose={() => setShowNewSessionModal(false)}
          selectedClub={selectedClub}
          onSessionCreated={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show new session
          }}
          onError={setError}
        />
      )}

      {/* Add/Edit Discussion Modal */}
      {selectedClub && (
        <DiscussionModal
          isOpen={showAddDiscussionModal}
          onClose={() => {
            setShowAddDiscussionModal(false)
            setEditingDiscussion(null)
          }}
          selectedClub={selectedClub}
          editingDiscussion={editingDiscussion}
          onDiscussionSaved={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show updated discussions
          }}
          onError={setError}
        />
      )}

      {/* Add/Edit Member Modal */}
      {selectedClub && (
        <MemberModal
          isOpen={showMemberModal}
          onClose={() => {
            setShowMemberModal(false)
            setEditingMember(null)
          }}
          selectedClub={selectedClub}
          selectedServerData={selectedServerData}
          editingMember={editingMember}
          onMemberSaved={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show updated members
          }}
          onError={setError}
        />
      )}

      {/* Delete Member Modal */}
      {selectedClub && (
        <DeleteMemberModal
          isOpen={showDeleteMemberModal}
          onClose={() => {
            setShowDeleteMemberModal(false)
            setMemberToDelete(null)
          }}
          memberToDelete={memberToDelete}
          onMemberDeleted={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show updated members
          }}
          onError={setError}
        />
      )}

      {/* Delete Discussion Modal */}
      {selectedClub && (
        <DeleteDiscussionModal
          isOpen={showDeleteDiscussionModal}
          onClose={() => {
            setShowDeleteDiscussionModal(false)
            setDiscussionToDelete(null)
          }}
          discussionToDelete={discussionToDelete}
          selectedClub={selectedClub}
          onDiscussionDeleted={async () => {
            await fetchClubDetails(selectedClub.id) // Refresh club details to show updated discussions
          }}
          onError={setError}
        />
      )}

      {/* Delete Club Modal */}
      <DeleteClubModal
        isOpen={showDeleteClubModal}
        onClose={() => {
          setShowDeleteClubModal(false)
          setClubToDelete(null)
        }}
        clubToDelete={clubToDelete}
        selectedServer={selectedServer}
        selectedClub={selectedClub}
        onClubDeleted={async () => {
          // Clear selected club if it was the one being deleted
          if (selectedClub?.id === clubToDelete?.id) {
            setSelectedClub(null)
          }
          // Refresh servers to get updated club list
          await fetchServers() // Will preserve server selection
        }}
        onError={setError}
      />
    </div>
  )
}

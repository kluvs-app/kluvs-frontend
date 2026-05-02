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
import CurrentReadingCard from '../components/CurrentReadingCard'
import DiscussionsTimeline from '../components/DiscussionsTimeline'
import MembersTable from '../components/MembersTable'
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

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers(false) // Don't preserve selection on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const fetchClubDetails = async (clubId: string) => {
    try {
      console.log('🏢 [CLUB-FETCH] Starting fetchClubDetails for clubId:', clubId)
      console.log('🏢 [CLUB-FETCH] Selected server:', selectedServer)

      setClubLoading(true) // Start loading
      setError(null)

      // Build URL with query parameters since Edge Function expects GET with query params
      const functionName = `club?id=${encodeURIComponent(clubId)}&server_id=${encodeURIComponent(selectedServer)}`
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
        servers={servers}
        selectedServer={selectedServer}
        onServerChange={(serverId) => {
          setSelectedServer(serverId)
          setSelectedClub(null)
        }}
        onMenuToggle={() => setSidebarOpen(prev => !prev)}
        isAdmin={isAdmin}
      />

      {/* Sidebar + Main Content */}
      <div className="flex pt-16">
        <Sidebar
          selectedServerData={selectedServerData}
          selectedClub={selectedClub}
          onClubSelect={(clubId) => {
            setSidebarOpen(false)
            fetchClubDetails(clubId)
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
            <div className="space-y-6">
              {/* Club Info */}
              <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-page-heading text-[var(--color-text-primary)]">{selectedClub.name}</h2>
                    {selectedClub.discord_channel && (
                      <p className="text-[var(--color-text-secondary)] mt-1 font-medium">Discord: #{selectedClub.discord_channel}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium">Server ID</p>
                    <p className="text-[var(--color-text-primary)] font-mono text-sm bg-[var(--color-bg-elevated)] px-2 py-1 rounded">{selectedClub.server_id}</p>
                  </div>
                </div>
              </div>

              {/* Hero Current Reading Card */}
              <CurrentReadingCard
                selectedClub={selectedClub}
                isAdmin={isAdmin}
                onEditBook={() => setShowEditBookModal(true)}
                onNewSession={() => setShowNewSessionModal(true)}
              />

              {/* Discussions Timeline */}
              <DiscussionsTimeline
                selectedClub={selectedClub}
                isAdmin={isAdmin}
                onAddDiscussion={handleAddDiscussion}
                onEditDiscussion={handleEditDiscussion}
                onDeleteDiscussion={handleDeleteDiscussion}
              />

              {/* Members Table */}
              <MembersTable
                selectedClub={selectedClub}
                isAdmin={isAdmin}
                onAddMember={handleAddMember}
                onEditMember={handleEditMember}
                onDeleteMember={handleDeleteMember}
              />
            </div>
          ) : (
            /* No club selected state */
            <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
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

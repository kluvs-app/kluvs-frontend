import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { invokeFunction } from '../supabase'
import AddClubModal from '../components/modals/AddClubModal'
import type { Server } from '../types'

interface ClubsPageProps {
  openNewModal?: boolean
}

export default function ClubsPage({ openNewModal = false }: ClubsPageProps) {
  const { member, refreshMemberData } = useAuth()
  const [showAddClubModal, setShowAddClubModal] = useState(openNewModal)
  const [servers, setServers] = useState<Server[]>([])

  const clubs = member?.clubs ?? []
  const selectedServer = servers[0]?.id ?? ''
  const selectedServerData = servers[0]

  useEffect(() => {
    invokeFunction<{ servers: Server[] }>('server', { method: 'GET' })
      .then(({ data }) => { if (data?.servers) setServers(data.servers) })
      .catch(() => {})
  }, [])

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-page-heading font-serif font-bold text-[var(--color-text-primary)]">
          Your Clubs
        </h1>
        <button
          onClick={() => setShowAddClubModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </button>
      </div>

      {/* Club list */}
      {clubs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--color-text-primary)] font-medium">No clubs yet</p>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Create your first book club to get started.
          </p>
        </div>
      ) : (
        <div>
          {clubs.map((club) => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="flex items-center gap-4 px-6 py-3.5 -mx-6 border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-bg-elevated)] transition-colors group"
            >
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {club.name[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--color-text-primary)] truncate">
                  {club.name}
                </p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  club.role === 'owner'
                    ? 'bg-role-owner/15 text-role-owner'
                    : club.role === 'admin'
                      ? 'bg-tertiary/10 text-tertiary'
                      : 'bg-secondary/10 text-secondary'
                }`}>
                  {club.role}
                </span>
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}

      <AddClubModal
        isOpen={showAddClubModal}
        onClose={() => setShowAddClubModal(false)}
        selectedServer={selectedServer}
        selectedServerData={selectedServerData}
        onClubCreated={() => {
          setShowAddClubModal(false)
          refreshMemberData()
        }}
      />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { ClubCreateResponse, DiscordGuild } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import DiscordIcon from '../icons/DiscordIcon'
import Button from '../ui/Button'
import { toLocalDateString } from '../../utils/dates'

interface AddClubModalProps {
  isOpen: boolean
  onClose: () => void
  onClubCreated: (clubId: string) => void
  onError: (error: string) => void
}

interface AddClubFormData {
  name: string
  discord_channel: string
}

export default function AddClubModal({
  isOpen,
  onClose,
  onClubCreated,
  onError
}: AddClubModalProps) {
  const { member } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AddClubFormData>({ name: '', discord_channel: '' })
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [guildsLoading, setGuildsLoading] = useState(false)
  const [selectedServer, setSelectedServer] = useState('')

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      onError('Club name is required')
      return
    }
    try {
      setLoading(true)
      onError('')
      const clubId = crypto.randomUUID()
      const { error } = await invokeFunction<ClubCreateResponse>('club', {
        method: 'POST',
        body: {
          id: clubId,
          name: formData.name.trim(),
          server_id: selectedServer || null,
          discord_channel: formData.discord_channel.trim() || null,
          founded_date: toLocalDateString(new Date()),
        }
      })
      if (error) throw error
      setFormData({ name: '', discord_channel: '' })
      onClose()
      onClubCreated(clubId)
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to create club'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', discord_channel: '' })
    setGuilds([])
    setSelectedServer('')
    onError('')
    onClose()
  }

  useEffect(() => {
    if (!isOpen || !member?.discord_id) return
    let cancelled = false
    const fetchGuilds = async () => {
      setGuildsLoading(true)
      try {
        const { data, error } = await invokeFunction<DiscordGuild[]>(
          `discord-guilds?member_id=${encodeURIComponent(member.id)}`,
          { method: 'GET' }
        )
        if (cancelled) return
        if (!error && Array.isArray(data)) {
          setGuilds(data)
          if (data.length === 1) setSelectedServer(data[0].id ?? '')
        }
      } finally {
        if (!cancelled) setGuildsLoading(false)
      }
    }
    fetchGuilds()
    return () => { cancelled = true }
  }, [isOpen])

  const currentGuild = guilds.find(g => g.id === selectedServer)
  const channels = currentGuild?.channels ?? []

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Club"
      loading={loading}
      labelId="modal-title-add-club"
      footer={
        <>
          <Button
            variant="text"
            onClick={handleClose}
            disabled={loading}
          >Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Creating…' : 'Create Club'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label
            className="t-eyebrow" style={{
              display: 'block',
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}
          >Club Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Fantasy Book Club"
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
            maxLength={100}
            autoFocus
          />
        </div>

        {member?.discord_id && (
          <div
            className="rounded-input space-y-4 px-4 pt-4 pb-4"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
          >
            <div className="flex items-center gap-2">
              <DiscordIcon className="w-4 h-4 shrink-0 text-discord" />
              <span className="t-eyebrow" style={{
                color: 'var(--color-text-secondary)',
              }}>Discord</span>
            </div>

            {guildsLoading ? (
              <div className="t-body-m flex items-center gap-2 text-[var(--color-text-secondary)]">
                <KluvsSpinner size={16} />
                <span>Loading servers…</span>
              </div>
            ) : guilds.length > 0 ? (
              <>
                {guilds.length === 1 ? (
                  <div>
                    <p className="t-eyebrow text-[var(--color-text-secondary)] mb-1">Server</p>
                    <p className="t-body-m text-[var(--color-text-primary)]">{guilds[0].name}</p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="add-club-server-select"
                      className="t-eyebrow" style={{
                        display: 'block',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 8,
                      }}
                    >Server</label>
                    <div className="relative">
                      <select
                        id="add-club-server-select"
                        value={selectedServer}
                        onChange={(e) => {
                          setSelectedServer(e.target.value)
                          setFormData(prev => ({ ...prev, discord_channel: '' }))
                        }}
                        className="t-body-m w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        disabled={loading}
                      >
                        <option value="">No server</option>
                        {guilds.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}

                {selectedServer && (
                  <div>
                    <label
                      htmlFor="add-club-channel-select"
                      className="t-eyebrow" style={{
                        display: 'block',
                        color: 'var(--color-text-secondary)',
                        marginBottom: 8,
                      }}
                    >Channel <span className="t-fine-print normal-case text-[var(--color-text-secondary)]">(optional)</span></label>
                    <div className="relative">
                      <select
                        id="add-club-channel-select"
                        value={formData.discord_channel}
                        onChange={(e) => setFormData(prev => ({ ...prev, discord_channel: e.target.value }))}
                        className="t-body-m w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-[13px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        disabled={loading}
                      >
                        <option value="">Select a channel…</option>
                        {channels.map(ch => (
                          <option key={ch.id} value={ch.id}>#{ch.name}</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </BaseModal>
  )
}

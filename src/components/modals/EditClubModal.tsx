import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Club, ClubUpdateResponse, DiscordGuild } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'
import DiscordIcon from '../icons/DiscordIcon'
import Button from '../ui/Button'

interface EditClubModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club
  onClubUpdated: () => void
  onDeleteClub: () => void
  onError: (error: string) => void
}

export default function EditClubModal({
  isOpen,
  onClose,
  club,
  onClubUpdated,
  onDeleteClub,
  onError,
}: EditClubModalProps) {
  const { member } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [foundedDate, setFoundedDate] = useState('')
  const [guilds, setGuilds] = useState<DiscordGuild[]>([])
  const [guildsLoading, setGuildsLoading] = useState(false)
  const [selectedServer, setSelectedServer] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [originalChannel, setOriginalChannel] = useState('')
  const [discordAcknowledged, setDiscordAcknowledged] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(club.name)
      setFoundedDate(club.founded_date ?? '')
      setSelectedChannel(club.discord_channel ?? '')
      setOriginalChannel(club.discord_channel ?? '')
      setDiscordAcknowledged(false)
    }
  }, [isOpen, club])

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
          const currentChannel = club.discord_channel ?? ''
          if (currentChannel) {
            const matchingGuild = data.find(g =>
              g.channels?.some(ch => ch.id === currentChannel)
            )
            if (matchingGuild) setSelectedServer(matchingGuild.id ?? '')
            else if (data.length === 1) setSelectedServer(data[0].id ?? '')
          } else if (data.length === 1) {
            setSelectedServer(data[0].id ?? '')
          }
        }
      } finally {
        if (!cancelled) setGuildsLoading(false)
      }
    }
    fetchGuilds()
    return () => { cancelled = true }
  }, [isOpen, member?.discord_id])

  const isDisconnecting = originalChannel !== '' && selectedChannel === ''
  const isRerouting = originalChannel !== '' && selectedChannel !== '' && selectedChannel !== originalChannel
  const showDiscordWarning = isDisconnecting || isRerouting
  const canSave = name.trim() !== '' && !(showDiscordWarning && !discordAcknowledged) && !loading

  const handleSubmit = async () => {
    if (!canSave) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction<ClubUpdateResponse>('club', {
        method: 'PUT',
        body: {
          id: club.id,
          name: name.trim(),
          server_id: selectedServer || null,
          discord_channel: selectedChannel || null,
          founded_date: foundedDate || null,
        },
      })
      if (error) throw error
      onClose()
      onClubUpdated()
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to update club')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setName('')
    setFoundedDate('')
    setSelectedServer('')
    setSelectedChannel('')
    setOriginalChannel('')
    setDiscordAcknowledged(false)
    setGuilds([])
    onError('')
    onClose()
  }

  const currentGuild = guilds.find(g => g.id === selectedServer)
  const channels = currentGuild?.channels ?? []

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Club"
      loading={loading}
      labelId="modal-title-edit-club"
      dangerZone={
        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.2)' }}
        >
          <p className="t-eyebrow" style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Danger Zone</p>
          <Button variant="outlined" onClick={onDeleteClub}
            disabled={loading}>
            Delete club
          </Button>
        </div>
      }
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
            disabled={!canSave}
          >
            {loading && <KluvsSpinner size={14} color="var(--color-on-primary)" />}
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">

        {/* Name */}
        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Club Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fantasy Book Club"
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Discord section */}
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
                    <label htmlFor="edit-club-server-select" className="t-eyebrow" style={{
                      display: 'block',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 8,
                    }}>Server</label>
                    <div className="relative">
                      <select
                        id="edit-club-server-select"
                        value={selectedServer}
                        onChange={(e) => {
                          setSelectedServer(e.target.value)
                          setSelectedChannel('')
                          setDiscordAcknowledged(false)
                        }}
                        className="t-body-m w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                    <label htmlFor="edit-club-channel-select" className="t-eyebrow" style={{
                      display: 'block',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 8,
                    }}>Channel <span className="t-fine-print normal-case text-[var(--color-text-secondary)]">(optional)</span></label>
                    <div className="relative">
                      <select
                        id="edit-club-channel-select"
                        value={selectedChannel}
                        onChange={(e) => {
                          setSelectedChannel(e.target.value)
                          setDiscordAcknowledged(false)
                        }}
                        className="t-body-m w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        disabled={loading}
                      >
                        <option value="">No channel</option>
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

                {showDiscordWarning && (
                  <div
                    className="rounded-lg px-4 py-3 space-y-3"
                    style={{ background: 'rgba(209,109,48,0.08)', border: '1px solid rgba(209,109,48,0.25)' }}
                  >
                    <p className="t-body-m" style={{ color: 'var(--color-primary)' }}>
                      {isDisconnecting
                        ? "You're disconnecting this club from Discord. Bot notifications will stop until a new channel is connected."
                        : "You're moving this club to a different Discord channel. The bot will stop posting to the current channel."}
                    </p>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discordAcknowledged}
                        onChange={(e) => setDiscordAcknowledged(e.target.checked)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="t-body-m text-[var(--color-text-primary)]">I understand</span>
                    </label>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Founded Date */}
        <div>
          <label className="t-eyebrow" style={{
            display: 'block',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>
            Founded Date{' '}
            <span className="t-fine-print normal-case">(optional)</span>
          </label>
          <input
            type="date"
            value={foundedDate}
            onChange={(e) => setFoundedDate(e.target.value)}
            className="t-body-m w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
          <p className="t-fine-print mt-2 text-[var(--color-text-secondary)]">
            This date was automatically set when your club was created in Kluvs. You can change it to reflect when your book club was actually founded. We know great clubs predate this app.
          </p>
        </div>
      </div>
    </BaseModal>
  )
}

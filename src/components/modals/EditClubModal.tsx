import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Club } from '../../types'
import KluvsSpinner from '../KluvsSpinner'

interface EditClubModalProps {
  isOpen: boolean
  onClose: () => void
  club: Club
  onClubUpdated: () => void
  onDeleteClub: () => void
  onError: (error: string) => void
}

interface Guild {
  id: string
  name: string
  channels: { id: string; name: string }[]
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
  const [guilds, setGuilds] = useState<Guild[]>([])
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
        const { data, error } = await invokeFunction<Guild[]>(
          `discord-guilds?member_id=${encodeURIComponent(member.id)}`,
          { method: 'GET' }
        )
        if (cancelled) return
        if (!error && Array.isArray(data)) {
          setGuilds(data)
          const currentChannel = club.discord_channel ?? ''
          if (currentChannel) {
            const matchingGuild = data.find(g =>
              g.channels.some(ch => ch.id === currentChannel)
            )
            if (matchingGuild) setSelectedServer(matchingGuild.id)
            else if (data.length === 1) setSelectedServer(data[0].id)
          } else if (data.length === 1) {
            setSelectedServer(data[0].id)
          }
        }
      } finally {
        if (!cancelled) setGuildsLoading(false)
      }
    }
    fetchGuilds()
    return () => { cancelled = true }
  }, [isOpen, member?.discord_id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) handleClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading])

  const isDisconnecting = originalChannel !== '' && selectedChannel === ''
  const isRerouting = originalChannel !== '' && selectedChannel !== '' && selectedChannel !== originalChannel
  const showDiscordWarning = isDisconnecting || isRerouting
  const canSave = name.trim() !== '' && !(showDiscordWarning && !discordAcknowledged) && !loading

  const handleSubmit = async () => {
    if (!canSave) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction('club', {
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

  if (!isOpen) return null

  const currentGuild = guilds.find(g => g.id === selectedServer)
  const channels = currentGuild?.channels ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-edit-club"
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-divider)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-5"
          style={{ borderBottom: '1px solid var(--color-divider)' }}
        >
          <span
            id="modal-title-edit-club"
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#D16D30',
            }}
          >Edit Club</span>
          <button
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-6 space-y-5">

          {/* Name */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}>Club Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fantasy Book Club"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                <img src="/ic-discord.svg" alt="" className="w-4 h-4 shrink-0" />
                <span style={{
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--color-text-secondary)',
                }}>Discord</span>
              </div>

              {guildsLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <KluvsSpinner size={16} />
                  <span>Loading servers…</span>
                </div>
              ) : guilds.length > 0 ? (
                <>
                  {guilds.length === 1 ? (
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Server</p>
                      <p className="text-sm text-[var(--color-text-primary)]">{guilds[0].name}</p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="edit-club-server-select" style={{
                        display: 'block',
                        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                        fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: 'var(--color-text-secondary)',
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
                          className="w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                      <label htmlFor="edit-club-channel-select" style={{
                        display: 'block',
                        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                        fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: 'var(--color-text-secondary)',
                        marginBottom: 8,
                      }}>Channel <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      <div className="relative">
                        <select
                          id="edit-club-channel-select"
                          value={selectedChannel}
                          onChange={(e) => {
                            setSelectedChannel(e.target.value)
                            setDiscordAcknowledged(false)
                          }}
                          className="w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
                      <p className="text-sm leading-relaxed" style={{ color: '#D16D30' }}>
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
                        <span className="text-sm text-[var(--color-text-primary)]">I understand</span>
                      </label>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Founded Date */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}>
              Founded Date{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="date"
              value={foundedDate}
              onChange={(e) => setFoundedDate(e.target.value)}
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              This date was automatically set when your club was created in Kluvs. You can change it to reflect when your book club was actually founded — we know great clubs predate this app.
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="px-6 py-3"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <button
            onClick={onDeleteClub}
            disabled={loading}
            className="text-sm font-medium text-danger hover:text-danger-hover transition-colors disabled:opacity-40"
          >
            Delete club…
          </button>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

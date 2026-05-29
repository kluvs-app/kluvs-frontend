import { useState, useEffect, useRef } from 'react'
import { supabase, invokeFunction, getAvatarUrl } from '../../supabase'
import { getAvatarColor } from '../ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import type { Member } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: () => void
  onError: (error: string) => void
  currentMember: Member | null
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
  onError,
  currentMember,
}: EditProfileModalProps) {
  const { member } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && currentMember) {
      setName(currentMember.name)
      setHandle(currentMember.handle ?? '')
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [isOpen, currentMember])

  useEffect(() => {
    return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) }
  }, [avatarPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !member) return
    try {
      setLoading(true)
      onError('')

      let newAvatarPath = member.avatar_path ?? null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg'
        const path = `avatars/${member.user_id ?? member.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('member-avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (uploadError) throw uploadError
        newAvatarPath = path
      }

      const body: Record<string, unknown> = {
        id: member.id,
        name: name.trim(),
        books_read: member.books_read,
        handle: handle.trim() || null,
      }
      if (newAvatarPath !== member.avatar_path) body.avatar_path = newAvatarPath

      const { error } = await invokeFunction('member', { method: 'PUT', body })
      if (error) throw error

      onClose()
      onProfileUpdated()
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setName(currentMember?.name ?? '')
    setHandle(currentMember?.handle ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    onError('')
    onClose()
  }

  if (!member) return null

  const initials = member.name ? nameInitials(member.name) : '?'
  const currentAvatarUrl = avatarPreview ?? (currentMember?.avatar_path ? getAvatarUrl(currentMember.avatar_path) : null)
  const hasChanges = name.trim() !== member.name || (handle.trim() || null) !== (member.handle ?? null) || avatarFile !== null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Profile"
      loading={loading}
      labelId="modal-title-edit-profile"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !hasChanges}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-5">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="relative group"
            aria-label="Change avatar"
          >
            <div
              className="rounded-full flex items-center justify-center text-white font-serif font-medium overflow-hidden relative"
              style={{ width: 72, height: 72, fontSize: 72 * 0.40, letterSpacing: '-0.015em', backgroundColor: getAvatarColor(member.id) }}
            >
              {initials}
              {currentAvatarUrl && (
                <img
                  src={currentAvatarUrl}
                  alt="Member avatar"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <span className="text-[11px] text-[var(--color-text-secondary)]">
            {avatarFile ? avatarFile.name : 'Click to change'}
          </span>
        </div>

        {/* Name */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}
          >Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            disabled={loading}
            maxLength={100}
            autoFocus
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        {/* Handle */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
              marginBottom: 8,
            }}
          >Handle <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div className="flex items-center bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-colors">
            <span className="pl-4 pr-1 text-sm text-[var(--color-text-secondary)] select-none shrink-0">@</span>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="bookworm42"
              disabled={loading}
              maxLength={50}
              className="flex-1 bg-transparent py-3 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Discord status */}
        {currentMember?.discord_id ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-input"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
          >
            <img src="/ic-discord.svg" alt="" className="w-4 h-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Discord</p>
              <p className="text-sm text-[var(--color-text-primary)] font-mono truncate mt-0.5">{currentMember.discord_id}</p>
            </div>
            <span className="text-xs font-medium text-secondary shrink-0">Connected</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-input"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
          >
            <img src="/ic-discord.svg" alt="" className="w-4 h-4 shrink-0 opacity-40" />
            <p className="text-sm text-[var(--color-text-secondary)] flex-1">Discord not connected</p>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

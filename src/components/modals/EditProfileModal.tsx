import { useState, useEffect } from 'react'
import { supabase, getAvatarUrl } from '../../supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Member } from '../../types'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: () => void
  onError: (error: string) => void
  currentMember: Member | null
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
  onError,
  currentMember
}: EditProfileModalProps) {
  const { member } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [discordId, setDiscordId] = useState<string>('')

  // Pre-populate form when modal opens
  useEffect(() => {
    if (isOpen && currentMember) {
      setName(currentMember.name)
      setDiscordId(currentMember.discord_id ?? '')
    }
  }, [isOpen, currentMember])

  const handleSubmit = async () => {
    if (!name.trim()) {
      onError('Name is required')
      return
    }

    if (discordId.trim() && !/^\d{17,19}$/.test(discordId.trim())) {
      onError('Discord ID must be a 17–19 digit number')
      return
    }

    if (!member) {
      onError('No member data found')
      return
    }

    try {
      setLoading(true)
      onError('') // Clear any existing errors

      const requestBody = {
        id: member.id,
        name: name.trim(),
        books_read: member.books_read,
        discord_id: discordId.trim() || null
      }

      console.log('Updating member with:', requestBody)

      const { data, error } = await supabase.functions.invoke('member', {
        method: 'PUT',
        body: requestBody
      })

      console.log('Update response:', { data, error })

      if (error) throw error

      onClose()
      onProfileUpdated()

    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to update profile'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName(currentMember?.name || '')
    setDiscordId(currentMember?.discord_id ?? '')
    onError('') // Clear errors when closing
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!isOpen || !member) return null

  const hasChanges = name.trim() !== member.name || (discordId.trim() || null) !== (member.discord_id ?? null)

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-edit-profile">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
            </div>
            <div>
              <h2 id="modal-title-edit-profile" className="text-card-heading text-[var(--color-text-primary)]">Edit Profile</h2>
              <p className="text-helper text-[var(--color-text-secondary)]">Update your profile details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            disabled={loading}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Display Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
              autoFocus
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              This is how your name appears to other members
            </p>
          </div>

          {/* Discord ID Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Discord ID
            </label>
            <input
              type="text"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="e.g., 123456789012345678"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={19}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              Your Discord snowflake ID — leave blank to clear
            </p>
          </div>

          {/* Avatar Display */}
          {currentMember?.avatar_path && (
            <div>
              <label className="block text-[var(--color-text-primary)] font-medium mb-2">
                Avatar
              </label>
              <div className="flex items-center space-x-3">
                <img
                  src={getAvatarUrl(currentMember.avatar_path)}
                  alt="Member avatar"
                  className="w-16 h-16 rounded-full object-cover border border-[var(--color-divider)]"
                />
                <p className="text-[var(--color-text-secondary)] text-xs">Avatar is managed externally</p>
              </div>
            </div>
          )}

          {/* Current Stats Display */}
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center">
                  {member.books_read} books
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)] text-xs">Read-only stats</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-divider)]">
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !hasChanges}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Updating...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

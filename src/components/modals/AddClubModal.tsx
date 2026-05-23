import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Server } from '../../types'
import KluvsSpinner from '../KluvsSpinner'

interface AddClubModalProps {
  isOpen: boolean
  onClose: () => void
  selectedServer: string
  selectedServerData: Server | undefined
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
  selectedServer,
  selectedServerData,
  onClubCreated,
  onError
}: AddClubModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AddClubFormData>({
    name: '',
    discord_channel: ''
  })

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      onError('Club name is required')
      return
    }

    try {
      setLoading(true)
      onError('')

      const clubId = crypto.randomUUID()

      const requestBody = {
        id: clubId,
        name: formData.name.trim(),
        server_id: selectedServer,
        discord_channel: formData.discord_channel.trim() || null
      }

      console.log('Creating club:', requestBody)

      const { data, error } = await invokeFunction('club', {
        method: 'POST',
        body: requestBody
      })

      if (error) throw error

      console.log('Club created successfully:', data)

      setFormData({ name: '', discord_channel: '' })
      onClose()
      onClubCreated(clubId)

    } catch (err: unknown) {
      console.error('Error creating club:', err)
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
    onError('')
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-add-club">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h2 id="modal-title-add-club" className="text-card-heading text-[var(--color-text-primary)]">Add New Club</h2>
              <p className="text-helper text-[var(--color-text-secondary)]">Create a book club for your server</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            disabled={loading}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2 text-body">
              Club Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Fantasy Book Club"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2 text-body">
              Discord Channel ID <span className="text-[var(--color-text-secondary)]">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.discord_channel}
              onChange={(e) => setFormData(prev => ({ ...prev, discord_channel: e.target.value }))}
              placeholder="123456789012345678"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
            <p className="text-[var(--color-text-secondary)] text-helper mt-1">
              Right-click a Discord channel and Copy ID (requires Developer Mode)
            </p>
          </div>

          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-3">
            <p className="text-[var(--color-text-secondary)] text-body font-medium">
              Server: <span className="text-[var(--color-text-primary)]">{selectedServerData?.name}</span>
            </p>
            <p className="text-[var(--color-text-secondary)] text-helper mt-1">
              Club will be created in this server
            </p>
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
            disabled={loading || !formData.name.trim()}
            className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-btn font-medium transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <KluvsSpinner size={16} color="#ffffff" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Club</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

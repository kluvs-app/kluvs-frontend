import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import KluvsSpinner from '../KluvsSpinner'

interface DeleteClubModalProps {
  isOpen: boolean
  onClose: () => void
  clubToDelete: { id: string; name: string } | null
  selectedServer: string
  selectedClub: Club | null
  onClubDeleted: () => void
  onError: (error: string) => void
}

export default function DeleteClubModal({
  isOpen,
  onClose,
  clubToDelete,
  selectedServer,
  onClubDeleted,
  onError,
}: DeleteClubModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!clubToDelete) return
    try {
      setLoading(true)
      onError('')
      const { error } = await invokeFunction(
        `club?id=${encodeURIComponent(clubToDelete.id)}&server_id=${encodeURIComponent(selectedServer)}`,
        { method: 'DELETE' }
      )
      if (error) throw error
      onClose()
      onClubDeleted()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to delete club'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading])

  if (!isOpen || !clubToDelete) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-delete-club"
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
            id="modal-title-delete-club"
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-danger)',
            }}
          >Delete Club</span>
          <button
            onClick={onClose}
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
        <div className="px-6 pt-6 pb-6 space-y-4">
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold">"{clubToDelete.name}"</span>?
            This action cannot be undone.
          </p>
          <div
            className="rounded-input px-4 py-3 space-y-1"
            style={{ background: 'rgba(var(--color-danger-rgb, 220 38 38) / 0.06)', border: '1px solid rgba(var(--color-danger-rgb, 220 38 38) / 0.2)' }}
          >
            <p className="text-xs font-medium text-danger uppercase tracking-wider mb-2">This will permanently delete:</p>
            <p className="text-sm text-[var(--color-text-secondary)]">All reading sessions and books</p>
            <p className="text-sm text-[var(--color-text-secondary)]">All discussions and events</p>
            <p className="text-sm text-[var(--color-text-secondary)]">All member associations</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleDelete}
            disabled={loading}
            data-testid="modal-club-delete"
            className="flex items-center gap-2 bg-danger hover:bg-danger-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            <span>{loading ? 'Deleting…' : 'Delete Club'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

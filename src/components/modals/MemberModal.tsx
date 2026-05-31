import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Member, UserRole } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface MemberModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onMemberSaved: () => void
  onError: (error: string) => void
  editingMember?: Member | null
  editorRole?: UserRole | null
}

interface MemberFormData {
  name: string
  role: 'admin' | 'member'
  is_reading: boolean
}

const labelStyle = {
  display: 'block',
  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-text-secondary)',
  marginBottom: 8,
}

export default function MemberModal({
  isOpen,
  onClose,
  selectedClub,
  onMemberSaved,
  onError,
  editingMember,
  editorRole,
}: MemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    role: 'member',
    is_reading: false,
  })

  const isEditing = !!editingMember
  const canEditRole = isEditing && (editorRole === 'owner' || editorRole === 'admin')
  const hasActiveSession = selectedClub.active_session?.status === 'active'

  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        const memberWithRole = editingMember as Member & { role?: string }
        const currentRole = (memberWithRole.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member'
        const sessionMember = selectedClub.active_session?.members?.find(sm => sm.member_id === editingMember.id)
        setFormData({
          name: editingMember.name,
          role: currentRole,
          is_reading: sessionMember?.is_reading ?? false,
        })
      } else {
        setFormData({ name: '', role: 'member', is_reading: false })
      }
    }
  }, [isOpen, editingMember, selectedClub.active_session])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    onError('')

    try {
      if (!isEditing) {
        if (!formData.name.trim()) { setError('Member name is required'); return }
        const { error: err } = await invokeFunction('member', {
          method: 'POST',
          body: { name: formData.name.trim(), clubs: [selectedClub.id] }
        })
        if (err) throw err
        handleClose()
        onMemberSaved()
        return
      }

      if (!editingMember) return

      const memberWithRole = editingMember as Member & { role?: string }
      const originalRole = (memberWithRole.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member'
      const sessionMember = selectedClub.active_session?.members?.find(sm => sm.member_id === editingMember.id)
      const originalIsReading = sessionMember?.is_reading ?? false

      const roleChanged = canEditRole && formData.role !== originalRole
      const readingChanged = hasActiveSession && !!selectedClub.active_session && formData.is_reading !== originalIsReading

      if (!roleChanged && !readingChanged) {
        handleClose()
        onMemberSaved()
        return
      }

      let errorMsg: string | null = null
      let anySucceeded = false

      if (roleChanged) {
        const { error: err } = await invokeFunction('member', {
          method: 'PUT',
          body: {
            id: editingMember.id,
            books_read: editingMember.books_read,
            discord_id: editingMember.discord_id ?? null,
            club_roles: { [selectedClub.id]: formData.role },
          }
        })
        if (err) {
          const raw = err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to update role'
          errorMsg = raw === 'Forbidden'
            ? "You don't have permission to change this member's role."
            : raw
        } else {
          anySucceeded = true
        }
      }

      if (readingChanged) {
        const { error: err } = await invokeFunction('session', {
          method: 'PUT',
          body: {
            id: selectedClub.active_session!.id,
            session_members: [{ member_id: editingMember.id, is_reading: formData.is_reading }]
          }
        })
        if (err) {
          const raw = err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to update reading status'
          errorMsg = errorMsg ? `${errorMsg} ${raw}` : raw
        } else {
          anySucceeded = true
        }
      }

      if (anySucceeded) onMemberSaved()

      if (errorMsg) {
        setError(errorMsg)
      } else {
        handleClose()
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : `Failed to ${isEditing ? 'update' : 'add'} member`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', role: 'member', is_reading: false })
    setError(null)
    onError('')
    onClose()
  }

  const isSubmitDisabled = loading || (!isEditing && !formData.name.trim())

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Member' : 'Add Member'}
      loading={loading}
      labelId="modal-title-member"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            {loading && <KluvsSpinner size={14} color="#ffffff" />}
            {loading
              ? (isEditing ? 'Updating…' : 'Adding…')
              : (isEditing ? 'Update Member' : 'Add Member')}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {!isEditing && (
          <div>
            <label style={labelStyle}>Member Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., BookLover42"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
              autoFocus
            />
          </div>
        )}

        {canEditRole && (
          <div>
            <label style={labelStyle}>Role</label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                disabled={loading}
                className="w-full appearance-none bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input pl-4 pr-10 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        )}

        {isEditing && (
          <div>
            <label style={labelStyle}>Reading this session</label>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-primary)]">
                {formData.is_reading ? 'Reading' : 'Not reading'}
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={formData.is_reading}
                disabled={!hasActiveSession || loading}
                onClick={() => setFormData(prev => ({ ...prev, is_reading: !prev.is_reading }))}
                className={[
                  'relative inline-flex w-9 h-5 rounded-full transition-colors duration-150 flex-shrink-0',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  !hasActiveSession || loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  formData.is_reading && hasActiveSession ? 'bg-primary' : 'bg-[#4D4033]',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
                    formData.is_reading ? 'translate-x-4' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>
            {!hasActiveSession && (
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Start a session to enable this option.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <div
          className="rounded-input px-4 py-3"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Club</p>
          <p className="text-sm text-[var(--color-text-primary)]">{selectedClub.name}</p>
        </div>
      </div>
    </BaseModal>
  )
}

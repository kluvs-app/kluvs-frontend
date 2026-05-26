import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club, Server, Member } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface MemberModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  selectedServerData: Server | undefined
  onMemberSaved: () => void
  onError: (error: string) => void
  editingMember?: Member | null
}

interface MemberFormData {
  name: string
  books_read: string
  on_shame_list: boolean
  discord_id: string
}

export default function MemberModal({
  isOpen,
  onClose,
  selectedClub,
  selectedServerData,
  onMemberSaved,
  onError,
  editingMember
}: MemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    books_read: '0',
    on_shame_list: false,
    discord_id: ''
  })

  const isEditing = !!editingMember

  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        setFormData({
          name: editingMember.name,
          books_read: String(editingMember.books_read),
          on_shame_list: selectedClub.shame_list.includes(editingMember.id),
          discord_id: editingMember.discord_id ?? ''
        })
      } else {
        setFormData({ name: '', books_read: '0', on_shame_list: false, discord_id: '' })
      }
    }
  }, [isOpen, editingMember])

  const validateForm = (): boolean => {
    if (!formData.name.trim()) { onError('Member name is required'); return false }
    const booksRead = parseInt(formData.books_read)
    if (isNaN(booksRead) || booksRead < 0) { onError('Books read must be a non-negative number'); return false }
    if (formData.discord_id.trim() && !/^\d{17,19}$/.test(formData.discord_id.trim())) {
      onError('Discord ID must be a 17–19 digit number')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      onError('')

      const memberData = {
        name: formData.name.trim(),
        books_read: parseInt(formData.books_read),
        discord_id: formData.discord_id.trim() || null
      }

      if (isEditing && editingMember) {
        const { error } = await invokeFunction('member', {
          method: 'PUT',
          body: { id: editingMember.id, ...memberData }
        })
        if (error) throw error

        if (formData.on_shame_list !== selectedClub.shame_list.includes(editingMember.id)) {
          let newShameList = [...selectedClub.shame_list]
          if (formData.on_shame_list) {
            if (!newShameList.includes(editingMember.id)) newShameList.push(editingMember.id)
          } else {
            newShameList = newShameList.filter(id => id !== editingMember.id)
          }
          const { error: shameError } = await invokeFunction('club', {
            method: 'PUT',
            body: { id: selectedClub.id, server_id: selectedServerData?.id, shame_list: newShameList }
          })
          if (shameError) {
            console.error('Error updating shame list:', shameError)
            onError('Member updated but failed to update shame list status')
          }
        }
      } else {
        const { data, error } = await invokeFunction('member', {
          method: 'POST',
          body: { ...memberData, clubs: [selectedClub.id] }
        })
        if (error) throw error

        const created = (data as { member?: { id: number } }).member
        if (formData.on_shame_list && created) {
          const { error: shameError } = await invokeFunction('club', {
            method: 'PUT',
            body: {
              id: selectedClub.id,
              server_id: selectedServerData?.id,
              shame_list: [...selectedClub.shame_list, created.id]
            }
          })
          if (shameError) {
            console.error('Error adding to shame list:', shameError)
            onError('Member created but failed to add to shame list')
          }
        }
      }

      setFormData({ name: '', books_read: '0', on_shame_list: false, discord_id: '' })
      onClose()
      onMemberSaved()
    } catch (err: unknown) {
      onError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : `Failed to ${isEditing ? 'update' : 'add'} member`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', books_read: '0', on_shame_list: false, discord_id: '' })
    onError('')
    onClose()
  }

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
            disabled={loading || !formData.name.trim()}
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
        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Member Name</label>
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

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Books Read</label>
          <input
            type="number"
            value={formData.books_read}
            onChange={(e) => setFormData(prev => ({ ...prev, books_read: e.target.value }))}
            placeholder="0"
            min="0"
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Discord ID <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <input
            type="text"
            value={formData.discord_id}
            onChange={(e) => setFormData(prev => ({ ...prev, discord_id: e.target.value }))}
            placeholder="e.g., 123456789012345678"
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            disabled={loading}
            maxLength={19}
          />
          <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Discord snowflake ID — leave blank to clear
          </p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}>Shame List</label>
          <div
            className="flex items-center justify-between rounded-input px-4 py-3"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
          >
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">
                {formData.on_shame_list ? 'On shame list' : 'Good standing'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {formData.on_shame_list ? 'Member has fallen behind on reading' : 'Member is up to date'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={formData.on_shame_list}
                onChange={(e) => setFormData(prev => ({ ...prev, on_shame_list: e.target.checked }))}
                className="sr-only peer"
                disabled={loading}
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-primary/20 ${
                formData.on_shame_list ? 'bg-danger' : 'bg-[var(--color-divider)]'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.on_shame_list ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </label>
          </div>
        </div>

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

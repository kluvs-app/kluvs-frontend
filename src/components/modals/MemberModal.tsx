import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import type { Club, Server, Member } from '../../types'

interface MemberModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  selectedServerData: Server | undefined
  onMemberSaved: () => void
  onError: (error: string) => void
  editingMember?: Member | null // If provided, we're editing instead of adding
}

interface MemberFormData {
  name: string
  books_read: string
  on_shame_list: boolean
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
    on_shame_list: false
  })

  const isEditing = !!editingMember

  // Pre-populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        // Edit mode - pre-populate with existing data
        const isOnShameList = selectedClub.shame_list.includes(editingMember.id)
        setFormData({
          name: editingMember.name,
          books_read: String(editingMember.books_read),
          on_shame_list: isOnShameList
        })
      } else {
        // Add mode - reset to defaults
        setFormData({
          name: '',
          books_read: '0',
          on_shame_list: false
        })
      }
    }
  }, [isOpen, editingMember])

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      onError('Member name is required')
      return false
    }

    const booksRead = parseInt(formData.books_read)

    if (isNaN(booksRead) || booksRead < 0) {
      onError('Books read must be a non-negative number')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      onError('') // Clear any existing errors

      const memberData = {
        name: formData.name.trim(),
        books_read: parseInt(formData.books_read)
      }

      if (isEditing && editingMember) {
        // Edit mode - update existing member
        const requestBody = {
          id: editingMember.id,
          ...memberData
        }

        const { error } = await supabase.functions.invoke('member', {
          method: 'PUT',
          body: requestBody
        })

        if (error) throw error

        // Handle shame list update separately for edit mode
        if (formData.on_shame_list !== selectedClub.shame_list.includes(editingMember.id)) {
          let newShameList = [...selectedClub.shame_list]
          if (formData.on_shame_list) {
            // Add to shame list
            if (!newShameList.includes(editingMember.id)) {
              newShameList.push(editingMember.id)
            }
          } else {
            // Remove from shame list
            newShameList = newShameList.filter(id => id !== editingMember.id)
          }

          const { error: shameError } = await supabase.functions.invoke('club', {
            method: 'PUT',
            body: {
              id: selectedClub.id,
              server_id: selectedServerData?.id,
              shame_list: newShameList
            }
          })

          if (shameError) {
            console.error('Error updating shame list:', shameError)
            onError('Member updated but failed to update shame list status')
          }
        }
      } else {
        // Add mode - create new member and add to club
        const requestBody = {
          ...memberData,
          clubs: [selectedClub.id] // Add them to this specific club
        }

        const { data, error } = await supabase.functions.invoke('member', {
          method: 'POST',
          body: requestBody
        })

        if (error) throw error

        // Handle shame list for new member
        if (formData.on_shame_list && data.member) {
          const newShameList = [...selectedClub.shame_list, data.member.id]

          const { error: shameError } = await supabase.functions.invoke('club', {
            method: 'PUT',
            body: {
              id: selectedClub.id,
              server_id: selectedServerData?.id,
              shame_list: newShameList
            }
          })

          if (shameError) {
            console.error('Error adding to shame list:', shameError)
            onError('Member created but failed to add to shame list')
          }
        }
      }

      // Reset form and close modal
      setFormData({ name: '', books_read: '0', on_shame_list: false })
      onClose()

      // Notify parent component of successful save
      onMemberSaved()

    } catch (err: unknown) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} member:`, err)
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
    setFormData({ name: '', books_read: '0', on_shame_list: false })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-member">
      <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] p-6 w-full max-w-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h2 id="modal-title-member" className="text-card-heading text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Member' : 'Add Member'}
              </h2>
              <p className="text-helper text-[var(--color-text-secondary)]">
                {isEditing ? 'Update member details' : 'Add a new member to the club'}
              </p>
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
          {/* Member Name Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Member Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., BookLover42"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Books Read Field */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-2">
              Books Read
            </label>
            <input
              type="number"
              value={formData.books_read}
              onChange={(e) => setFormData(prev => ({ ...prev, books_read: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              disabled={loading}
            />
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              Number of books completed
            </p>
          </div>

          {/* Shame List Toggle - Material 3 Style */}
          <div>
            <label className="block text-[var(--color-text-primary)] font-medium mb-3">
              Shame List Status
            </label>
            <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  formData.on_shame_list
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                }`}>
                </div>
                <div>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {formData.on_shame_list ? 'On Shame List' : 'Good Standing'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-xs">
                    {formData.on_shame_list
                      ? 'Member has fallen behind on reading'
                      : 'Member is up to date with reading'
                    }
                  </p>
                </div>
              </div>

              {/* Material 3 Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.on_shame_list}
                  onChange={(e) => setFormData(prev => ({ ...prev, on_shame_list: e.target.checked }))}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className={`relative w-14 h-8 rounded-full transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 ${
                  formData.on_shame_list
                    ? 'bg-red-500'
                    : 'bg-[var(--color-divider)]'
                } peer-checked:bg-red-500`}>
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-colors flex items-center justify-center ${
                    formData.on_shame_list ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Club Context */}
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-input p-3">
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">
              Club: <span className="text-[var(--color-text-primary)]">{selectedClub.name}</span>
            </p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-1">
              {isEditing ? 'Updating member in' : 'Adding member to'} this club
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
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
              </>
            ) : (
              <span>{isEditing ? 'Update Member' : 'Add Member'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

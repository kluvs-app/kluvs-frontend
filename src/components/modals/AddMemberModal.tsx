import { useState, useEffect, useRef } from 'react'
import { invokeFunction } from '../../supabase'
import type { Club } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import BaseModal from './BaseModal'

interface SearchResult {
  id: number
  name: string
  handle: string | null
  avatar_path: string | null
}

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  selectedClub: Club
  onMemberAdded: () => void
  onError: (error: string) => void
}

export default function AddMemberModal({
  isOpen,
  onClose,
  selectedClub,
  onMemberAdded,
  onError,
}: AddMemberModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const inviteUrl =
    selectedClub.join_policy === 'INVITE_LINK' && selectedClub.invite_token
      ? `${window.location.origin}/join/${selectedClub.invite_token}`
      : null

  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setResults([])
    setSearching(false)
    setAddingId(null)
    setInlineError(null)
    setCopied(false)
  }, [isOpen])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await invokeFunction<{ members: SearchResult[] }>(
        `member?search=${encodeURIComponent(query)}&exclude_club_id=${encodeURIComponent(selectedClub.id)}`,
        { method: 'GET' }
      )
      setSearching(false)
      if (error) {
        setInlineError(error.message)
        return
      }
      setResults(data?.members ?? [])
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selectedClub.id])

  const handleAdd = async (result: SearchResult) => {
    setAddingId(result.id)
    setInlineError(null)
    try {
      const { error } = await invokeFunction('member', {
        method: 'PUT',
        body: { id: result.id, add_to_club: selectedClub.id },
      })
      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('already')) {
          setInlineError('Already a member')
        } else if (msg.includes('forbidden')) {
          setInlineError("You don't have permission to add members")
        } else {
          onError(error.message)
        }
        return
      }
      onMemberAdded()
      onClose()
    } finally {
      setAddingId(null)
    }
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sectionLabelStyle = {
    display: 'block',
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-secondary)',
    marginBottom: 12,
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Member"
      labelId="modal-title-add-member"
    >
      <div className="space-y-6">
        {/* Section 1 — Find a member */}
        <div>
          <p style={sectionLabelStyle}>Find a member</p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a member by name or handle"
            className="w-full bg-[var(--color-input-bg)] border border-[var(--color-input-border)] rounded-input px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            autoFocus
          />

          {inlineError && (
            <p className="mt-2 text-sm text-red-400">{inlineError}</p>
          )}

          <div className="mt-3">
            {searching ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] py-2">
                <KluvsSpinner size={16} />
                <span>Searching…</span>
              </div>
            ) : query.trim() && results.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] py-2">No Kluvs members found</p>
            ) : (
              <div className="space-y-1">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleAdd(r)}
                    disabled={addingId !== null}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-input text-left hover:bg-[rgba(242,237,229,0.05)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#4D4033] flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{r.name}</p>
                      {r.handle && (
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">@{r.handle}</p>
                      )}
                    </div>
                    {addingId === r.id && <KluvsSpinner size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--color-divider)]" />

        {/* Section 2 — Invite link */}
        <div>
          <p style={sectionLabelStyle}>Invite link</p>
          {inviteUrl ? (
            <div
              className="flex items-center gap-3 rounded-input px-4 py-3"
              style={{
                background: 'var(--color-input-bg)',
                border: '1px solid var(--color-input-border)',
              }}
            >
              <p
                className="flex-1 min-w-0 text-sm text-[var(--color-text-secondary)] truncate font-mono"
                title={inviteUrl}
              >
                {inviteUrl}
              </p>
              <button
                onClick={handleCopy}
                className={[
                  'shrink-0 text-sm font-medium transition-colors duration-120',
                  copied ? 'text-[#48A480]' : 'text-primary hover:text-primary-hover',
                ].join(' ')}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Invite link is off — enable it in Share settings.
            </p>
          )}
        </div>
      </div>
    </BaseModal>
  )
}

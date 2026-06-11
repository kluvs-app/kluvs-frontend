import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { ReadingLog, ReadingLogEntry } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import CoverSlot from '../ui/CoverSlot'
import BaseModal from './BaseModal'

interface ReadingLogModalProps {
  isOpen: boolean
  onClose: () => void
}

const LABEL_COLOR = '#C9BDA8'

function LogEntry({ entry }: { entry: ReadingLogEntry }) {
  return (
    <div className="flex gap-4 items-start">
      <CoverSlot imageUrl={entry.book.image_url} width={40} height={56} />
      <div className="flex-1 min-w-0">
        <p style={{
          fontFamily: '"EB Garamond", Georgia, serif',
          fontStyle: 'italic', fontWeight: 500,
          fontSize: 18, lineHeight: 1.15,
          letterSpacing: '-0.008em',
          color: 'var(--color-text-primary)',
          marginBottom: 4,
        }}>{entry.book.title}</p>
        <p style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 13, color: LABEL_COLOR,
          marginBottom: 4,
        }}>{entry.book.author}</p>
        <p style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 11, fontWeight: 500, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--color-text-secondary)',
        }}>{entry.club.name}</p>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span style={{
      display: 'block',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: 'var(--color-text-secondary)',
      marginBottom: 16,
    }}>{label}</span>
  )
}

function EmptyState() {
  return (
    <p style={{
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: 13, color: 'var(--color-text-secondary)',
      fontStyle: 'italic',
    }}>Nothing here yet.</p>
  )
}

export default function ReadingLogModal({ isOpen, onClose }: ReadingLogModalProps) {
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<ReadingLog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    setLoading(true)
    setLog(null)
    setError(null)

    invokeFunction<{ success: boolean; reading_log: ReadingLog }>('session?reading_log=true', { method: 'GET' })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setLog(data?.reading_log ?? { active: [], finished: [] })
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load reading log')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [isOpen])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reading Log"
      maxWidth="md"
      labelId="modal-title-reading-log"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <KluvsSpinner size={24} />
        </div>
      )}

      {!loading && error && (
        <p style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 13, color: 'var(--color-danger)',
          textAlign: 'center', padding: '24px 0',
        }}>{error}</p>
      )}

      {!loading && !error && log && (
        <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-1">
          {/* Currently Reading */}
          <div>
            <SectionLabel label="Currently Reading" />
            {log.active.length === 0
              ? <EmptyState />
              : (
                <div className="space-y-5">
                  {log.active.map(entry => (
                    <LogEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )
            }
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-divider)' }} />

          {/* Read */}
          <div>
            <SectionLabel label="Read" />
            {log.finished.length === 0
              ? <EmptyState />
              : (
                <div className="space-y-5">
                  {log.finished.map(entry => (
                    <LogEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}
    </BaseModal>
  )
}

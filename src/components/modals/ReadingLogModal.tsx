import { useState, useEffect } from 'react'
import { invokeFunction } from '../../supabase'
import type { ReadingLog, ReadingLogEntry, ReadingLogResponse } from '../../types'
import KluvsSpinner from '../KluvsSpinner'
import CoverSlot from '../ui/CoverSlot'
import BaseModal from './BaseModal'

interface ReadingLogModalProps {
  isOpen: boolean
  onClose: () => void
}

function LogEntry({ entry }: { entry: ReadingLogEntry }) {
  return (
    <div className="flex gap-4 items-start">
      <CoverSlot imageUrl={entry.book.image_url} width={40} height={56} />
      <div className="flex-1 min-w-0">
        <p className="t-title-s" style={{ color: 'var(--color-text-primary)',
          marginBottom: 4,
        }}>{entry.book.title}</p>
        <p className="t-body-m" style={{ color: 'var(--color-text-meta)',
          marginBottom: 4,
        }}>{entry.book.author}</p>
        <p className="t-eyebrow" style={{
          color: 'var(--color-text-secondary)',
        }}>{entry.club.name}</p>
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="t-eyebrow" style={{
      display: 'block',
      color: 'var(--color-text-secondary)',
      marginBottom: 16,
    }}>{label}</span>
  )
}

function EmptyState() {
  return (
    <p className="t-caption t-feature" style={{ color: 'var(--color-text-secondary)',
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

    invokeFunction<ReadingLogResponse>('session?reading_log=true', { method: 'GET' })
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
        <p className="t-caption" style={{ color: 'var(--color-danger)',
          textAlign: 'center', padding: '24px 0',
        }}>{error}</p>
      )}

      {!loading && !error && log && (
        <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-1">
          {/* Currently Reading */}
          <div>
            <SectionLabel label="Currently Reading" />
            {!log.active.length
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
            {!log.finished.length
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

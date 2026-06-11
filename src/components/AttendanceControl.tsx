import { useState, useEffect } from 'react'
import { invokeFunction } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Discussion, AttendanceRoster } from '../types'

interface AttendanceControlProps {
  discussion: Discussion
  disabled?: boolean
}

type Status = 'yes' | 'no' | 'maybe'

const SEGMENTS: Array<{ value: Status; icon: React.ReactNode; pressedClass: string }> = [
  {
    value: 'yes',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    pressedClass: 'bg-green-500/20 text-green-500 dark:bg-green-500/15 dark:text-green-400',
  },
  {
    value: 'maybe',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    pressedClass: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
  },
  {
    value: 'no',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    pressedClass: 'bg-red-500/20 text-red-500 dark:bg-red-500/15 dark:text-red-400',
  },
]

export default function AttendanceControl({ discussion, disabled = false }: AttendanceControlProps) {
  const { member } = useAuth()
  const [roster, setRoster] = useState<AttendanceRoster | null>(null)

  useEffect(() => {
    let cancelled = false

    invokeFunction<AttendanceRoster>(
      `discussion-attendance?discussion_id=${encodeURIComponent(discussion.id)}`,
      { method: 'GET' }
    )
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) throw error
        setRoster(data ?? null)
      })
      .catch(() => {
        if (cancelled) return
        setRoster(null)
      })

    return () => { cancelled = true }
  }, [discussion.id])

  const handleClick = async (status: Status) => {
    if (disabled || !roster || !member) return

    const isClearing = roster.my_status === status
    const previous = roster
    const newStatus = isClearing ? null : status

    // Keep responses in sync so counts update immediately
    let updatedResponses = [...roster.responses]
    if (isClearing) {
      updatedResponses = updatedResponses.filter(r => r.member_id !== member.id)
    } else if (roster.my_status !== null) {
      updatedResponses = updatedResponses.map(r =>
        r.member_id === member.id ? { ...r, status } : r
      )
    } else {
      updatedResponses = [...updatedResponses, { member_id: member.id, name: member.name, status }]
    }

    setRoster({ ...roster, my_status: newStatus, responses: updatedResponses })

    if (isClearing) {
      const { error } = await invokeFunction(
        `discussion-attendance?discussion_id=${encodeURIComponent(discussion.id)}`,
        { method: 'DELETE' }
      )
      if (error) setRoster(previous)
    } else {
      const { error } = await invokeFunction('discussion-attendance', {
        method: 'POST',
        body: { discussion_id: discussion.id, status },
      })
      if (error) setRoster(previous)
    }
  }

  if (!roster) return null

  const counts = SEGMENTS.reduce<Record<Status, number>>(
    (acc, { value }) => {
      acc[value] = roster.responses.filter(r => r.status === value).length
      return acc
    },
    { yes: 0, no: 0, maybe: 0 }
  )

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Segmented pill */}
      <div className="inline-flex items-stretch border border-[var(--color-divider)] rounded-full overflow-hidden">
        {SEGMENTS.map(({ value, icon, pressedClass }, i) => {
          const isSelected = roster.my_status === value
          return (
            <button
              key={value}
              onClick={() => handleClick(value)}
              disabled={disabled}
              aria-label={`RSVP ${value}`}
              aria-pressed={isSelected}
              title={value.charAt(0).toUpperCase() + value.slice(1)}
              className={[
                'flex items-center justify-center w-7 h-7 transition-colors duration-150',
                isSelected
                  ? pressedClass
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                i > 0 ? 'border-l border-[var(--color-divider)]' : '',
                disabled ? 'cursor-not-allowed opacity-70' : '',
              ].join(' ')}
            >
              {icon}
            </button>
          )
        })}
      </div>

      {/* Stats row */}
      <p className="text-[11px] text-[var(--color-text-meta)] tabular-nums">
        {counts.yes} yes &middot; {counts.no} no &middot; {counts.maybe} maybe
      </p>
    </div>
  )
}

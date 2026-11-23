import { parseScheduledAt, isPast } from '../utils/dates'
import type { Club, Discussion } from '../types'
import KebabMenu from './ui/KebabMenu'
import AttendanceControl from './AttendanceControl'
import Button from './ui/Button'

interface DiscussionsTimelineProps {
  selectedClub: Club
  isAdmin: boolean
  onAddDiscussion: () => void
  onEditDiscussion?: (discussion: Discussion) => void
  onDeleteDiscussion?: (discussion: Discussion) => void
  onOpenNote?: (discussion: Discussion) => void
  onStartSession?: () => void
}

export default function DiscussionsTimeline({
  selectedClub,
  isAdmin,
  onAddDiscussion,
  onEditDiscussion,
  onDeleteDiscussion,
  onOpenNote,
  onStartSession,
}: DiscussionsTimelineProps) {
  const sortedDiscussions = selectedClub.active_session
    ? [...selectedClub.active_session.discussions].sort(
        (a, b) => parseScheduledAt(a.scheduled_at).getTime() - parseScheduledAt(b.scheduled_at).getTime()
      )
    : []

  const formatTime = (scheduledAt: string) => {
    return parseScheduledAt(scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatus = (discussion: Discussion): 'past' | 'next' | 'upcoming' => {
    if (isPast(discussion.scheduled_at)) return 'past'
    const nextIdx = sortedDiscussions.findIndex(d => !isPast(d.scheduled_at))
    const isNext = nextIdx >= 0 && sortedDiscussions[nextIdx]?.id === discussion.id
    return isNext ? 'next' : 'upcoming'
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 lg:mb-9">
        <div className="flex items-center gap-3">
          <span className="t-eyebrow hidden lg:inline text-[var(--color-text-secondary)]">
            DISCUSSIONS
          </span>
          {selectedClub.active_session && sortedDiscussions.length > 0 && (
            <span className="t-title-s t-feature text-[var(--color-text-secondary)]">
              {sortedDiscussions.length} scheduled
            </span>
          )}
        </div>
        {isAdmin && selectedClub.active_session && (
          <Button variant="outlined" onClick={onAddDiscussion}>
            <span aria-hidden>+</span>
Add
          </Button>
        )}
      </div>

      {/* Empty states */}
      {!selectedClub.active_session ? (
        <div className="flex flex-col items-center text-center py-6">
          <p className="t-title-l t-feature text-[var(--color-text-secondary)] mb-4">
            {isAdmin
              ? 'Start a session first to schedule discussions.'
              : 'Discussions will appear here once a session begins.'}
          </p>
          {isAdmin && onStartSession && (
            <Button
              variant="primary"
              onClick={onStartSession}
            >
              Start Session
            </Button>
          )}
        </div>
      ) : sortedDiscussions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-6">
          <p className="t-title-l t-feature text-[var(--color-text-secondary)] mb-5">
            No discussions scheduled yet.
          </p>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={onAddDiscussion}
            >
              Schedule Discussion
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5 lg:space-y-7">
          {sortedDiscussions.map((discussion, idx) => {
            const status = getStatus(discussion)
            const isLast = idx === sortedDiscussions.length - 1

            return (
              <div
                key={discussion.id}
                className={[
                  'grid grid-cols-[54px_16px_1fr] gap-3 lg:grid-cols-[76px_24px_1fr] lg:gap-6',
                  status === 'past' && 'opacity-50',
                ].join(' ')}
              >
                {/* Date column */}
                <div className="text-right pr-1 lg:pr-3.5">
                  <p className={[
                    't-mono',
                    status === 'next' ? 'text-primary' : 'text-[var(--color-text-secondary)]',
                  ].join(' ')}>
                    {parseScheduledAt(discussion.scheduled_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="t-fine-print text-[var(--color-text-secondary)] mt-0.5 lg:mt-1 opacity-70 lg:opacity-80">
                    {parseScheduledAt(discussion.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
                  </p>
                </div>

                {/* Rail column */}
                <div className="relative flex justify-center pt-2 lg:pt-0">
                  <div className="relative z-10 lg:mt-1">
                    {status === 'past' && (
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[var(--color-text-disabled)]" />
                    )}
                    {status === 'next' && (
                      <div
                        className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-primary"
                        style={{ boxShadow: '0 0 0 4px rgba(209,109,48,0.10)' }}
                      />
                    )}
                    {status === 'upcoming' && (
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-divider)] lg:border-[1.5px]" />
                    )}
                  </div>

                  {/* Rail line */}
                  {!isLast && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-px bg-[var(--color-divider)]"
                      style={{ top: '12px', bottom: '-28px', height: 'calc(100% + 28px)' }}
                    />
                  )}
                </div>

                {/* Content column */}
                <div className="flex items-start justify-between gap-2 lg:gap-4 pt-0.5">
                  <div className="flex-1 min-w-0">
                    {status === 'next' && (
                      <p className="t-eyebrow text-primary mb-1">
                        UP NEXT
                      </p>
                    )}
                    <p className={[
                      't-feature text-[var(--color-text-primary)]',
                      status === 'next' ? 't-title-l' : 't-title-m lg:t-title-l',
                    ].join(' ')}>
                      {discussion.title}
                    </p>
                    {discussion.location && (
                      <p className="t-caption text-[var(--color-text-secondary)] mt-1">
                        {discussion.location}
                      </p>
                    )}
                    <p className="t-caption flex items-center gap-1.5 text-[var(--color-text-secondary)] mt-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {formatTime(discussion.scheduled_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {onOpenNote && (
                        <button
                          onClick={() => onOpenNote(discussion)}
                          disabled={status === 'past'}
                          aria-label="Food for thought note"
                          title="Food for thought"
                          className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--color-text-secondary)]"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                          </svg>
                        </button>
                      )}
                      {isAdmin && (
                        <KebabMenu
                          items={[
                            {
                              label: 'Edit',
                              onClick: () => onEditDiscussion?.(discussion),
                            },
                            {
                              label: 'Delete',
                              danger: true,
                              onClick: () => onDeleteDiscussion?.(discussion),
                            },
                          ]}
                        />
                      )}
                    </div>
                    <AttendanceControl discussion={discussion} disabled={status === 'past'} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

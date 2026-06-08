import { parseLocalDate, isPast } from '../utils/dates'
import type { Club, Discussion } from '../types'
import KebabMenu from './ui/KebabMenu'
import GhostButton from './ui/GhostButton'

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
        (a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
      )
    : []

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const getStatus = (discussion: Discussion): 'past' | 'next' | 'upcoming' => {
    if (isPast(discussion.date, discussion.time)) return 'past'
    const nextIdx = sortedDiscussions.findIndex(d => !isPast(d.date, d.time))
    const isNext = nextIdx >= 0 && sortedDiscussions[nextIdx]?.id === discussion.id
    return isNext ? 'next' : 'upcoming'
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 lg:mb-9">
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
            DISCUSSIONS
          </span>
          {selectedClub.active_session && sortedDiscussions.length > 0 && (
            <span className="font-serif italic text-[16px] text-[var(--color-text-secondary)]">
              {sortedDiscussions.length} scheduled
            </span>
          )}
        </div>
        {isAdmin && selectedClub.active_session && (
          <GhostButton variant="sm" icon="+" onClick={onAddDiscussion}>
            Add
          </GhostButton>
        )}
      </div>

      {/* Empty states */}
      {!selectedClub.active_session ? (
        <div className="flex flex-col items-center text-center py-6">
          <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug mb-4">
            {isAdmin
              ? 'Start a session first to schedule discussions.'
              : 'Discussions will appear here once a session begins.'}
          </p>
          {isAdmin && onStartSession && (
            <button
              onClick={onStartSession}
              className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
            >
              Start Session
            </button>
          )}
        </div>
      ) : sortedDiscussions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-6">
          <p className="font-serif italic text-[22px] font-medium text-[var(--color-text-secondary)] leading-snug mb-5">
            No discussions scheduled yet.
          </p>
          {isAdmin && (
            <button
              onClick={onAddDiscussion}
              className="bg-primary hover:bg-primary-hover active:scale-[0.97] text-white px-5 py-2 rounded-btn text-[13px] font-medium transition-all duration-120 cursor-pointer"
            >
              Schedule Discussion
            </button>
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
                    'font-medium font-mono tracking-[0.02em] text-[13px] lg:text-[12px]',
                    status === 'next' ? 'text-primary' : 'text-[var(--color-text-secondary)]',
                  ].join(' ')}>
                    {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] lg:text-[11px] text-[var(--color-text-secondary)] mt-0.5 lg:mt-1 opacity-70 lg:opacity-80">
                    {parseLocalDate(discussion.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
                  </p>
                </div>

                {/* Rail column */}
                <div className="relative flex justify-center pt-2 lg:pt-0">
                  <div className="relative z-10 lg:mt-1">
                    {status === 'past' && (
                      <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#4D4033]" />
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
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary mb-1">
                        UP NEXT
                      </p>
                    )}
                    <p className={[
                      'font-serif font-medium text-[var(--color-text-primary)]',
                      status === 'next' ? 'text-[22px] lg:text-[24px]' : 'text-[18px] lg:text-[24px]',
                    ].join(' ')}>
                      {discussion.title}
                    </p>
                    {discussion.location && (
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
                        {discussion.location}
                      </p>
                    )}
                    {discussion.time && (
                      <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] mt-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {formatTime(discussion.time)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onOpenNote && (
                      <button
                        onClick={() => onOpenNote(discussion)}
                        aria-label="Food for thought note"
                        title="Food for thought"
                        className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

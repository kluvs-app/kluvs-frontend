import { useEffect, useRef } from 'react'
import type { Club, Discussion } from '../types'

interface DiscussionsTimelineProps {
  selectedClub: Club
  isAdmin: boolean
  onAddDiscussion: () => void
  onEditDiscussion?: (discussion: Discussion) => void
  onDeleteDiscussion?: (discussion: Discussion) => void
}

export default function DiscussionsTimeline({
  selectedClub,
  isAdmin,
  onAddDiscussion,
  onEditDiscussion,
  onDeleteDiscussion
}: DiscussionsTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const now = new Date()

  const sortedDiscussions = selectedClub.active_session
    ? [...selectedClub.active_session.discussions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    : []

  const isPastDiscussion = (date: string) => new Date(date) < now

  const nextDiscussionIndex = sortedDiscussions.findIndex(
    discussion => !isPastDiscussion(discussion.date)
  )

  useEffect(() => {
    if (scrollContainerRef.current && nextDiscussionIndex >= 0) {
      const container = scrollContainerRef.current
      const discussionCards = container.querySelectorAll('.discussion-card')
      const targetCard = discussionCards[nextDiscussionIndex] as HTMLElement
      if (targetCard) {
        const containerWidth = container.offsetWidth
        const cardLeft = targetCard.offsetLeft
        const cardWidth = targetCard.offsetWidth
        container.scrollTo({
          left: Math.max(0, cardLeft - (containerWidth / 2) + (cardWidth / 2)),
          behavior: 'smooth'
        })
      }
    }
  }, [nextDiscussionIndex, sortedDiscussions.length])

  if (!selectedClub.active_session) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      full: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' at ' +
            date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
  }

  return (
    <>
      {/* Section heading */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-section-heading text-[var(--color-text-primary)]">Discussion Timeline</h3>
        {isAdmin && (
          <button
            onClick={onAddDiscussion}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
          >
            Add Discussion
          </button>
        )}
      </div>

      {sortedDiscussions.length === 0 ? (
        <p className="text-body text-[var(--color-text-secondary)] italic">No discussions scheduled</p>
      ) : (
        <>
          {/* Mobile: vertical timeline */}
          <div className="lg:hidden relative pl-10">
            {/* Vertical copper connector line */}
            <div
              className="absolute top-[14px] bottom-[14px] w-[1.5px]"
              style={{ left: '14px', background: 'rgba(209,110,48,0.50)' }}
            />

            {sortedDiscussions.map((discussion, index) => {
              const isPast = isPastDiscussion(discussion.date)
              const isNext = index === nextDiscussionIndex
              const dateInfo = formatDate(discussion.date)

              return (
                <div key={discussion.id} className="group relative mb-6 last:mb-0">
                  {/* 28px copper circle node */}
                  <div
                    className="absolute flex items-center justify-center w-7 h-7 rounded-full"
                    style={{
                      left: '-40px',
                      top: '14px',
                      background: isPast
                        ? '#B85A22'
                        : isNext
                        ? '#D16D30'
                        : 'var(--color-bg-elevated)',
                      border: (!isPast && !isNext) ? '1px solid var(--color-divider)' : 'none',
                      boxShadow: isNext ? '0 0 0 3px rgba(209,110,48,0.25)' : 'none'
                    }}
                  >
                    {(isPast || isNext) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex items-start justify-between gap-2 rounded-card px-2 py-2 -mx-2 -my-2 transition-colors group-hover:bg-[var(--color-bg-raised)] ${isPast ? 'opacity-70' : ''}`}>
                    <div className="min-w-0">
                      <h4 className={`font-semibold leading-snug ${
                        isPast ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {discussion.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                        {discussion.location && (
                          <>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span>{discussion.location}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>{dateInfo.full}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => onEditDiscussion?.(discussion)}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors"
                          aria-label={`Edit ${discussion.title}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteDiscussion?.(discussion)}
                          className="text-danger hover:text-danger-hover p-1 rounded transition-colors"
                          aria-label={`Delete ${discussion.title}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: horizontal scroll cards */}
          <div className="hidden lg:block relative pb-4 pt-6">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-6 px-4 pt-4"
              style={{
                scrollSnapType: 'x mandatory',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              {sortedDiscussions.map((discussion, index) => {
                const isPast = isPastDiscussion(discussion.date)
                const isNext = index === nextDiscussionIndex

                return (
                  <div
                    key={discussion.id}
                    className="discussion-card flex-shrink-0 w-64 relative"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className={`group rounded-card p-4 border transition-all relative hover:-translate-y-0.5 hover:shadow-md ${
                      isPast
                        ? 'bg-[var(--color-bg-elevated)] border-[var(--color-divider)] opacity-60'
                        : isNext
                        ? 'bg-primary/5 border-primary/30 border-l-4 border-l-primary hover:border-primary/60'
                        : 'bg-[var(--color-bg)] border-[var(--color-divider)] hover:border-primary/30 hover:bg-[var(--color-bg-raised)]'
                    }`}>

                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditDiscussion?.(discussion) }}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded transition-colors"
                            aria-label={`Edit ${discussion.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteDiscussion?.(discussion) }}
                            className="text-danger hover:text-danger-hover p-1.5 rounded transition-colors"
                            aria-label={`Delete ${discussion.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className={`inline-flex items-center px-2 py-1 rounded text-helper-sm font-semibold mb-3 ${
                        isPast ? 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                          : isNext ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        {isPast ? 'Completed' : isNext ? 'Next Up' : 'Upcoming'}
                      </div>

                      <div className="text-helper font-medium mb-2 text-[var(--color-text-secondary)]">
                        {new Date(discussion.date).toLocaleDateString()}
                      </div>

                      <h4 className={`font-semibold mb-3 text-body leading-tight ${
                        isPast ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {discussion.title}
                      </h4>

                      <div className="flex items-center text-helper text-[var(--color-text-secondary)]">
                        <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="truncate">{discussion.location || 'Location TBD'}</span>
                      </div>

                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className={`w-3 h-3 rounded-full border-2 ${
                          isPast
                            ? 'bg-[var(--color-text-secondary)] border-[var(--color-divider)]'
                            : isNext
                            ? 'bg-primary border-primary animate-pulse'
                            : 'bg-tertiary border-tertiary'
                        }`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[var(--color-divider)]" />
          </div>
        </>
      )}
    </>
  )
}

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

  // Sort discussions chronologically (handle null active_session)
  const sortedDiscussions = selectedClub.active_session
    ? [...selectedClub.active_session.discussions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    : []

  // Helper function to determine if discussion is in the past
  const isPastDiscussion = (date: string) => new Date(date) < now

  // Find next upcoming discussion
  const nextDiscussionIndex = sortedDiscussions.findIndex(
    discussion => !isPastDiscussion(discussion.date)
  )

  // Auto-scroll to next discussion on load
  useEffect(() => {
    if (scrollContainerRef.current && nextDiscussionIndex >= 0) {
      const container = scrollContainerRef.current
      const discussionCards = container.querySelectorAll('.discussion-card')
      const targetCard = discussionCards[nextDiscussionIndex] as HTMLElement

      if (targetCard) {
        const containerWidth = container.offsetWidth
        const cardLeft = targetCard.offsetLeft
        const cardWidth = targetCard.offsetWidth
        const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2)

        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        })
      }
    }
  }, [nextDiscussionIndex, sortedDiscussions.length])

  // Don't show timeline if no active session
  if (!selectedClub.active_session) {
    return null
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate(),
      year: date.getFullYear(),
      full: date.toLocaleDateString()
    }
  }

  return (
    <div className="bg-[var(--color-bg-raised)] rounded-card border border-[var(--color-divider)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-divider)]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-section-heading text-[var(--color-text-primary)] flex items-center">
              <svg className="w-5 h-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Discussion Timeline ({sortedDiscussions.length})
            </h3>
            <p className="text-helper text-[var(--color-text-secondary)] mt-1">Reading session discussions & events</p>
          </div>

          {/* Action Button Area - Top Right */}
          {isAdmin && (
            <div className="hidden md:flex">
              <button
                onClick={onAddDiscussion}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-btn text-sm font-medium transition-colors"
              >
                Add Discussion
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-6 lg:pb-8 lg:pt-8">
        {sortedDiscussions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-[var(--color-text-primary)] font-medium">No discussions scheduled</p>
            <p className="text-[var(--color-text-secondary)] text-helper mt-1">Add your first discussion to get started!</p>
          </div>
        ) : (
          <>
            {/* Mobile: vertical list */}
            <div className="lg:hidden">
              {sortedDiscussions.map((discussion, index) => {
                const isPast = isPastDiscussion(discussion.date)
                const isNext = index === nextDiscussionIndex
                const dateInfo = formatDate(discussion.date)

                return (
                  <div key={discussion.id} className="flex gap-3">
                    {/* Timeline indicator column */}
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isPast
                          ? 'bg-secondary/20 text-secondary'
                          : isNext
                          ? 'bg-primary text-white'
                          : 'bg-[var(--color-bg-elevated)] border-2 border-[var(--color-divider)]'
                      }`}>
                        {isPast && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      {index < sortedDiscussions.length - 1 && (
                        <div className="w-px flex-1 bg-[var(--color-divider)] my-1" style={{ minHeight: '1.5rem' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-5 flex-1 min-w-0 ${isPast ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className={`font-medium leading-snug ${
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
                  </div>
                )
              })}
            </div>

            {/* Desktop: horizontal scroll */}
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
                  const dateInfo = formatDate(discussion.date)
                  const isNext = index === nextDiscussionIndex

                  return (
                    <div
                      key={discussion.id}
                      className="discussion-card flex-shrink-0 w-64 relative"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      <div className={`group rounded-card p-4 border transition-colors relative ${
                        isPast
                          ? 'bg-[var(--color-bg-elevated)] border-[var(--color-divider)] opacity-60'
                          : isNext
                          ? 'bg-primary/5 border-primary/30 border-l-4 border-l-primary'
                          : 'bg-[var(--color-bg)] border-[var(--color-divider)] hover:border-primary/30'
                      }`}>

                        {isAdmin && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditDiscussion?.(discussion) }}
                              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded transition-colors"
                              title="Edit discussion"
                              aria-label={`Edit ${discussion.title}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteDiscussion?.(discussion) }}
                              className="text-danger hover:text-danger-hover p-1.5 rounded transition-colors"
                              title="Delete discussion"
                              aria-label={`Delete ${discussion.title}`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <div className={`inline-flex items-center px-2 py-1 rounded text-helper-sm font-semibold mb-3 ${
                          isPast
                            ? 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
                            : isNext
                            ? 'bg-primary/10 text-primary'
                            : 'bg-tertiary/10 text-tertiary'
                        }`}>
                          {isPast ? 'Completed' : isNext ? 'Next Up' : 'Upcoming'}
                        </div>

                        <div className="text-helper font-medium mb-2 text-[var(--color-text-secondary)]">
                          {dateInfo.full}
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
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Timeline base line */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-[var(--color-divider)]"></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

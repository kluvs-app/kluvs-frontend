import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { invokeFunction, getAvatarUrl } from '../supabase'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../contexts/AuthContext'
import type { Club, ReadingProgress } from '../types'
import ProgressRow from '../components/ProgressRow'
import EditProfileModal from '../components/modals/EditProfileModal'
import SignOutModal from '../components/modals/SignOutModal'
import ReadingLogModal from '../components/modals/ReadingLogModal'
import DiscussionNoteModal from '../components/modals/DiscussionNoteModal'
import AttendanceControl from '../components/AttendanceControl'
import KebabMenu from '../components/ui/KebabMenu'
import { isPast, parseScheduledAt } from '../utils/dates'
import DiscordIcon from '../components/icons/DiscordIcon'

// ─── Helpers ─────────────────────────────────────────────────────────────────


function formatUpNextDate(scheduledAt: string): string {
  return parseScheduledAt(scheduledAt)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(', ', ' · ')
    .toUpperCase()
}

function formatNextDate(scheduledAt: string): string {
  return parseScheduledAt(scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Warm-dark hairline and button border — design tokens not in CSS vars
const HAIRLINE = 'rgba(242,237,229,0.08)'
const LABEL_COLOR = '#C9BDA8'
const TRACK_COLOR = '#332B24'
const COPPER = '#D16D30'
const MUTED = '#8C8073'

// ─── CoverSlot ────────────────────────────────────────────────────────────────

function CoverSlot({ url, w, h }: { url?: string | null; w: number; h: number }) {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !url || failed
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 2, flexShrink: 0, overflow: 'hidden',
        boxShadow: '0 3px 8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.02)',
        background: showPlaceholder
          ? 'repeating-linear-gradient(135deg, #241C17 0, #241C17 5px, #332B24 5px, #332B24 10px)'
          : undefined,
        position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {!showPlaceholder && (
        <img
          src={url!} alt=""
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {showPlaceholder && (
        <span style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
          fontSize: w >= 50 ? 8 : 7, color: MUTED,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          paddingBottom: 6, opacity: 0.7, position: 'relative', zIndex: 1,
        }}>cover</span>
      )}
    </div>
  )
}

// ─── AvatarStack ──────────────────────────────────────────────────────────────

function AvatarStack({ members, totalCount, currentMemberId }: {
  members: Array<{ id?: number | string | null; name?: string | null; avatar_path?: string | null }>;
  totalCount: number;
  currentMemberId?: number;
}) {
  const shown = members.slice(0, 3)
  const extra = totalCount - shown.length
  return (
    <div className="flex shrink-0">
      {shown.map((m, i) => (
        <div
          key={i}
          className="relative shrink-0"
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}
        >
          <Avatar
            name={m.name ?? '?'}
            userId={String(m.id ?? 0)}
            imageUrl={m.avatar_path ? getAvatarUrl(m.avatar_path) : null}
            isOwn={m.id === currentMemberId}
            size="md"
            className="ring-2 ring-[var(--color-bg-elevated)]"
          />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ring-2 ring-[var(--color-bg-elevated)]"
          style={{ marginLeft: -8, background: TRACK_COLOR, color: LABEL_COLOR }}
        >+{extra}</div>
      )}
    </div>
  )
}

// ─── RoleEyebrow ─────────────────────────────────────────────────────────────

function RoleEyebrow({ role }: { role: string }) {
  const r = role.toLowerCase()
  const dotColor = r === 'owner' ? '#C9900A' : r === 'admin' ? '#006781' : null
  const textColor = r === 'owner' ? '#C9900A' : r === 'admin' ? '#7BA8B8' : 'rgba(201,189,168,0.7)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
      {dotColor && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      )}
      <span style={{
        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: textColor,
      }}>{capitalize(role)}</span>
    </span>
  )
}

// ─── ShelfRow ─────────────────────────────────────────────────────────────────

function ShelfRow({ title, author, coverUrl, clubName, done, total, nextDate }: {
  title: string; author: string; coverUrl?: string | null;
  clubName: string; done: number; total: number; nextDate: string | null;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex gap-[22px]">
      {/* Mobile cover (44×60) */}
      <div className="md:hidden shrink-0">
        <CoverSlot url={coverUrl} w={44} h={60} />
      </div>
      {/* Desktop cover (52×72) */}
      <div className="hidden md:block shrink-0">
        <CoverSlot url={coverUrl} w={52} h={72} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-4 mb-1">
          <p style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontStyle: 'italic', fontWeight: 500,
            lineHeight: 1.1, letterSpacing: '-0.008em',
            color: 'var(--color-text-primary)',
          }} className="text-[22px] md:text-[28px]">{title}</p>
          <span style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            flexShrink: 0,
          }}>{clubName}</span>
        </div>

        <p style={{
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontSize: 14, color: LABEL_COLOR, marginBottom: 18,
        }}>{author}</p>

        {total > 0 && (
          <div className="flex items-center gap-4 mb-3.5">
            <div style={{ flex: 1, height: 3, background: TRACK_COLOR, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: COPPER, borderRadius: 2 }} />
            </div>
            <span style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 13, color: LABEL_COLOR, flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>{done} of {total}</span>
          </div>
        )}

        {nextDate && (
          <span style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 10, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: COPPER,
          }}>Next · {nextDate}</span>
        )}
      </div>
    </div>
  )
}

// ─── ClubCard ─────────────────────────────────────────────────────────────────

function ClubCard({ id, name, role, members, memberCount, currentMemberId }: {
  id: string; name: string; role: string;
  members: Array<{ id?: number | string | null; name?: string | null; avatar_path?: string | null }>;
  memberCount: number;
  currentMemberId?: number;
}) {
  return (
    <Link
      to={`/clubs/${id}`}
      className="block"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="hover:brightness-110 active:scale-[0.98] active:brightness-105"
        style={{
          background: 'var(--color-bg-elevated)',
          borderRadius: 10, padding: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: 16,
          transition: 'filter 120ms, transform 80ms',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <p style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontWeight: 500, fontSize: 22,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.008em',
            minWidth: 0, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name}</p>
          <RoleEyebrow role={role} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AvatarStack members={members} totalCount={memberCount} currentMemberId={currentMemberId} />
          <span style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 13, color: 'var(--color-text-secondary)',
            letterSpacing: '0.01em',
          }}>{memberCount} members</span>
        </div>
      </div>
    </Link>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { member, refreshMemberData } = useAuth()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [shelfProgress, setShelfProgress] = useState<ReadingProgress[]>([])
  const [shelfProgressLoading, setShelfProgressLoading] = useState(true)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showReadingLogModal, setShowReadingLogModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)

  useEffect(() => {
    if (!member?.clubs.length) { setLoading(false); return }
    Promise.all(
      member.clubs.map(c => {
        const params = new URLSearchParams({ id: c.id })
        if (c.server_id) params.append('server_id', c.server_id)
        return invokeFunction<Club>(`club?${params}`, { method: 'GET' })
      })
    )
      .then(results => setClubs(results.flatMap(r => r.data ? [r.data] : [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [member])

  // Personal (non-session) reading-shelf progress
  useEffect(() => {
    if (!member) { setShelfProgressLoading(false); return }
    invokeFunction<ReadingProgress[]>('progress', { method: 'GET' })
      .then(({ data }) => setShelfProgress((data ?? []).filter(p => !p.session_id)))
      .catch(() => {})
      .finally(() => setShelfProgressLoading(false))
  }, [member])

  const memberSince = member?.created_at
    ? new Date(member.created_at).getUTCFullYear()
    : null

  // Next upcoming discussion across all clubs, with book context
  const nextDiscussion = clubs
    .flatMap(c =>
      (c.active_session?.discussions ?? []).map(d => ({
        ...d,
        clubName: c.name,
        book: c.active_session!.book,
      }))
    )
    .filter(d => !isPast(d.scheduled_at))
    .sort((a, b) => parseScheduledAt(a.scheduled_at).getTime() - parseScheduledAt(b.scheduled_at).getTime())[0] ?? null

  // Active readings with progress + next date per book
  const shelfItems = clubs
    .filter(c => c.active_session)
    .map(c => {
      const session = c.active_session!
      const total = session.discussions.length
      const done = session.discussions.filter(d => isPast(d.scheduled_at)).length
      const nextDisc = session.discussions
        .filter(d => !isPast(d.scheduled_at))
        .sort((a, b) => parseScheduledAt(a.scheduled_at).getTime() - parseScheduledAt(b.scheduled_at).getTime())[0]
      return {
        book: session.book,
        clubName: c.name,
        done, total,
        nextDate: nextDisc ? formatNextDate(nextDisc.scheduled_at) : null,
      }
    })

  // Clubs sidebar: always driven by member.clubs (complete list from auth),
  // enriched with full club data (members) when the fetch succeeded.
  const clubItems = (member?.clubs ?? []).map(mc => {
    const full = clubs.find(c => c.id === mc.id)
    return {
      id: mc.id,
      name: mc.name,
      role: mc.role,
      members: full?.members ?? [],
      memberCount: full?.members?.length ?? 0,
    }
  })

  const handle = member?.handle
    ? (member.handle.startsWith('@') ? member.handle : `@${member.handle}`)
    : null

  const nextDiscDate = nextDiscussion ? formatUpNextDate(nextDiscussion.scheduled_at) : null

  const desktopStats = [
    { num: member?.clubs.length ?? 0, label: 'Active clubs' },
    { num: member?.books_read ?? 0, label: 'Books read' },
    ...(memberSince ? [{ num: memberSince, label: 'Reading with Kluvs since' }] : []),
  ]

  const mobileStats = [
    { num: member?.clubs.length ?? 0, label: 'Clubs' },
    { num: member?.books_read ?? 0, label: 'Books' },
    ...(memberSince ? [{ num: memberSince, label: 'Since' }] : []),
  ]

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-14 md:px-14 md:py-12 md:pb-16">

      {/* ─── Hero band ─────────────────────────────────────────────────────── */}

      {/* Mobile hero */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-6">
          <span style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
          }}>Profile</span>
          <KebabMenu
            items={[
              { label: 'Edit Profile', onClick: () => setShowEditProfileModal(true) },
              { label: 'Reading Log', onClick: () => setShowReadingLogModal(true) },
              { label: 'Sign out', danger: true, onClick: () => setShowSignOutModal(true) },
            ]}
          />
        </div>
        <div className="flex items-center gap-[18px] mb-7">
          <Avatar
            name={member?.name ?? '?'}
            userId={String(member?.id ?? 0)}
            imageUrl={member?.avatar_path ? getAvatarUrl(member.avatar_path) : null}
            size="xl"
            isOwn
            className="shrink-0"
          />
          <div className="min-w-0">
            <p style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontWeight: 500, fontSize: 32, lineHeight: 1.05,
              letterSpacing: '-0.015em', color: 'var(--color-text-primary)',
            }}>{member?.name ?? 'User'}</p>
            {handle && (
              <p style={{
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 5,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {handle}
                {member?.discord_id && (
                  <DiscordIcon className="w-[13px] h-[13px] shrink-0 text-[#5865F2]" />
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop hero */}
      <div
        className="hidden md:flex items-center gap-7 pb-9"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <Avatar
          name={member?.name ?? '?'}
          userId={String(member?.id ?? 0)}
          imageUrl={member?.avatar_path ? getAvatarUrl(member.avatar_path) : null}
          size="2xl"
          isOwn
          className="shrink-0"
        />

        <div className="flex-1 min-w-0">
          <span style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 12,
          }}>Profile</span>
          <p style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontWeight: 500, fontSize: 56, lineHeight: 1,
            letterSpacing: '-0.02em', color: 'var(--color-text-primary)',
          }}>{member?.name ?? 'User'}</p>
          {handle && (
            <p style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 15, color: 'var(--color-text-secondary)', marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {handle}
              {member?.discord_id && (
                <DiscordIcon className="w-[14px] h-[14px] shrink-0 text-[#5865F2]" />
              )}
            </p>
          )}
        </div>

        <KebabMenu
          items={[
            { label: 'Edit Profile', onClick: () => setShowEditProfileModal(true) },
            { label: 'Reading Log', onClick: () => setShowReadingLogModal(true) },
          ]}
        />
      </div>

      {/* ─── Stats strip ───────────────────────────────────────────────────── */}

      {/* Mobile stats */}
      <div
        className="md:hidden flex pb-7 mb-7"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        {mobileStats.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col gap-2"
            style={{ borderLeft: i > 0 ? `1px solid ${HAIRLINE}` : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
            <p style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontWeight: 500, fontSize: 28, lineHeight: 1,
              letterSpacing: '-0.012em', color: 'var(--color-text-primary)',
            }}>{s.num}</p>
            <span style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: LABEL_COLOR,
            }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Desktop stats */}
      <div
        className="hidden md:grid md:grid-cols-3 pt-7 pb-8"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        {desktopStats.map((s, i) => (
          <div key={i} className="flex flex-col gap-3"
            style={{ borderLeft: i > 0 ? `1px solid ${HAIRLINE}` : 'none', paddingLeft: i > 0 ? 32 : 0 }}>
            <p style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontWeight: 500, fontSize: 56, lineHeight: 1,
              letterSpacing: '-0.02em', color: 'var(--color-text-primary)',
            }}>{s.num}</p>
            <span style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: LABEL_COLOR,
            }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── Up Next ───────────────────────────────────────────────────────── */}

      {!loading && nextDiscussion && (
        <>
          {/* Mobile Up Next */}
          <div
            className="md:hidden pt-7 pb-7"
            style={{ borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex justify-between items-baseline mb-3.5">
              <span style={{
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: COPPER,
              }}>Up Next</span>
              <span style={{
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: COPPER,
              }}>{nextDiscDate}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p style={{
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontWeight: 500, fontStyle: 'italic', fontSize: 26, lineHeight: 1.15,
                  letterSpacing: '-0.012em', color: 'var(--color-text-primary)',
                  marginBottom: 10,
                } as React.CSSProperties}>
                  {nextDiscussion.title}
                </p>
                <p style={{
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5,
                }}>
                  {nextDiscussion.clubName}
                  {nextDiscussion.location && (
                    <> <span style={{ opacity: 0.5 }}>—</span> {nextDiscussion.location}</>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowNoteModal(true)}
                  aria-label="Food for thought note"
                  title="Food for thought"
                  className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <AttendanceControl discussion={nextDiscussion} />
              </div>
            </div>
          </div>

          {/* Desktop Up Next */}
          <div
            className="hidden md:grid md:grid-cols-[160px_1fr] md:gap-8 py-[52px]"
            style={{ borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <div>
              <span style={{
                display: 'block',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: COPPER,
              }}>Up Next</span>
              <span style={{
                display: 'block',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: COPPER, marginTop: 10,
              }}>{nextDiscDate}</span>
            </div>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <p style={{
                  fontFamily: '"EB Garamond", Georgia, serif',
                  fontWeight: 500, fontStyle: 'italic', fontSize: 44, lineHeight: 1.1,
                  letterSpacing: '-0.015em', color: 'var(--color-text-primary)',
                  maxWidth: 760, marginBottom: 18,
                } as React.CSSProperties}>
                  {nextDiscussion.title}
                </p>
                <p style={{
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 15, color: 'var(--color-text-secondary)',
                  display: 'flex', gap: 10,
                }}>
                  <span>{nextDiscussion.clubName}</span>
                  {nextDiscussion.location && (
                    <>
                      <span style={{ opacity: 0.5 }}>—</span>
                      <span>{nextDiscussion.location}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowNoteModal(true)}
                  aria-label="Food for thought note"
                  title="Food for thought"
                  className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <AttendanceControl discussion={nextDiscussion} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Shelf + Clubs ─────────────────────────────────────────────────── */}

      {!loading && clubItems.length === 0 && (
        <div className="pt-10 md:pt-16 flex flex-col items-center text-center gap-5 pb-10">
          <p style={{
            fontFamily: '"EB Garamond", Georgia, serif',
            fontWeight: 500, fontStyle: 'italic',
            fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}>No clubs yet.</p>
          <p style={{
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 320,
          }}>You haven't joined any book clubs. Find one and start reading with others.</p>
          <Link
            to="/clubs"
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 13, fontWeight: 500,
              color: COPPER, textDecoration: 'none',
              border: `1px solid ${COPPER}`,
              padding: '9px 18px', borderRadius: 8,
              display: 'inline-block',
              transition: 'opacity 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >Find a club to join</Link>
        </div>
      )}

      {(loading || clubItems.length > 0) && (
      <div className="pt-10 md:pt-12 lg:grid lg:grid-cols-[1.55fr_1fr] lg:gap-12">

        {/* Left: On Your Shelf */}
        <div>
          <div className="flex justify-between items-baseline mb-7">
            <span style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            }}>On Your Shelf</span>
            <span style={{
              fontFamily: '"EB Garamond", Georgia, serif',
              fontStyle: 'italic', fontSize: 18, color: 'var(--color-text-secondary)',
            }}>{shelfItems.length} books in progress</span>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-[22px]">
                  <div className="w-[52px] h-[72px] rounded-sm bg-[var(--color-bg-elevated)] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-7 w-2/3 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-[var(--color-bg-elevated)] rounded animate-pulse" />
                    <div className="h-[3px] bg-[var(--color-bg-elevated)] rounded animate-pulse mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {shelfItems.map(({ book, clubName, done, total, nextDate }, i) => (
                <ShelfRow
                  key={`${clubName}-${i}`}
                  title={book.title}
                  author={book.author}
                  coverUrl={book.image_url}
                  clubName={clubName}
                  done={done}
                  total={total}
                  nextDate={nextDate}
                />
              ))}
            </div>
          )}

          {/* Personal Reading Progress */}
          {(shelfProgressLoading || shelfProgress.length > 0) && (
            <div className="mt-10">
              <span style={{
                display: 'block',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--color-text-secondary)',
                marginBottom: 20,
              }}>Personal Progress</span>

              {shelfProgressLoading ? (
                <div className="space-y-5">
                  {[1, 2].map(i => (
                    <div key={i} className="h-[3px] bg-[var(--color-bg-elevated)] rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {shelfProgress.filter(p => p.book).map((p, i) => (
                    <div key={p.id}>
                      <p style={{
                        fontFamily: '"EB Garamond", Georgia, serif',
                        fontStyle: 'italic', fontWeight: 500,
                        fontSize: 16, color: 'var(--color-text-primary)',
                        marginBottom: 10,
                      }}>{p.book!.title}</p>
                      <ProgressRow
                        book={{ ...p.book!, id: p.book_id }}
                        progress={p}
                        onUpdated={(updated) => setShelfProgress(prev => prev.map((sp, j) => j === i ? updated : sp))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Your Clubs — desktop only */}
        <div className="hidden lg:block">
          <span style={{
            display: 'block',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-secondary)',
            marginBottom: 28,
          }}>Your Clubs</span>
          <div className="flex flex-col gap-3.5">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-[88px] rounded-[10px] bg-[var(--color-bg-elevated)] animate-pulse" />
              ))
            ) : (
              clubItems.map(c => (
                <ClubCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  role={c.role}
                  members={c.members}
                  memberCount={c.memberCount}
                  currentMemberId={member?.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
      )}

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={() => {
          refreshMemberData()
          setShowEditProfileModal(false)
        }}
        onError={() => {}}
        currentMember={member}
      />
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
      />
      <ReadingLogModal
        isOpen={showReadingLogModal}
        onClose={() => setShowReadingLogModal(false)}
      />
      <DiscussionNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        discussion={nextDiscussion}
        onError={() => {}}
      />
    </div>
  )
}

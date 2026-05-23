import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { invokeFunction, getAvatarUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Club } from '../types'
import EditProfileModal from '../components/modals/EditProfileModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#5865F2', '#5BAA5C', '#9B59B6', '#E67E22', '#3498DB',
  '#E74C3C', '#16A085', '#F39C12', '#8E44AD', '#2ECC71',
]

function avatarHue(id: number | string | null | undefined): string {
  if (id == null) return AVATAR_PALETTE[0]
  const n = typeof id === 'number'
    ? Math.abs(id)
    : String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length]
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatUpNextDate(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(', ', ' · ')
    .toUpperCase()
}

function formatNextDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Warm-dark hairline and button border — design tokens not in CSS vars
const HAIRLINE = 'rgba(242,237,229,0.08)'
const OUTLINE_BORDER = 'rgba(242,237,229,0.14)'
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

function AvatarStack({ members, totalCount, size = 26 }: {
  members: Array<{ id?: number | string | null; name?: string | null; avatar_path?: string | null }>;
  totalCount: number;
  size?: number;
}) {
  const shown = members.slice(0, 3)
  const extra = totalCount - shown.length
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {shown.map((m, i) => (
        <div key={i} style={{
          width: size, height: size, borderRadius: '50%',
          background: avatarHue(m.id),
          outline: '2px solid var(--color-bg-elevated)',
          outlineOffset: '-2px',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontWeight: 600, fontSize: size * 0.40, lineHeight: 1,
          letterSpacing: '-0.02em',
          flexShrink: 0,
          marginLeft: i === 0 ? 0 : -(size * 0.32),
          zIndex: shown.length - i,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {m.name ? nameInitials(m.name) : '?'}
          {m.avatar_path && (
            <img
              src={getAvatarUrl(m.avatar_path)}
              alt={m.name ?? ''}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
              }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: TRACK_COLOR,
          outline: '2px solid var(--color-bg-elevated)',
          outlineOffset: '-2px',
          color: LABEL_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          fontWeight: 500, fontSize: size * 0.34,
          flexShrink: 0,
          marginLeft: -(size * 0.32),
          position: 'relative',
        }}>+{extra}</div>
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

function ClubCard({ id, name, role, members, memberCount }: {
  id: string; name: string; role: string;
  members: Array<{ id?: number | string | null; name?: string | null; avatar_path?: string | null }>;
  memberCount: number;
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
          <AvatarStack members={members} totalCount={memberCount} size={26} />
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
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

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
    .filter(d => new Date(d.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null

  // Active readings with progress + next date per book
  const shelfItems = clubs
    .filter(c => c.active_session)
    .map(c => {
      const session = c.active_session!
      const total = session.discussions.length
      const done = session.discussions.filter(d => new Date(d.date) <= new Date()).length
      const nextDisc = session.discussions
        .filter(d => new Date(d.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
      return {
        book: session.book,
        clubName: c.name,
        done, total,
        nextDate: nextDisc ? formatNextDate(nextDisc.date) : null,
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

  const memberInitials = member?.name ? nameInitials(member.name) : '?'

  const nextDiscDate = nextDiscussion ? formatUpNextDate(nextDiscussion.date) : null

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
          <button
            onClick={() => setShowEditProfileModal(true)}
            aria-label="Edit profile"
            className="transition-[background,transform] duration-[120ms] hover:bg-[rgba(242,237,229,0.06)] active:scale-[0.97]"
            style={{
              background: 'transparent',
              border: `1px solid ${OUTLINE_BORDER}`,
              color: 'var(--color-text-primary)',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 12, fontWeight: 500,
              padding: '8px 14px', borderRadius: 8,
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
            }}
          >Edit profile</button>
        </div>
        <div className="flex items-center gap-[18px] mb-7">
          <div className="relative shrink-0">
            <div
              className="rounded-full bg-primary flex items-center justify-center text-white font-serif font-medium"
              style={{ width: 88, height: 88, fontSize: 88 * 0.40, letterSpacing: '-0.015em' }}
            >{memberInitials}</div>
            {member?.avatar_path && (
              <img
                src={getAvatarUrl(member.avatar_path)} alt={member.name}
                className="absolute inset-0 rounded-full object-cover"
                style={{ width: 88, height: 88 }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
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
                  <img src="/ic-discord.svg" alt="" style={{ width: 13, height: 13, opacity: 0.6, flexShrink: 0, display: 'block' }} />
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
        <div className="relative shrink-0">
          <div
            className="rounded-full bg-primary flex items-center justify-center text-white font-serif font-medium"
            style={{ width: 112, height: 112, fontSize: 112 * 0.40, letterSpacing: '-0.015em' }}
          >{memberInitials}</div>
          {member?.avatar_path && (
            <img
              src={getAvatarUrl(member.avatar_path)} alt={member?.name}
              className="absolute inset-0 rounded-full object-cover"
              style={{ width: 112, height: 112 }}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>

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
                <img src="/ic-discord.svg" alt="" style={{ width: 14, height: 14, opacity: 0.6, flexShrink: 0, display: 'block' }} />
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setShowEditProfileModal(true)}
          aria-label="Edit profile"
          className="transition-[background,transform] duration-[120ms] hover:bg-[rgba(242,237,229,0.06)] active:scale-[0.97]"
          style={{
            background: 'transparent',
            border: `1px solid ${OUTLINE_BORDER}`,
            color: 'var(--color-text-primary)',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 13, fontWeight: 500,
            padding: '10px 16px', borderRadius: 8,
            whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
          }}
        >Edit profile</button>
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
            <div>
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
    </div>
  )
}

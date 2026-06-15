import { getAvatarUrl } from '../supabase'
import type { Member, UserRole } from '../types'
import Avatar from './ui/Avatar'
import RoleEyebrow from './ui/RoleEyebrow'
import KebabMenu from './ui/KebabMenu'

type SessionStatus = 'reading' | 'skipping' | null

interface MemberBadgeProps {
  member: Member & { role?: string }
  isOwn: boolean
  isAdmin: boolean
  readingStatus?: SessionStatus
  onEdit?: (member: Member) => void
  onDelete?: (member: Member) => void
  className?: string
}

export default function MemberBadge({
  member,
  isOwn,
  isAdmin,
  readingStatus,
  onEdit,
  onDelete,
  className = '',
}: MemberBadgeProps) {
  const role = (member.role || 'member') as UserRole

  return (
    <div className={`flex items-start gap-3.5 py-3 border-b border-[var(--color-divider)] ${className}`}>
      <Avatar
        name={member.name}
        userId={String(member.id)}
        imageUrl={member.avatar_path ? getAvatarUrl(member.avatar_path) : null}
        size="lg"
        isOwn={isOwn}
      />

      {/* Name + handle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
            {member.name}
          </p>
          {isOwn && (
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary flex-shrink-0">
              YOU
            </span>
          )}
        </div>
        <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
          @{member.handle || member.discord_id || 'unknown'}
        </p>
      </div>

      {/* Right column: role + kebab on top, reading icon below */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <RoleEyebrow role={role} />
          {isAdmin && !isOwn && role !== 'owner' && onEdit && onDelete && (
            <KebabMenu
              items={[
                { label: 'Edit Member', onClick: () => onEdit(member) },
                { label: 'Remove', danger: true, onClick: () => onDelete(member) },
              ]}
            />
          )}
        </div>
        {readingStatus && (
          <span
            className="w-[14px] h-[14px] block"
            title={readingStatus === 'reading' ? 'Reading' : 'Skipping'}
            style={{
              backgroundColor: readingStatus === 'reading' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              opacity: readingStatus === 'reading' ? 1 : 0.4,
              maskImage: `url(${readingStatus === 'reading' ? '/ic-reading.svg' : '/ic-reading-not.svg'})`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: `url(${readingStatus === 'reading' ? '/ic-reading.svg' : '/ic-reading-not.svg'})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            } as React.CSSProperties}
          />
        )}
      </div>
    </div>
  )
}

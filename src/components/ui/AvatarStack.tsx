import Avatar from './Avatar'
import { getAvatarUrl } from '../../supabase'

interface StackMember {
  id?: number | string | null
  name?: string | null
  avatar_path?: string | null
}

interface AvatarStackProps {
  members: StackMember[]
  max?: number
  size?: 'sm' | 'md'
  currentMemberId?: number | string | null
  borderColor?: string
  className?: string
}

const OVERFLOW_BG = '#4D4033'

export default function AvatarStack({
  members,
  max = 5,
  size = 'sm',
  currentMemberId,
  borderColor = 'var(--color-bg)',
  className = '',
}: AvatarStackProps) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length

  const overlapClass = size === 'sm' ? '-space-x-1.5' : '-space-x-2'
  const borderWidth = size === 'sm' ? '1.5px' : '2px'
  const pillClass = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'

  return (
    <div className={`flex ${overlapClass} items-center ${className}`}>
      {shown.map((m, i) => (
        <div
          key={m.id ?? i}
          className="rounded-full flex-shrink-0"
          style={{ border: `${borderWidth} solid ${borderColor}` }}
        >
          <Avatar
            name={m.name ?? '?'}
            userId={String(m.id ?? 0)}
            imageUrl={m.avatar_path ? getAvatarUrl(m.avatar_path) : null}
            isOwn={m.id != null && m.id === currentMemberId}
            size={size}
          />
        </div>
      ))}
      {extra > 0 && (
        <div
          className={`${pillClass} rounded-full flex-shrink-0 flex items-center justify-center font-medium text-white`}
          style={{ border: `${borderWidth} solid ${borderColor}`, background: OVERFLOW_BG }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

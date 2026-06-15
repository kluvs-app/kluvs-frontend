const AVATAR_HUE_COUNT = 12

const OWN_COLOR = 'var(--color-primary)'

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface AvatarProps {
  name: string
  userId: string
  imageUrl?: string | null
  isOwn?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  title?: string
  className?: string
}

export default function Avatar({
  name,
  userId,
  imageUrl,
  isOwn = false,
  size = 'md',
  title,
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-10 h-10 text-[12px]',
    xl: 'w-[88px] h-[88px] text-[35px]',
    '2xl': 'w-[112px] h-[112px] text-[45px]',
  }

  const backgroundColor = isOwn
    ? OWN_COLOR
    : `var(--kluvs-avatar-hue-${Math.abs(Number(userId)) % AVATAR_HUE_COUNT})`

  const color = isOwn ? '#FFFFFF' : 'var(--kluvs-avatar-initials)'

  const initials = nameInitials(name)
  const isLarge = size === 'xl' || size === '2xl'

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex-shrink-0 flex items-center justify-center font-medium ${className}`}
      style={{ backgroundColor, color }}
      title={title || name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <span
          className="font-serif"
          style={isLarge ? { letterSpacing: '-0.015em' } : undefined}
        >
          {initials}
        </span>
      )}
    </div>
  )
}

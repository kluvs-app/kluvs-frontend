const AVATAR_HUES = [
  '#5865F2',
  '#5BAA5C',
  '#9B59B6',
  '#E67E22',
  '#3498DB',
  '#E74C3C',
  '#16A085',
  '#F39C12',
  '#8E44AD',
  '#2ECC71',
]

interface AvatarProps {
  name: string
  userId: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  title?: string
  className?: string
}

export default function Avatar({
  name,
  userId,
  imageUrl,
  size = 'md',
  title,
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-10 h-10 text-[12px]',
  }

  const backgroundColor = AVATAR_HUES[Math.abs(Number(userId)) % AVATAR_HUES.length]
  const initials = name[0].toUpperCase()

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium ${className}`}
      style={{ backgroundColor }}
      title={title || name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="font-serif">{initials}</span>
      )}
    </div>
  )
}

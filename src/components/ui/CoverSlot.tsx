import { useState } from 'react'

interface CoverSlotProps {
  imageUrl?: string | null
  width?: number
  height?: number
  className?: string
  alt?: string
  label?: string
  shadow?: boolean
}

export default function CoverSlot({
  imageUrl,
  width,
  height,
  className,
  alt = 'Book cover',
  label,
  shadow,
}: CoverSlotProps) {
  const [imgError, setImgError] = useState(false)
  const showPlaceholder = !imageUrl || imgError

  return (
    <div
      style={{
        width,
        height,
        boxShadow: shadow
          ? showPlaceholder
            ? '0 3px 8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.02)'
            : '0 3px 8px rgba(0,0,0,0.35)'
          : undefined,
      }}
      className={`relative shrink-0 rounded-sm overflow-hidden flex items-end justify-center bg-[var(--color-bg-raised)] ${className ?? ''}`}
    >
      {showPlaceholder ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              var(--color-divider),
              var(--color-divider) 3px,
              var(--color-bg-elevated) 3px,
              var(--color-bg-elevated) 6px
            )`,
          }}
        />
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {showPlaceholder && label && (
        <span className="text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--color-text-meta)] pb-1.5 opacity-70 relative z-10">
          {label}
        </span>
      )}
    </div>
  )
}

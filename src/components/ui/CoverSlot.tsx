import { useId, useState, type ReactNode } from 'react'

interface CoverSlotProps {
  imageUrl?: string | null
  width?: number
  height?: number
  className?: string
  alt?: string
  label?: string
  shadow?: boolean
  children?: ReactNode
}

export default function CoverSlot({
  imageUrl,
  width,
  height,
  className,
  alt = 'Book cover',
  label,
  shadow,
  children,
}: CoverSlotProps) {
  const [imgError, setImgError] = useState(false)
  const showPlaceholder = !imageUrl || imgError
  const patternId = `kluvs-hex-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

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
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ color: 'var(--color-divider)' }}
          aria-hidden="true"
        >
          <defs>
            <pattern id={patternId} width="17.32" height="30" patternUnits="userSpaceOnUse">
              <path d="M8.66 10 L17.32 15 L17.32 25 L8.66 30 L0 25 L0 15 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M0 0 L8.66 5 L8.66 15 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M17.32 0 L17.32 20 L8.66 15 L8.66 5 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="var(--color-bg-raised)" />
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
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
      {children}
    </div>
  )
}

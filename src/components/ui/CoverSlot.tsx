import { useState } from 'react'

interface CoverSlotProps {
  imageUrl?: string | null
  width: number
  height: number
  alt?: string
}

export default function CoverSlot({
  imageUrl,
  width,
  height,
  alt = 'Book cover',
}: CoverSlotProps) {
  const [imgError, setImgError] = useState(false)
  const showPlaceholder = !imageUrl || imgError

  return (
    <div
      style={{ width, height }}
      className="relative flex-shrink-0 rounded-sm overflow-hidden bg-[#1A140F]"
    >
      {showPlaceholder ? (
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #332B24,
              #332B24 3px,
              #241C17 3px,
              #241C17 6px
            )`,
          }}
        />
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}

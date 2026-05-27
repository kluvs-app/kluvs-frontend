import CoverSlot from './CoverSlot'

interface BookCoverProps {
  imageUrl?: string | null
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { width: 56, height: 84 },   // 2:3 ratio
  md: { width: 80, height: 120 },  // 2:3 ratio
  lg: { width: 128, height: 192 }, // 2:3 ratio
}

export default function BookCover({
  imageUrl,
  title = 'Book cover',
  size = 'md',
}: BookCoverProps) {
  const { width, height } = SIZES[size]

  return (
    <CoverSlot
      imageUrl={imageUrl}
      width={width}
      height={height}
      alt={title}
    />
  )
}

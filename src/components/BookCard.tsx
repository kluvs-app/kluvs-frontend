import CoverSlot from './ui/CoverSlot'
import HexagonIcon from './icons/HexagonIcon'

export default function BookCard({ title, year, author, imageUrl, onClick, compact, badge }: {
  title: string
  year?: number | string | null
  author?: string | null
  imageUrl?: string | null
  onClick: () => void
  compact?: boolean
  badge?: { label: string }
}) {
  return (
    <button onClick={onClick} className={`flex flex-col gap-2 text-left group ${compact ? 'shrink-0 w-[80px]' : ''}`}>
      <CoverSlot
        imageUrl={imageUrl}
        alt={title}
        label="cover"
        shadow
        className={`${compact ? 'w-[80px] h-[116px]' : 'w-full aspect-[2/3]'} group-hover:opacity-80 transition-opacity`}
      >
        {badge && (
          <span
            title={badge.label}
            aria-label={badge.label}
            className="absolute top-1.5 right-1.5 z-10 text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            <HexagonIcon className="w-5 h-5" />
          </span>
        )}
      </CoverSlot>
      <div>
        <p className={`font-serif italic font-medium leading-[1.25] line-clamp-2 text-[var(--color-text-primary)] ${compact ? 'text-[11px]' : 'text-[14px] lg:text-[15px]'}`}>
          {title}
        </p>
        {(author || year) && (
          <p className={`text-[var(--color-text-meta)] mt-0.5 truncate ${compact ? 'text-[10px]' : 'text-[12px] lg:text-[13px]'}`}>
            {author ? `${author} · ` : ''}{year ?? ''}
          </p>
        )}
      </div>
    </button>
  )
}

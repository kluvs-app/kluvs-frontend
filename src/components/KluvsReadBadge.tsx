import HexagonIcon from './icons/HexagonIcon'

export default function KluvsReadBadge({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-primary text-primary shrink-0"
    >
      <HexagonIcon className="w-4 h-4" />
    </span>
  )
}

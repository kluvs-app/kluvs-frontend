interface Props {
  className?: string
}

export default function HexagonIcon({ className = 'w-5 h-5' }: Props) {
  return (
    <svg className={className} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">
      <path d="M264.65-107 48.74-480l215.91-373h430.7l215.91 373-215.91 373h-430.7Z" />
    </svg>
  )
}

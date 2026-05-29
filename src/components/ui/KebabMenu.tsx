import { useState, useRef, useEffect } from 'react'

export interface KebabMenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

interface KebabMenuProps {
  items: KebabMenuItem[]
}

export default function KebabMenu({ items }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
        className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-120 hover:bg-[rgba(242,237,229,0.06)] text-[var(--color-text-secondary)]"
      >
        <span className="flex items-center gap-0.5">
          <span className="w-0.5 h-0.5 rounded-full bg-current" />
          <span className="w-0.5 h-0.5 rounded-full bg-current" />
          <span className="w-0.5 h-0.5 rounded-full bg-current" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-divider)] rounded-lg shadow-lg z-50 min-w-[150px] overflow-hidden">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={[
                'w-full text-left px-4 py-2 text-[13px] transition-colors duration-120',
                item.danger
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-[var(--color-text-primary)] hover:bg-[rgba(242,237,229,0.06)]',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

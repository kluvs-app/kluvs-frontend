import { useState, useRef, useEffect } from 'react'
import type { ShelfValue } from '../types'
import { SHELF_OPTIONS, SHELF_LABELS } from '../constants/shelves'

export default function ShelfPill({ shelf, onShelfChange, disabled }: {
  shelf: ShelfValue | null
  onShelfChange: (v: ShelfValue | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-label={shelf ? `Shelf: ${SHELF_LABELS[shelf]}` : 'Add to shelf'}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 t-label h-[34px] px-4 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          shelf
            ? 'border-primary text-primary'
            : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {/* Bookmark icon */}
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill={shelf ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>{shelf ? SHELF_LABELS[shelf] : 'Add to Shelf'}</span>
        {/* Chevron */}
        <svg
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select shelf"
          className="absolute top-full left-0 mt-1.5 z-20 min-w-[180px] py-1 rounded-xl border border-[var(--color-divider)] bg-[var(--color-bg-elevated)] shadow-xl overflow-hidden"
        >
          {SHELF_OPTIONS.map(({ value, label }) => {
            const isActive = shelf === value
            return (
              <button
                key={label}
                role="option"
                aria-selected={isActive}
                onClick={() => { onShelfChange(value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-2.5 t-body-m transition-colors text-left ${
                  isActive
                    ? 'text-primary bg-primary/[0.06]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

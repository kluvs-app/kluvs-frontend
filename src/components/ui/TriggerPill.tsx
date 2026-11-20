import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Trigger pill — design-system/docs/buttons.md: 32 high, 16 side padding, Fine print,
// fully rounded outline; `success` is the transient green state after the action.
interface TriggerPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  success?: boolean
  children: ReactNode
}

export default function TriggerPill({ success = false, className = '', children, ...props }: TriggerPillProps) {
  return (
    <button
      type="button"
      {...props}
      className={[
        't-fine-print inline-flex items-center h-8 px-4 rounded-full border bg-transparent whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-[120ms]',
        success
          ? 'border-success text-success'
          : 'border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

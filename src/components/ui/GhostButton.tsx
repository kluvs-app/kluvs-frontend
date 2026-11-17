import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'md' | 'sm'
  icon?: '+'
  children: ReactNode
}

export default function GhostButton({
  variant = 'md',
  icon,
  children,
  className = '',
  ...props
}: GhostButtonProps) {
  const sizeClasses =
    variant === 'md'
      ? 't-label px-4 py-2.5'
      : 't-label px-3 py-1.5'
  const iconSize = variant === 'md' ? 'text-[16px]' : 'text-[14px]'

  return (
    <button
      {...props}
      className={[
        'inline-flex items-center gap-1.5 rounded-lg cursor-pointer whitespace-nowrap flex-shrink-0',
        'bg-transparent border border-[var(--color-divider)] text-[var(--color-text-primary)]',
        'hover:bg-[var(--color-bg-elevated)] active:scale-[0.97] transition-[background,transform] duration-[120ms]',
        sizeClasses,
        className,
      ].join(' ')}
    >
      {icon && (
        <span
          className={`${iconSize} text-[var(--color-text-secondary)] font-normal`}
          aria-hidden
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}

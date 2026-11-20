import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Button family — design-system/docs/buttons.md
//   primary   → copper fill, single most important action
//   danger    → destructive confirm (filled)
//   secondary → copper outline, "active" emphasis
//   outlined  → grey outline, "muted" variant
//   text      → no container; grey, or copper with `emphasized`
//   social    → full-width OAuth provider button; brand colors come from className
export type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outlined' | 'text' | 'social'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** text variant only: copper instead of grey */
  emphasized?: boolean
  /** text variant only: destructive red (DS text-destructive) */
  destructive?: boolean
  children?: ReactNode
}

const BASE =
  'inline-flex items-center justify-center gap-2 t-label rounded-btn h-10 cursor-pointer transition-colors disabled:cursor-not-allowed'

// One size, from design-system docs/buttons.md: 40 high, radius 12, side padding 24
// (text variant 12). Label type comes from the family.
const VARIANTS: Record<Exclude<ButtonVariant, 'text'>, string> = {
  social: 'w-full px-4 gap-3',
  primary:
    'bg-primary hover:bg-primary-hover text-[var(--color-on-primary)] active:scale-[0.97] disabled:opacity-40',
  danger:
    'bg-danger hover:bg-danger-hover text-[var(--color-on-primary)] active:scale-[0.97] disabled:opacity-40',
  secondary:
    'bg-transparent border border-primary text-primary hover:bg-status-primary-subtle active:scale-[0.97] disabled:opacity-40',
  outlined:
    'bg-transparent border border-[var(--color-divider)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] active:scale-[0.97] disabled:opacity-40',
}

export default function Button({
  variant = 'primary',
  emphasized = false,
  destructive = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const style =
    variant === 'text'
      ? [
          'px-3 disabled:opacity-40',
          destructive
            ? 'text-danger hover:text-danger-hover'
            : emphasized
              ? 'text-primary hover:text-primary-hover'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        ].join(' ')
      : variant === 'social'
        ? VARIANTS.social
        : `px-6 ${VARIANTS[variant]}`

  return (
    <button
      {...props}
      className={[BASE, style, className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}

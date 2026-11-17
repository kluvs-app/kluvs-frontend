import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Button family — design-system/docs/buttons.md
//   primary   → copper fill, single most important action
//   danger    → destructive confirm (filled)
//   secondary → copper outline, "active" emphasis
//   outlined  → grey outline, "muted" variant
//   text      → no container; grey, or copper with `emphasized`
export type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'outlined' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** text variant only: copper instead of grey */
  emphasized?: boolean
  children?: ReactNode
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-btn font-medium cursor-pointer transition-colors disabled:cursor-not-allowed'

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-[13px]',
  md: 'px-5 py-2 text-[14px]',
  lg: 'px-6 py-2.5 text-[14px]',
}

const VARIANTS: Record<Exclude<ButtonVariant, 'text'>, string> = {
  primary:
    'bg-primary hover:bg-primary-hover text-[var(--color-on-primary)] active:scale-[0.97] disabled:opacity-40',
  danger:
    'bg-danger hover:bg-danger-hover text-[var(--color-on-primary)] active:scale-[0.97] disabled:opacity-40',
  secondary:
    'bg-transparent border-[1.5px] border-primary text-primary hover:bg-status-primary-subtle active:scale-[0.97] disabled:opacity-40',
  outlined:
    'bg-transparent border border-[var(--color-divider)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] active:scale-[0.97] disabled:opacity-40',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  emphasized = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const style =
    variant === 'text'
      ? [
          'text-[14px] disabled:opacity-40',
          emphasized
            ? 'text-primary hover:text-primary-hover'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        ].join(' ')
      : `${SIZES[size]} ${VARIANTS[variant]}`

  return (
    <button
      {...props}
      className={[BASE, style, className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}

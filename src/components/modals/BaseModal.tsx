import { useEffect, type ReactNode } from 'react'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  titleVariant?: 'default' | 'danger'
  loading?: boolean
  maxWidth?: 'sm' | 'md'
  labelId: string
  footer?: ReactNode
  dangerZone?: ReactNode
  children: ReactNode
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  titleVariant = 'default',
  loading = false,
  maxWidth = 'sm',
  labelId,
  footer,
  dangerZone,
  children,
}: BaseModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const titleColor = titleVariant === 'danger' ? 'var(--color-danger)' : '#D16D30'
  const maxWidthClass = maxWidth === 'md' ? 'max-w-md' : 'max-w-sm'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      <div
        className={`w-full ${maxWidthClass} rounded-2xl overflow-hidden`}
        style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-divider)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-5"
          style={{ borderBottom: '1px solid var(--color-divider)' }}
        >
          <h2
            id={labelId}
            style={{
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: titleColor,
              margin: 0,
            }}
          >{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-6">
          {children}
        </div>

        {/* Danger Zone (optional) */}
        {dangerZone && (
          <div
            className="px-6 py-3"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          >
            {dangerZone}
          </div>
        )}

        {/* Footer (optional) */}
        {footer && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

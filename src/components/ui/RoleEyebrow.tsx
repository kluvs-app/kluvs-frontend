import type { UserRole } from '../../types'

interface RoleEyebrowProps {
  role: UserRole
  className?: string
}

export default function RoleEyebrow({ role, className = '' }: RoleEyebrowProps) {
  const isOwner = role === 'owner'
  const isAdmin = role === 'admin'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em]',
        isOwner
          ? 'text-role-owner'
          : isAdmin
            ? 'text-role-admin dark:text-role-admin-on-dark'
            : 'text-role-member-label-light dark:text-role-member-label',
        className,
      ].join(' ')}
    >
      {(isOwner || isAdmin) && (
        <span
          className={`inline-block w-[8px] h-[8px] rounded-full ${
            isOwner ? 'bg-role-owner' : 'bg-role-admin'
          }`}
          aria-hidden
        />
      )}
      {role}
    </span>
  )
}

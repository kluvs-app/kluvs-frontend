import type { Club, ProgressType, ShelfValue, UserRole } from '../types'

// The API can add enum values before this app knows them. Parsing never throws,
// but code that assumes a union is exhaustive can render `undefined` or broken UI.
// These helpers narrow a wire value to a known one and warn (once per value) when
// it isn't. The `Record<…, true>` objects fail type-check if the spec adds a value,
// so the regen PR flags each list that needs updating.

type JoinPolicy = Club['join_policy']

const USER_ROLES = Object.keys({ owner: true, admin: true, member: true } satisfies Record<UserRole, true>) as UserRole[]
const SHELF_VALUES = Object.keys({
  want_to_read: true, read: true, not_finished: true, currently_reading: true,
} satisfies Record<ShelfValue, true>) as ShelfValue[]
const PROGRESS_TYPES = Object.keys({ page: true, percent: true } satisfies Record<ProgressType, true>) as ProgressType[]
const JOIN_POLICIES = Object.keys({ PRIVATE: true, INVITE_LINK: true } satisfies Record<JoinPolicy, true>) as JoinPolicy[]

const warned = new Set<string>()

/** True when `value` is one of `known`; otherwise warns once per `name`/value pair. */
export function isKnownEnum<T extends string>(value: unknown, known: readonly T[], name: string): value is T {
  if ((known as readonly unknown[]).includes(value)) return true
  const key = `${name}:${String(value)}`
  if (!warned.has(key)) {
    warned.add(key)
    console.warn(`Unknown ${name} from API: ${JSON.stringify(value)}`)
  }
  return false
}

/** Unknown roles get least privilege. */
export const toUserRole = (value: unknown): UserRole =>
  isKnownEnum(value, USER_ROLES, 'role') ? value : 'member'

/** Unknown shelves can't be shown in a section or labelled; callers skip or use a generic label. */
export const isKnownShelf = (value: unknown): value is ShelfValue =>
  isKnownEnum(value, SHELF_VALUES, 'shelf')

/** Unknown progress types fall back to the modal's default, `page`. */
export const toProgressType = (value: unknown): ProgressType =>
  isKnownEnum(value, PROGRESS_TYPES, 'progress_type') ? value : 'page'

/** Unknown join policies are treated as the most restrictive, `PRIVATE`. */
export const toJoinPolicy = (value: unknown): JoinPolicy =>
  isKnownEnum(value, JOIN_POLICIES, 'join_policy') ? value : 'PRIVATE'

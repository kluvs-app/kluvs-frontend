---
paths:
  - "src/supabase.ts"
  - "src/pages/**"
  - "src/components/**"
  - "src/contexts/**"
---

# Data fetching

## invokeFunction
- Every Edge Function call goes through `invokeFunction<T>(path, options)` from `src/supabase.ts`.
- `T` is always a spec response type imported from `src/types` (for example `invokeFunction<BookSearchResponse>(…)`). Don't call it untyped, and don't guess shapes with unions.
- Use `supabase.*` directly only for things `invokeFunction` doesn't cover: auth (`supabase.auth.*`, e.g. `linkIdentity`, `signInWithOAuth`) and avatar storage uploads.
- `invokeFunction` handles three things, so callers don't:
  - it refreshes the session before each call
  - it retries once on a 401
  - it unwraps the backend's `{ success: false, error }` body into a plain `Error`, so `error.message` is fit to show users ("Already a member").
- Pass `body` as a plain object. Never `JSON.stringify` it.
- Build query strings with `encodeURIComponent(value)` or `URLSearchParams`. Never interpolate raw values.
- Many response fields are optional in the spec even though the backend always sends them. Handle that at the call site (`club.members ?? []`, `member.role ?? 'member'`). Don't cast.

## Standard call shape
```tsx
const handleSave = async () => {
  try {
    setLoading(true)
    onError('')                       // or setError(null) in a page
    const { data, error } = await invokeFunction<ClubUpdateResponse>('club', { method: 'PUT', body: { id, name } })
    if (error) throw error
    // use data…
  } catch (err: unknown) {
    onError(err instanceof Error ? err.message : 'Failed to update club')
  } finally {
    setLoading(false)
  }
}
```
- Use `err instanceof Error ? err.message : '<fallback>'` to extract the message. That is enough, because `invokeFunction` always returns an `Error`. Don't write `'message' in err` checks.
- State lives in the component: `useState` plus `useEffect`. There is no data-fetching library and no custom data hooks. Unmount `cancelled` guards are optional.
- Show loading with `<KluvsSpinner>`: full-screen for `AuthContext.loading`, inline for page and section data.

## Fire-and-forget
- `.catch(() => {})` is allowed **only** for non-critical prefetches and warm-ups whose failure the user never needs to see, such as sidebar prefetches or cold-start pings. Always add a comment saying why the failure is ignored. Everything else surfaces its error.

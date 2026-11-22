---
paths:
  - "src/contexts/AuthContext.tsx"
  - "src/pages/LoginPage.tsx"
  - "src/pages/JoinPage.tsx"
  - "src/pages/SetNewPasswordPage.tsx"
  - "src/App.tsx"
  - "src/components/layout/AppShell.tsx"
  - "src/components/modals/DiscordLinkModal.tsx"
  - "src/components/modals/DeleteAccountModal.tsx"
  - "src/__tests__/contexts/AuthContext.test.tsx"
---

# Auth, members & roles

## Member records
- Never create a Member from the frontend. That means no `POST /member` on signup or login, and no "create if missing" fallback. The backend trigger `on_auth_user_created` (kluvs-backend migration `20260210130949_auto_create_member_on_signup.sql`) inserts the member in the same transaction as the `auth.users` row. A client-side create races the trigger and produces duplicates.
- The frontend only looks members up, using `findMemberByUserId()`. It retries 3 times with exponential backoff to cover trigger lag. If it still returns `null`, set `member` to `null` and don't try to repair it client-side.
- `processingUserIdRef` dedups concurrent lookups for the same user. Keep it when you touch `onAuthStateChange` handling.

## AuthContext surface (`src/contexts/AuthContext.tsx`)
- State: `user` (Supabase `User`), `member` (profile with `clubs[]` and per-club `role`), `loading`, `isPasswordRecovery`, `isOnline`.
- Methods:
  - sign-in: `signInWithDiscord`, `signInWithGoogle`, `signInWithApple`, `signInWithEmail`, `signUpWithEmail`
  - password: `resetPasswordForEmail`, `updatePassword`
  - session and member: `signOut`, `refreshMemberData`, `getRoleForClub`
- OAuth calls pass `redirectTo: import.meta.env.VITE_OAUTH_REDIRECT_URL`.
- The session is persisted in localStorage. It is refreshed when it is within 300s (`SESSION_REFRESH_THRESHOLD_S`) of expiry.
- When a password-recovery email link fires `PASSWORD_RECOVERY`, `ProtectedRoute` (in `App.tsx`) renders `SetNewPasswordPage`.
- `isOnline` drives the offline banner in `AppShell`.
- Flow: login → `onAuthStateChange` → `findMemberByUserId` (with retries) → set `user`/`member`. After that, `/` redirects to `/me` when signed in and to `/login` otherwise.

## Roles (per club)
- `getRoleForClub(clubId)` returns `'owner' | 'admin' | 'member' | null`.
- Owners and admins have full CRUD over the club's sessions, books, discussions and members. Members are read-only.
- Gate admin UI like this:
  ```tsx
  const role = getRoleForClub(club.id)
  const isAdmin = role === 'owner' || role === 'admin'
  {isAdmin && <AdminThing />}
  ```
- Test admin-only features in both the admin state and the member state.

## After member mutations
- Call `refreshMemberData()` from `useAuth()`. Never reload the page.

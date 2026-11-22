---
paths:
  - "src/contexts/AuthContext.tsx"
  - "src/pages/LoginPage.tsx"
  - "src/pages/JoinPage.tsx"
  - "src/pages/SetNewPasswordPage.tsx"
  - "src/App.tsx"
  - "src/__tests__/contexts/AuthContext.test.tsx"
---

# Auth & member records

- Never create a Member from the frontend. No `POST /member` on signup or login, and no "create if missing" fallback. The backend trigger `on_auth_user_created` (kluvs-backend migration `20260210130949_auto_create_member_on_signup.sql`) inserts the member in the same transaction as the `auth.users` row. A client-side create races it and produces duplicates.
- The frontend only looks members up, using `findMemberByUserId()`. Its retry with backoff covers trigger lag. If it still returns `null`, set `member` to `null` and don't try to repair it client-side.

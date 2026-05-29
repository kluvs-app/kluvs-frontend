# Kluvs Frontend - Book Club Management App

## Project Overview
A React + TypeScript web application for managing book clubs. Users can track reading sessions, discussions, members, and club activities across multiple book clubs and Discord servers.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 3 + `@tailwindcss/typography` (for prose/markdown rendering)
- **Routing**: React Router v7 (`react-router-dom`)
- **Markdown Rendering**: `react-markdown`
- **Backend**: Supabase (Auth + Edge Functions)
- **Authentication**: OAuth (Discord, Google) + email/password
- **Testing**: Vitest + React Testing Library (~1,093 tests across 44 files)
- **Pre-commit Hooks**: Husky (validates on push)

## Backend API Compatibility
- **Backend Repository**: `kluvs-backend`
- **Compatible with migrations up to**: `20251130205915_add_metadata_fields.sql`
- **Last synced**: 2026-04-26
- **Current version**: 0.9.0
- **Sync notes**:
  - Fixed member creation to prevent duplicates on OAuth signup
  - Added new optional fields to TypeScript types: `user_id`, `handle`, `created_at` (Member); `id`, `page_count` (Book); `founded_date` (Club)
  - Release automation via CI/CD

## Project Structure
```
src/
├── components/
│   ├── modals/              # Modal dialogs (15 modal components)
│   │   ├── BaseModal.tsx        # Shared wrapper (gradient bg, border, rounded-2xl)
│   │   ├── AddClubModal.tsx
│   │   ├── EditClubModal.tsx
│   │   ├── DeleteClubModal.tsx
│   │   ├── ShareClubModal.tsx   # Invite link generation
│   │   ├── NewSessionModal.tsx
│   │   ├── EditBookModal.tsx
│   │   ├── DiscussionModal.tsx
│   │   ├── DeleteDiscussionModal.tsx
│   │   ├── MemberModal.tsx
│   │   ├── AddMemberModal.tsx
│   │   ├── DeleteMemberModal.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── DiscordLinkModal.tsx
│   │   └── SignOutModal.tsx
│   ├── layout/              # Layout components
│   │   ├── AppShell.tsx     # Main layout wrapper (bottom mobile nav + desktop sidebar offset)
│   │   ├── AppSidebar.tsx   # Desktop left sidebar (220px) — clubs list, profile, sign out
│   │   ├── Sidebar.tsx      # Legacy sidebar (may be unused)
│   │   └── TopNavbar.tsx    # Top navigation bar
│   ├── ui/                  # Reusable UI primitives
│   │   ├── Avatar.tsx           # User avatar with initials fallback
│   │   ├── BookCover.tsx        # Book cover image with placeholder
│   │   ├── CoverSlot.tsx        # Low-level cover display
│   │   ├── GhostButton.tsx      # Transparent/text-only button
│   │   ├── KebabMenu.tsx        # Three-dot dropdown menu
│   │   └── RoleEyebrow.tsx      # Role badge (owner/admin/member)
│   ├── icons/
│   │   └── DiscordIcon.tsx
│   ├── Header.tsx           # Shared header (public pages)
│   ├── Footer.tsx           # Shared footer (with version number)
│   ├── KluvsSpinner.tsx     # Animated loading spinner
│   ├── KluvsHexBackground.tsx   # Hex background pattern (landing page)
│   ├── HowItWorksSection.tsx    # Feature highlight (landing page)
│   ├── BookSearchInput.tsx  # Debounced book search input
│   ├── BookInfo.tsx         # Book detail display
│   ├── DiscussionsTimeline.tsx
│   ├── MembersTable.tsx
│   ├── ScrollToTop.tsx      # Scroll-to-top on route change
│   └── ThemeToggle.tsx      # Dark/light/system theme toggle
├── content/
│   ├── privacy-policy.md    # Privacy policy content (edit to update)
│   ├── terms-of-use.md      # Terms of use content (edit to update)
│   └── data-deletion.md     # Data deletion content (edit to update)
├── contexts/
│   ├── AuthContext.tsx      # Authentication state management
│   └── ThemeContext.tsx     # Theme state (light/dark/system)
├── pages/
│   ├── LandingPage.tsx      # Public / — marketing, features, download links
│   ├── DiscordPage.tsx      # Public /discord
│   ├── PrivacyPolicy.tsx    # Public /privacy (shell — content in content/)
│   ├── TermsOfUse.tsx       # Public /terms (shell — content in content/)
│   ├── DataDeletion.tsx     # Public /delete-account (Google Play Console requirement)
│   ├── LoginPage.tsx        # /login — OAuth + email/password auth
│   ├── ProfilePage.tsx      # /me — user profile, stats, settings
│   ├── ClubsPage.tsx        # /clubs — club list (mobile-optimized)
│   ├── ClubDetailPage.tsx   # /clubs/:slug — full club view with sessions/discussions
│   ├── BooksPage.tsx        # /books — book search via Google Books API
│   ├── JoinPage.tsx         # /join/:token — invite link club-join handler
│   └── SetNewPasswordPage.tsx # password recovery (shown during PASSWORD_RECOVERY auth state)
├── types/
│   └── index.ts             # TypeScript type definitions
├── __tests__/               # Test suite (~1,093 tests across 44 files)
│   ├── setup.ts
│   ├── utils/
│   │   ├── mocks.ts             # Mock data (servers, clubs, members)
│   │   ├── test-utils.tsx       # Custom render functions (renderWithAuth, etc.)
│   │   └── supabase-mock.ts     # Supabase client mocks
│   ├── contexts/
│   │   ├── AuthContext.test.tsx
│   │   └── ThemeContext.test.tsx
│   ├── components/              # Component test files
│   │   ├── modals/              # 15 modal test files
│   │   ├── layout/
│   │   └── ui/
│   └── pages/                   # 11 page test files
├── App.tsx                  # Root component — domain-based router config
├── supabase.ts              # Supabase client + invokeFunction helper
├── version.ts               # Version string (used in Footer)
└── index.css                # Global styles with CSS variables
```

## Key Features

### Authentication System
- OAuth login with Discord and Google
- Email/password login and sign-up with email confirmation
- Password recovery flow via email link (triggers `PASSWORD_RECOVERY` auth state → `SetNewPasswordPage`)
- Session persistence via localStorage with auto token refresh (only if within 5 min of expiry)
- Network status tracking — offline banner shown via AppShell
- Role-based access control: per-club roles (`owner | admin | member`)
- Located in: `src/contexts/AuthContext.tsx`

### User Roles
- **Owner/Admin**: Full CRUD access to clubs, books, discussions, and members
- **Member**: Read-only access

Roles are per-club: `member?.clubs.find(c => c.id === clubId)?.role` returns `'owner' | 'admin' | 'member' | null`.

### Theme System
- Three modes: `'light'`, `'dark'`, `'system'`
- Persisted to localStorage (`kluvs-theme`)
- Applies via `dark` class on `<html>` (Tailwind `darkMode: 'class'`)
- CSS variables updated in `:root` and `.dark` selectors
- Located in: `src/contexts/ThemeContext.tsx`

### Main Components

#### AppShell
Primary layout wrapper for all authenticated pages:
- Bottom tab bar on mobile (Me, Clubs, Books)
- Desktop sidebar offset (220px left margin)
- Offline status banner

#### AppSidebar
Desktop left sidebar (220px fixed width):
- User profile section (avatar, name, stats)
- Edit profile and sign out buttons
- Clubs list with add club button (admin-only)

#### AuthContext
Manages all authentication state:
- `user` (Supabase User), `member` (local profile with clubs/roles)
- `loading`, `isPasswordRecovery`, `isOnline`
- Methods: `signInWithDiscord`, `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`, `resetPasswordForEmail`, `updatePassword`, `signOut`, `refreshMemberData`, `getRoleForClub`
- Prevents duplicate member lookups with `processingUserIdRef`
- Retry logic for member lookup (3 retries with exponential backoff — for DB trigger lag)

## Data Flow

### Authentication Flow
1. User initiates OAuth or email/password login
2. Supabase Auth handles redirect/token exchange
3. `onAuthStateChange` fires with new session
4. `AuthContext` calls `findMemberByUserId` via Edge Function
5. If member not found (new user), retries up to 3× with exponential backoff
6. Sets `user` and `member` state
7. App navigates to `/me` if logged in, `/login` if not

### Data Fetching
All data from Supabase Edge Functions via `invokeFunction<T>(path, options)` (see `supabase.ts`):
- `GET /club?id={clubId}&server_id={serverId}` - Club details
- `GET /member?user_id={userId}` - Member lookup
- `POST /member` - Create member
- `PUT /member` - Update member

## Important Patterns

### Role Checks
```tsx
const role = getRoleForClub(clubId)          // from useAuth()
const isAdmin = role === 'owner' || role === 'admin'

{isAdmin && <button onClick={handleAction}>Admin Action</button>}
```

### Loading States
- Initial app load: `AuthContext.loading` → full-screen spinner
- Page-level data: component-level `loading` state → inline spinner
- Both use `<KluvsSpinner>` for consistency

### Member Updates
After modifying member data, call `refreshMemberData()` (not page reload):
```tsx
const { refreshMemberData } = useAuth()
await updateMember(...)
refreshMemberData()
```

### Modals
All modals use `BaseModal` wrapper. Accept `isOpen: boolean` and `onClose: () => void` at minimum.

## Environment Variables
Required in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_FORCE_APP_DOMAIN=true   # optional — forces app-domain routing in local dev
```

## Routing Architecture

The app uses React Router v7 (`BrowserRouter`) in `App.tsx`. Routing is **domain-based**: the branch taken depends on `window.location.hostname`.

### App Domain (`app.*` subdomain or `VITE_FORCE_APP_DOMAIN=true`)
All routes are inside `AuthProvider`.

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Redirects → `/me` (if logged in) or `LoginPage` | Public |
| `/login` | `LoginPage` | Public |
| `/signup` | Redirects → `/login` | Public |
| `/join/:token` | `JoinPage` | Public |
| `/me` | `ProfilePage` | Protected |
| `/clubs` | `ClubsPage` | Protected |
| `/clubs/new` | `ClubsPage` with `openNewModal` | Protected |
| `/clubs/:slug` | `ClubDetailPage` | Protected |
| `/books` | `BooksPage` | Protected |
| `/*` | Redirects → `/me` | — |

Protected routes are wrapped: `ProtectedRoute → AppShell → <Outlet />`.  
`ProtectedRoute` shows `SetNewPasswordPage` during `PASSWORD_RECOVERY` auth state.

### Marketing Domain (all other hostnames)
No `AuthProvider`. No Supabase auth calls.

| Route | Component |
|-------|-----------|
| `/` | `LandingPage` |
| `/privacy` | `PrivacyPolicy` |
| `/terms` | `TermsOfUse` |
| `/delete-account` | `DataDeletion` |
| `/discord` | `DiscordPage` |
| `/*` | Redirects → `/` |

### Adding a New App-Domain Page
1. Create the component in `src/pages/`
2. Add a `<Route>` inside the `<Route element={<AppShell />}>` block in `App.tsx`
3. Wrap tests in `renderWithAuth()` from `src/__tests__/utils/test-utils.tsx`

### Adding a New Public Page
1. Create the component in `src/pages/`
2. Add a `<Route path="/your-path" element={<YourPage />} />` in the marketing-domain `<Routes>` block
3. Wrap tests in `<MemoryRouter>` (no AuthProvider needed)

## Updating Legal Pages
- **Privacy Policy**: edit `src/content/privacy-policy.md` — renders at `/privacy`
- **Terms of Use**: edit `src/content/terms-of-use.md` — renders at `/terms`
- **Data Deletion**: edit `src/content/data-deletion.md` — renders at `/delete-account`

All are plain Markdown. No code changes needed.

## Git Branches
- `main` - Production branch
- `develop` - Active development branch

## Pre-commit Hooks (Husky)
Husky runs validation on `pre-push`:

**Pre-push Hook** (`.husky/pre-push`) runs `npm run validate`:
- ESLint checks
- TypeScript type checking
- Full test suite
- To bypass (not recommended): `git push --no-verify`

## Testing

### Test Infrastructure
- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library + jest-dom matchers
- **Coverage Target**: 80%+ statements, functions, lines; 75%+ branches

### Running Tests
```bash
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage report
npm run validate          # Run lint + type-check + tests
```

### Test Structure
```
src/__tests__/
├── setup.ts
├── utils/
│   ├── mocks.ts              # Mock data generators
│   ├── test-utils.tsx        # renderWithAuth() and other helpers
│   └── supabase-mock.ts      # Supabase client mocks
├── contexts/
│   ├── AuthContext.test.tsx
│   └── ThemeContext.test.tsx
├── components/
│   ├── modals/               # 15 modal test files
│   ├── layout/
│   ├── ui/
│   └── [component].test.tsx
└── pages/                    # 11 page test files
```

### Writing Tests
1. Import test utilities: `import { render, screen, waitFor } from '../__tests__/utils/test-utils'`
2. Import mocks: `import { mockAdminMember, mockClub } from '../__tests__/utils/mocks'`
3. Mock Supabase client if needed (see `AuthContext.test.tsx` for examples)
4. Use `renderWithAuth()` for components that need AuthContext
5. Use `<MemoryRouter>` for components that use `Link` but don't need auth
6. Test user interactions with `@testing-library/user-event`
7. Use `waitFor()` for async state updates

### Test Coverage
Current coverage (as of 2026-05-27): **~1,093 tests across 44 test files**

**Tested components and pages:**
- **Contexts**: AuthContext, ThemeContext
- **Pages**: LandingPage, LoginPage, ProfilePage, ClubsPage, ClubDetailPage, BooksPage, JoinPage, SetNewPasswordPage, PrivacyPolicy, TermsOfUse, DataDeletion, DiscordPage
- **Layout**: AppShell, AppSidebar, Sidebar, TopNavbar
- **Core Components**: Header, Footer, KluvsSpinner, KluvsHexBackground, BookSearchInput, BookInfo, DiscussionsTimeline, MembersTable, ThemeToggle
- **UI Primitives**: Avatar, BookCover, CoverSlot, GhostButton, KebabMenu, RoleEyebrow
- **Modals**: All 15 modals

**Coverage Status:**
- ✅ All components have test files
- ✅ 80%+ statements, functions, and lines coverage
- ✅ 75%+ branch coverage

## Common Tasks

### Adding a New Admin-Only Feature
1. Get role via `getRoleForClub(clubId)` from `useAuth()`
2. Conditionally render using `{isAdmin && ...}`
3. Write tests for both admin and member states

### Creating a New Modal
1. Create modal component in `src/components/modals/`
2. Use `BaseModal` as the wrapper
3. Accept `isOpen`, `onClose` props at minimum
4. Add modal state in parent component
5. Write tests for open/close, validation, and submission

### Fetching Data
1. Use `invokeFunction<T>(path, options)` from `supabase.ts`
2. Handle loading state with component-level `useState`
3. Wrap in try/catch for errors
4. Mock Edge Function responses in tests

## Version Management

The app version is defined in `src/version.ts` and displayed in the Footer component. When creating a release:
1. Update `src/version.ts` with the new version
2. Update `package.json` version field
3. Create a git tag: `git tag v0.x.x`
4. CI/CD release automation creates a GitHub release automatically

Current version: **0.9.0**

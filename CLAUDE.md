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
- **Authentication**: OAuth via Discord and Google
- **Testing**: Vitest + React Testing Library (469 tests across 25 files)
- **Pre-commit Hooks**: Husky (validates on push)

## Backend API Compatibility
- **Backend Repository**: `kluvs-backend`
- **Compatible with migrations up to**: `20251130205915_add_metadata_fields.sql`
- **Last synced**: 2026-04-26
- **Current version**: 0.3.1
- **Sync notes**: 
  - Fixed member creation to prevent duplicates on OAuth signup
  - Added new optional fields to TypeScript types: `user_id`, `handle`, `created_at` (Member); `id`, `page_count` (Book); `founded_date` (Club)
  - Release automation via CI/CD

## Project Structure
```
src/
├── components/
│   ├── modals/              # Modal dialogs (8+ modal components)
│   │   ├── AddClubModal.tsx
│   │   ├── DeleteClubModal.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── SignOutModal.tsx
│   │   ├── DiscussionModal.tsx
│   │   ├── NewSessionModal.tsx
│   │   ├── EditBookModal.tsx
│   │   ├── MemberModal.tsx
│   │   └── Delete*.tsx        # Delete confirmation modals
│   ├── layout/              # Layout components
│   │   ├── Sidebar.tsx      # Main sidebar
│   │   └── TopNavbar.tsx    # Top navigation bar
│   ├── Header.tsx           # Shared header (public pages)
│   ├── Footer.tsx           # Shared footer (with version number)
│   ├── ClubsSidebar.tsx     # Left sidebar with clubs list & profile
│   ├── CurrentReadingCard.tsx
│   ├── DiscussionsTimeline.tsx
│   ├── MembersTable.tsx
│   └── ThemeToggle.tsx      # Dark/light theme toggle
├── content/
│   ├── privacy-policy.md    # Privacy policy content (edit to update the policy)
│   ├── terms-of-use.md      # Terms of use content (edit to update the terms)
│   └── data-deletion.md     # Account/data deletion content (edit to update the page)
├── contexts/
│   └── AuthContext.tsx      # Authentication state management
├── pages/
│   ├── LandingPage.tsx      # Public / route — marketing, download links, contact form
│   ├── DiscordPage.tsx      # Public /discord route
│   ├── ClubsDashboard.tsx   # Authenticated dashboard view (/app)
│   ├── LoginPage.tsx        # OAuth login page (/app when logged out)
│   ├── PrivacyPolicy.tsx    # Public /privacy route (shell only — content lives in content/)
│   ├── TermsOfUse.tsx       # Public /terms route (shell only — content lives in content/)
│   └── DataDeletion.tsx     # Public /delete-account route — required by Google Play Console
├── types/
│   └── index.ts             # TypeScript type definitions
├── __tests__/               # Test suite (25 test files, 469 tests)
│   ├── setup.ts
│   ├── utils/
│   ├── contexts/
│   ├── components/
│   ├── pages/
│   └── [various].test.tsx
├── App.tsx                  # Root component — router config only
├── supabase.ts              # Supabase client configuration
├── version.ts               # Version string (used in Footer)
└── index.css                # Global styles with CSS variables
```

## Key Features

### Authentication System
- OAuth login with Discord and Google
- Session persistence via localStorage
- Auto token refresh
- Role-based access control (admin/member)
- Located in: `src/contexts/AuthContext.tsx`

### User Roles
- **Admin**: Full CRUD access to clubs, books, discussions, and members
- **Member**: Read-only access

The `isAdmin` flag is derived from `member.role === 'admin'` and propagated throughout components.

### Main Components

#### Header
Shared header component used across all public pages:
- Logo and branding
- Optional "Open App" button (shown on public pages)
- Sticky positioning with navigation

#### Footer
Shared footer component displayed on all pages:
- Copyright notice
- Links to Privacy Policy and Terms of Use
- Version number display (v0.3.1)

#### ClubsDashboard
The primary view showing:
- Server selector (admin only, when multiple servers)
- Club details with current reading session
- Discussions timeline
- Members table
- Loading states for data fetching

#### ClubsSidebar
Left sidebar containing:
- User profile section (name, stats, admin badge)
- Edit profile and sign out buttons
- List of clubs for selected server
- Add/delete club buttons (admin only)

#### AuthContext
Manages all authentication state:
- User session from Supabase Auth
- Member data lookup/creation via Edge Functions
- Prevents duplicate member lookups with `processingUserIdRef`
- Auto-creates member records for new OAuth users

## Data Flow

### Authentication Flow
1. User clicks "Sign in with Discord/Google"
2. OAuth redirect to provider
3. Provider redirects back with auth code
4. Supabase exchanges code for session tokens
5. `AuthContext` detects new user via `onAuthStateChange`
6. Looks up member by `user_id` via Edge Function
7. Creates new member if none exists
8. Sets `user` and `member` state
9. App shows `ClubsDashboard` (if logged in) or `LoginPage` (if not)

### Data Fetching
All data comes from Supabase Edge Functions:
- `GET /club?id={clubId}&server_id={serverId}` - Club details
- `GET /member?user_id={userId}` - Member lookup
- `POST /member` - Create member
- `PUT /member` - Update member

## Important Patterns

### Admin-Only Features
Replace `import.meta.env.VITE_DEV === 'true'` with `isAdmin` prop:
```tsx
{isAdmin && (
  <button onClick={handleAction}>Admin Action</button>
)}
```

### Loading States
- Initial app load: `AuthContext.loading` shows spinner
- Club data fetch: `clubLoading` state in ClubsDashboard
- Both use consistent spinner UI

### Member Updates
After updating member data, use `refreshMemberData()` from AuthContext instead of page reload:
```tsx
const { refreshMemberData } = useAuth()
await updateMember(...)
refreshMemberData()
```

## Environment Variables
Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Routing Architecture

The app uses React Router v7 (`BrowserRouter`) in `App.tsx`.

### Route Structure
- `/` — Public, no auth required → `LandingPage` (with Header + Footer)
- `/discord` — Public, no auth required → `DiscordPage` (with Header + Footer)
- `/privacy` — Public, no auth required → `PrivacyPolicy` (with Header + Footer, content from `src/content/privacy-policy.md`)
- `/terms` — Public, no auth required → `TermsOfUse` (with Header + Footer, content from `src/content/terms-of-use.md`)
- `/delete-account` — Public, no auth required → `DataDeletion` (with Header + Footer, Google Play Console requirement)
- `/app/*` — Authenticated → Inside `AuthProvider` (shows LoginPage if not logged in, else ClubsDashboard)

**Key rules:**
- All public pages use the `Header` and `Footer` components
- `AuthProvider` is scoped only to `/app/*`
- Public pages never trigger Supabase auth calls
- OAuth `redirectTo` is set to `${window.location.origin}/app`

### Adding a New Public Page
1. Create the component in `src/pages/`
2. Add a `<Route path="/your-path" element={<YourPage />} />` **above** the `/*` route in `App.tsx`
3. Wrap tests in `<MemoryRouter>` (no AuthProvider needed)

### Adding a New Authenticated Page
1. Create the component in `src/pages/`
2. It will automatically be served under the `/app/*` route (inside AuthProvider)
3. Wrap tests in `renderWithAuth()` from `src/__tests__/utils/test-utils.tsx`

## Updating Legal Pages
- **Privacy Policy**: edit `src/content/privacy-policy.md` — renders at `/privacy`
- **Terms of Use**: edit `src/content/terms-of-use.md` — renders at `/terms`
- **Data Deletion**: edit `src/content/data-deletion.md` — renders at `/delete-account`

All are plain Markdown. No code changes needed.

## Git Branches
- `main` - Production branch
- `develop` - Active development branch

## Pre-commit Hooks (Husky)
Husky is configured to run validation on `pre-push`:

**Pre-push Hook** (`.husky/pre-push`)
- Runs `npm run validate` which includes:
  - ESLint checks
  - TypeScript type checking
  - Test suite (469 tests)
- Prevents pushing code that fails any checks
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
├── setup.ts                      # Global test setup
├── utils/
│   ├── mocks.ts                  # Mock data (servers, clubs, members)
│   ├── test-utils.tsx            # Custom render functions
│   └── supabase-mock.ts          # Supabase client mocks
├── contexts/
│   └── AuthContext.test.tsx      # ✅ 18 tests (100% coverage)
├── components/
│   ├── ClubsSidebar.test.tsx
│   ├── MembersTable.test.tsx
│   └── modals/
│       └── AddClubModal.test.tsx
```

### Writing Tests
1. Import test utilities: `import { render, screen, waitFor } from '../__tests__/utils/test-utils'`
2. Import mocks: `import { mockAdminMember, mockClub } from '../__tests__/utils/mocks'`
3. Mock Supabase client if needed (see AuthContext.test.tsx for examples)
4. Use `renderWithAuth()` for components that need AuthContext
5. Use `<MemoryRouter>` for components that use `Link` or other router primitives but don't need auth
6. Test user interactions with `@testing-library/user-event`
7. Use `waitFor()` for async state updates

### Test Coverage
Current coverage (as of 2026-04-26): **469 tests across 25 test files**

**Fully Tested Components:**
- **Contexts**: AuthContext (18+ tests)
- **Pages**: LandingPage, PrivacyPolicy, TermsOfUse, DataDeletion, DiscordPage, ClubsDashboard (80+ tests)
- **Core Components**: Header (13 tests), Footer, Sidebar, TopNavbar, MembersTable, CurrentReadingCard, DiscussionsTimeline, ThemeToggle (100+ tests)
- **Modals**: AddClubModal, DeleteClubModal, EditProfileModal, SignOutModal, DiscussionModal, NewSessionModal, EditBookModal, MemberModal, and delete modals (200+ tests)

**Coverage Status:**
- ✅ All components have test files
- ✅ 80%+ statements, functions, and lines coverage
- ✅ 75%+ branch coverage

## Common Tasks

### Adding a New Admin-Only Feature
1. Pass `isAdmin` prop from parent component
2. Conditionally render using `{isAdmin && ...}`
3. Test with both admin and member roles
4. Write tests for both states

### Creating a New Modal
1. Create modal component in `src/components/modals/`
2. Accept `isOpen`, `onClose` props
3. Use consistent styling (gradient bg, border, rounded-2xl)
4. Add state for modal in parent component
5. Write tests for open/close, validation, submission

### Fetching Data
1. Use Supabase Edge Functions via `supabase.functions.invoke()`
2. Handle loading state
3. Handle errors with try/catch
4. Log requests for debugging (see ClubsDashboard for examples)
5. Mock Edge Function responses in tests

## Version Management

The app version is defined in `src/version.ts` and displayed in the Footer component. When creating a release:
1. Update `src/version.ts` with the new version
2. Update `package.json` version field
3. Create a git tag: `git tag v0.x.x`
4. CI/CD release automation creates a GitHub release automatically

Current version: **0.3.1** (synced in package.json)

**Note:** `src/version.ts` shows v0.3.0 but should be updated to 0.3.1 to match package.json.

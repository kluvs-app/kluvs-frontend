---
paths:
  - "src/__tests__/**"
  - "vitest.config.ts"
  - "codecov.yml"
  - ".github/workflows/**"
  - "package.json"
---

# Testing & CI

## Running
- Run `npx vitest run <path> --reporter=dot` or `npm run test:run -- --reporter=dot`, and read only the summary and the failures.
- Never run watch mode (`npm run test`) or `test:ui`.
- `npm run test:coverage` enforces `coverage.thresholds` in `vitest.config.ts`: 80% lines, functions and statements, 75% branches. Codecov separately gates 80% project and 75% patch (`codecov.yml`).
- Keep `type-check` as `tsc -b`. The root `tsconfig.json` has `files: []` and only project references, so `tsc --noEmit` against it checks nothing and always passes.

## CI
- There are no git hooks: no `.husky/`, and Husky is not a dependency. A successful `git push` runs nothing.
- The only gate is the CI **Test & Coverage** job in `.github/workflows/ci.yml`. It runs `npm run validate` and then `test:coverage` plus a Codecov upload, on pushes and PRs to `main` and `develop`.
- The **Build** job runs only on pushes to `main` or `develop`.
- Before you report green, run `npm run validate` locally or check `gh pr checks <pr>`.
- Regen PRs (`chore/regenerate-api-types`) get only the in-workflow type-check. See `codegen.md`.

## Layout
- `src/__tests__/` mirrors `src/`: `components/{modals,layout,ui}/`, `pages/`, `contexts/`, `services/`, `utils/`, `App.test.tsx`, `supabase.test.ts`.
- **Every new component and modal gets a test file.** Every page and context already has one.
- `setup.ts` already handles these globally, so don't re-mock them:
  - jest-dom matchers, plus `cleanup()` and `vi.clearAllMocks()` after each test
  - stub Supabase env vars
  - in-memory `localStorage`/`sessionStorage` (newer Node ships a broken global)
  - `matchMedia`, `IntersectionObserver`, `ResizeObserver`, and `crypto.randomUUID` (returns `'test-uuid-123'`)
- `vitest.d.ts` augments Vitest's `Assertion` type with the jest-dom matchers. Without it, `toBeInTheDocument()` and the others fail type-check.

## Utilities (`src/__tests__/utils/`)
- `test-utils.tsx` re-exports RTL and replaces `render` with a wrapper that adds `ThemeProvider` and `AuthProvider`. Pass `{ withAuth: false }` to skip auth.
  - Import `render` and `screen` from here when the tree needs the real providers.
  - Pages that use the router still wrap themselves in `<MemoryRouter>`.
- `mocks.ts` holds the shared fixtures: `mockAdminMember`, `mockRegularMember`, `mockClub`, `mockServer`, … Reuse them instead of inlining objects.
- `supabase-mock.ts` provides a full mock client (only `AuthContext.test.tsx` uses it).

## Mocking patterns
- **Supabase / Edge Functions:** route `invokeFunction` through the mocked client so that tests assert on `functions.invoke`:
  ```ts
  vi.mock('../../../supabase', () => {
    const mockClient = { functions: { invoke: vi.fn() } }
    return {
      supabase: mockClient,
      invokeFunction: (...args: any[]) => mockClient.functions.invoke(...args),
    }
  })
  ```
  Page tests that use the real `AuthProvider` also stub `auth: { getSession, signInWithOAuth, signOut, onAuthStateChange }` and `getAvatarUrl`.
- **Components and modals** mock `useAuth` instead of rendering a real provider:
  `vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }))`.
- **Pages** stub child modals as minimal `role="dialog"` elements that expose callback buttons (`data-testid="modal-<entity>-save"`). That way the page test covers the wiring and not the modal internals (see `pages/ClubDetailPage.test.tsx`).
- **Public pages** render inside `<MemoryRouter><ThemeProvider>` and need no auth (see `pages/PrivacyPolicy.test.tsx`).

## Style
- Prefer `getByRole` and `getByLabelText` over `getByTestId`.
- Use `@testing-library/user-event` for interactions and `waitFor` for async state.
- Test user-visible behavior: loading, success, the error/`onError` path, and admin vs member states where relevant.

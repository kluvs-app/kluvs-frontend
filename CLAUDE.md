# Kluvs Frontend

React + TypeScript web client for Kluvs, a book club app. Two surfaces are served from one bundle and picked by hostname:
- the **app** (`app.*`): clubs, sessions, discussions, members, books, profile.
- the **marketing site** (everything else): landing, Discord, FAQ, legal pages.

All data comes from Supabase Edge Functions in `kluvs-backend`. The wire types are generated from the canonical OpenAPI spec in `kluvs-api`.

**Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 3 (+ `@tailwindcss/typography`), React Router 7, `react-markdown`, Supabase JS (Auth + Functions + Storage), Vitest 4 + React Testing Library.

## Commands

```bash
npm run test:run                          # full suite once
npx vitest run <path> --reporter=dot      # one file / folder
npm run test:coverage                     # suite + coverage thresholds (80/80/75/80)
npm run type-check                        # tsc -b (never replace with tsc --noEmit)
npm run lint                              # eslint (lint:fix to autofix)
npm run validate                          # lint + type-check + test:run (what CI runs)
npm run build                             # tsc -b && vite build
npm run api:generate                      # regenerate src/types/api.gen.ts from api/openapi.json; API_SPEC_REF=<sha|branch> to try a spec PR
```

**For agents:** keep test output small. Pass `--reporter=dot` and read only the summary and the failures. Never run `npm run dev`, `npm run test` (watch mode) or `npm run test:ui`; the user runs those locally.

## Absolute rules

- **Never read `.env*` files or any secrets file**, not even to check that one exists. If you need an env value, ask the user. Known vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OAUTH_REDIRECT_URL`, and optionally `VITE_FORCE_APP_DOMAIN=true` (forces app-domain routing locally).
- **Never hand-edit `src/types/api.gen.ts` or `api/openapi.json`.** If the spec is wrong, fix it upstream. See `codegen.md`.
- **A successful `git push` proves nothing.** There are no git hooks. CI is the only gate. Before you call the suite green, run `npm run validate` or check `gh pr checks <pr>`.
- **Never create a Member from the frontend.** A backend trigger does it. See `auth.md`.
- **PRs target `develop`** (`gh pr create --base develop`). `main` is production.
- **Android comes first** whenever Kluvs platforms are listed together. See `ui-and-copy.md`.
- **Never commit to `chore/regenerate-api-types`.** CI force-pushes that branch.

## Where things live

```
src/
├── App.tsx            # domain-based router (app vs marketing)
├── supabase.ts        # Supabase client + invokeFunction<T>() (every Edge Function call)
├── index.css          # theme tokens (--color-*) + t-* typography families
├── components/
│   ├── ui/            # generic primitives, no domain knowledge (Button, Avatar, KebabMenu…)
│   ├── modals/        # BaseModal + one file per modal
│   ├── layout/        # AppShell, AppSidebar, MobileTopBar
│   ├── icons/         # SVG icon components
│   └── *.tsx          # domain-aware components (BookCard, ShelfPill, MemberBadge…)
├── pages/             # one component per route
├── contexts/          # AuthContext, ThemeContext, MobileTopBarContext
├── types/             # api.gen.ts (generated) + index.ts (alias layer; import from here)
├── content/           # legal Markdown + faq.ts
├── constants/         # marketingStyles.ts, shelves.ts
├── utils/             # dates.ts (DATE-only parsing), domainNav.ts
└── __tests__/         # mirrors src/; utils/ has test-utils, mocks, supabase-mock
api/openapi.json       # committed spec snapshot (generated)
public/                # static assets, sitemap.xml, brand assets copied from design-system
scripts/               # generate-api.mjs (npm run api:generate)
tools/                 # release scripts
```

## Rules, skills and references

Path-scoped rules in `.claude/rules/` load automatically when you touch matching files:

| Rule | Covers |
|---|---|
| `auth.md` | AuthContext, sign-in providers, member lookup, per-club roles |
| `data-fetching.md` | `invokeFunction`, error handling, query params, loading state |
| `codegen.md` | generated wire types, alias layer, the spec → regen PR pipeline |
| `routing.md` | domain routing, route tables, adding routes, SEO/robots, deep-link contracts |
| `components-and-modals.md` | component structure, `ui/` vs domain components, modal contract |
| `styling-and-design-system.md` | colors, typography, buttons, motion, theme, brand assets |
| `testing.md` | test utilities, mocking patterns, coverage, CI |
| `ui-and-copy.md` | platform ordering, component grouping, legal/FAQ content |

Skill: **`new-page`** adds a marketing or app-domain page end to end: content, route, sitemap, nav, tests.

The design system is the source of truth for tokens and component specs: `../design-system/tokens.json` and `../design-system/docs/*.md` (buttons, typography, modal, avatars, colors, …). Don't hardcode values that the design system defines.

## Branches and releases

- Work branches come off `develop`.
- Releases run through `tools/release-process.sh <X.Y.Z>`. It cuts `release/X.Y.Z` from `develop`, bumps `package.json` and `src/version.ts`, merges into `main` and back into `develop`, tags `X.Y.Z` (no `v` prefix) and pushes.
- The tag triggers `.github/workflows/release.yml`, which creates the GitHub release.
- Never edit `src/version.ts` by hand.

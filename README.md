# Kluvs: Frontend

[![CI](https://github.com/kluvs-app/kluvs-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/kluvs-app/kluvs-frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/kluvs-app/kluvs-frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/kluvs-app/kluvs-frontend)

The Kluvs web client, built with React and TypeScript. One bundle serves two surfaces, chosen by hostname:
- **the app** (`app.kluvs.com`): manage book clubs, reading sessions, discussions, members and your bookshelf.
- **the marketing site** (`kluvs.com`): landing, Discord bot, FAQ and legal pages.

Data comes from Supabase Edge Functions (`kluvs-backend`). Wire types are generated from the OpenAPI spec published by `kluvs-api` ([docs.kluvs.com](https://docs.kluvs.com)).

## Quick start

```bash
npm install
# create .env.local (see below)
npm run dev        # http://localhost:5173
```

### Prerequisites
- Node.js 20+ (CI uses 20.x)
- A Supabase project (URL + anon key)

### Environment
Create `.env.local` in the project root. It is gitignored; never commit it.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OAUTH_REDIRECT_URL=http://localhost:5173
VITE_FORCE_APP_DOMAIN=true   # optional: serve the app (not the marketing site) on localhost
```

Find the Supabase values in the Supabase Dashboard under Project Settings → API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run type-check` | TypeScript (`tsc -b`) |
| `npm run test` | Tests in watch mode |
| `npm run test:run` | Tests once |
| `npm run test:coverage` | Tests with coverage (thresholds: 80% lines/functions/statements, 75% branches) |
| `npm run validate` | lint + type-check + tests (what CI runs) |
| `npm run api:generate` | Regenerate `src/types/api.gen.ts` from `api/openapi.json` |

## Project layout

```
src/
├── App.tsx          # domain-based routing (app vs marketing)
├── supabase.ts      # Supabase client + invokeFunction helper
├── components/      # ui/ primitives, modals/, layout/, icons/, domain components
├── pages/           # one component per route
├── contexts/        # Auth, Theme, MobileTopBar
├── types/           # api.gen.ts (generated) + index.ts (aliases)
├── content/         # legal Markdown + FAQ
└── __tests__/       # Vitest + React Testing Library, mirrors src/
api/openapi.json     # committed spec snapshot (generated)
tools/               # release scripts
```

## Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS 3 · React Router 7 · Supabase (Auth, Edge Functions, Storage) · Vitest + React Testing Library.

Auth supports Discord, Google and Apple OAuth plus email/password. Roles are per club: owners and admins manage the club, members are read-only. Member profiles are created by a backend trigger on sign-up.

Styling follows the Kluvs design system (`design-system` repo: tokens, typography families, component specs).

## Contributing

1. Branch off `develop` (`feature/…`, `bug/…`, `chore/…`).
2. Run `npm run validate` before pushing. There are no git hooks; CI (**Test & Coverage**) is the gate.
3. Open a PR against `develop`, with a [Conventional Commits](https://www.conventionalcommits.org/) title.

API types are never edited by hand. When the spec changes upstream, a GitHub Action opens a regeneration PR automatically.

Conventions for code structure, styling, data fetching and testing live in [`CLAUDE.md`](CLAUDE.md) and [`.claude/rules/`](.claude/rules/).

## Releases

```bash
tools/release-process.sh 1.2.3
```

The script cuts `release/1.2.3` from `develop`, bumps `package.json` and `src/version.ts`, merges into `main` and back into `develop`, tags `1.2.3`, and pushes. The tag triggers the Release workflow, which publishes the GitHub release.

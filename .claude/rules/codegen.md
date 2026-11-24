---
paths:
  - "api/**"
  - "src/types/**"
  - ".github/workflows/regenerate-api-types.yml"
---

# Generated API types

Wire types are generated from the canonical OpenAPI spec in `kluvs-api`. They are never hand-written.

## Files
- `api/openapi.json`: committed snapshot of the spec. Generated; never edit it.
- `src/types/api.gen.ts`: produced by `npm run api:generate` (openapi-typescript, types only). It is committed and excluded from ESLint. Never edit it; a PreToolUse hook blocks hand edits to both files.
- `src/types/index.ts`: the alias layer (`export type Club = Schemas['Club']`, plus response envelopes like `ClubUpdateResponse` and `ShelfListResponse`).
  - App code imports types from `src/types`, never from `api.gen.ts`.
  - Aliases keep the app's historical names where they differ from the spec (e.g. `SessionMember` maps to `SessionParticipantSummary`).
  - `Member` is `Omit<MemberGetResponse, 'clubs'> & { clubs?: MemberClub[] }` because openapi-typescript renders `allOf` overrides as intersections. Keep that pattern for other `allOf` redefinitions.
- UI-only types (props, form state, `SearchResult`, …) stay local to their components.

## When the spec is wrong
Fix the backend `@openapi` annotation in `kluvs-backend` (generator: `kluvs-backend/tools/generate-docs.ts`) and let the fix flow through the pipeline. Don't patch the types here.

## The pipeline
1. A backend release (merge to backend `main`) publishes the spec to `kluvs-api`.
2. When a spec PR merges to `main` there, `notify-consumers.yml` dispatches `api-spec-updated` to this repo.
3. `.github/workflows/regenerate-api-types.yml` fetches the spec at that SHA, runs `api:generate`, and opens a PR to `develop` from `chore/regenerate-api-types`.
   - That branch is a CI force-push target. Never commit manual work there.
   - The PR is opened by the `kluvs-spec-bot` GitHub App, so regular CI (lint, type-check, tests, build) runs on it automatically.
4. A human reviews and merges it. If type-check fails, the app code needs changing in a separate PR, **stacked on the regen PR**:
   - Cut the fix branch from `origin/chore/regenerate-api-types` and open it with `--base chore/regenerate-api-types`, so its diff shows only the app-code fixes.
   - Merge order: squash-merge the regen PR, retarget the fix PR to `develop`, then squash-merge it. The spec update and its fixes land as two consecutive commits.
   - Don't cut the fix branch from `develop` and merge the regen branch into it. That hides the regen PR inside the fix PR.

# Testing & CI

- There is no working git hook. `.husky/` does not exist and Husky is not a dependency, so a successful `git push` runs nothing. Never report tests, lint or type-check as passing because a push went through.
- The only automated gate is CI's **Test & Coverage** job (`.github/workflows/ci.yml` → `npm run validate` + coverage). Before you say the suite is green, run `npm run validate` locally or wait for `gh pr checks <pr>`.
- Keep `type-check` as `tsc -b`. The root `tsconfig.json` has `files: []` and only project references, so `tsc --noEmit` against it checks nothing and always passes.
- Regen PRs (`chore/regenerate-api-types`) get only the in-workflow type-check. Lint and tests don't run on them. To get full CI, close and reopen the PR from the GitHub UI. Don't push a commit to that branch, because it is force-pushed.

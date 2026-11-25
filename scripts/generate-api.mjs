// Generates src/types/api.gen.ts from the OpenAPI spec (`npm run api:generate`).
//
//   1. API_SPEC env var: an http(s):// URL or a local file path.
//   2. API_SPEC_REF env var: a kluvs-api commit SHA or branch.
//      Both overrides are for checking the app against a spec before it merges.
//   3. Otherwise api/openapi.json, saved here by the Regenerate API Types workflow.

import { spawnSync } from 'node:child_process'

const SAVED_SPEC_PATH = 'api/openapi.json'
const OUTPUT = 'src/types/api.gen.ts'

function specSource() {
  const { API_SPEC, API_SPEC_REF } = process.env
  if (API_SPEC) return API_SPEC
  if (API_SPEC_REF) return `https://raw.githubusercontent.com/kluvs-app/kluvs-api/${API_SPEC_REF}/openapi.json`
  return SAVED_SPEC_PATH
}

const source = specSource()
if (source !== SAVED_SPEC_PATH) {
  console.warn(`⚠️  Using the spec from ${source}, not ${SAVED_SPEC_PATH}. Don't commit types generated from it.`)
}

const { status, error } = spawnSync('openapi-typescript', [source, '-o', OUTPUT], { stdio: 'inherit' })
if (error) throw error
process.exit(status ?? 1)

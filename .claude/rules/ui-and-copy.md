---
paths:
  - "src/**"
  - "public/**"
  - "index.html"
  - "README.md"
---

# UI, copy & content

## Platform ordering
- Whenever Kluvs platforms appear together, Android comes first. This covers copy ("Android, iPhone, and the web"), store badges (Google Play left, App Store right), platform cards, meta/OG descriptions and legal text. Don't reorder to put iOS first.

## Component design
- Group shared components by what they *represent*, not by how they render. A persisted value selector (`ShelfPill`), a one-shot action (`TriggerPill`) and a command menu (`KebabMenu`) stay separate even though they share pill or popover mechanics. The same goes for an editable field vs. a read-only picker field.
- Before you propose merging N components into one, describe each in a single phrase ("a value the user picked" vs. "an action the user can trigger"). If the phrases differ, keep them separate.

## Legal pages & FAQ content
- The legal pages are plain Markdown. Editing them needs no code change:
  - `src/content/privacy-policy.md` renders at `/privacy`.
  - `src/content/terms-of-use.md` renders at `/terms`.
  - `src/content/data-deletion.md` renders at `/delete-account`.
- The FAQ is `src/content/faq.ts`, rendered at `/faq`. Answers are Markdown strings. Item ids are a deep-link contract; see `routing.md`.
- Routes that other platforms depend on (`/delete-account`, `/clubs/:slug` as id) are documented in `routing.md`.

---
paths:
  - "src/**"
  - "public/**"
  - "index.html"
  - "README.md"
---

# UI, copy & public surfaces

## Platform ordering
- Whenever Kluvs platforms appear together, Android comes first. This covers copy ("Android, iPhone, and the web"), store badges (Google Play left, App Store right), platform cards, meta/OG descriptions and legal text. Don't reorder to put iOS first.

## Component design
- Group shared components by what they *represent*, not by how they render. A persisted value selector (`ShelfPill`), a one-shot action (`TriggerPill`) and a command menu (`KebabMenu`) stay separate even though they share pill or popover mechanics. The same goes for an editable field vs. a read-only picker field.
- Before you propose merging N components into one, describe each in a single phrase ("a value the user picked" vs. "an action the user can trigger"). If the phrases differ, keep them separate.

## Routes other platforms depend on
- Keep `/delete-account` (`DataDeletion`) even though in-app deletion exists (`DeleteAccountModal`). The Google Play listing requires a public deletion page that works without signing in.
- `/clubs/:slug` takes the club **id**. There are no name-based slugs until the backend adds a `slug` field. Links elsewhere build `/clubs/${club.id}`.

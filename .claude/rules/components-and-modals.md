---
paths:
  - "src/components/**"
  - "src/pages/**"
---

# Components & modals

## Structure
- One component per file, written as `export default function Name(...)`. Props go in a local, non-exported `interface NameProps`. The only named exports are the icon sets in `components/icons/`.
- Use relative imports. The `@` alias exists only in `vitest.config.ts` and isn't used.
- Placement:
  - `components/ui/` holds **generic primitives with no domain knowledge**: Button, Avatar, AvatarStack, BookCover, CoverSlot, KebabMenu, TriggerPill, RoleEyebrow. They take plain props and never call `useAuth`, `invokeFunction` or domain types beyond simple display values.
  - **Domain-aware components** (ShelfPill, BookCard, MemberBadge, ProgressRow, DiscussionsTimeline, …) live in top-level `components/`.
  - Layout chrome goes in `components/layout/`. Modals go in `components/modals/`.
- Group shared components by what they represent, not by how they render. See `ui-and-copy.md`.
- Every new component and every new modal gets a test file. See `testing.md`.

## Modals
- Every modal wraps `BaseModal` with these props:
  - `isOpen: boolean`, `onClose: () => void`
  - `title` (rendered as the eyebrow header), plus `titleVariant="danger"` for destructive modals
  - `labelId="modal-title-<kebab-name>"`
  - `loading` (blocks Escape and the close button)
  - `footer` and `dangerZone` when needed
  - `maxWidth` is `'sm'` (the default) or `'md'`
- The parent owns the open state (`const [showXModal, setShowXModal] = useState(false)`) and any "editing/to-delete" entity. The modal guards with `if (!entity) return null` when it needs one.
- Success callbacks are named `on<Entity><PastVerb>`: `onClubDeleted`, `onSessionCreated`, `onMemberSaved`, `onDiscussionSaved`. Call `onClose()` and then the success callback.
- **Modals don't render their own error state.** They report failures through an `onError: (message: string) => void` prop, and the parent displays the error. Clear it with `onError('')` at the start of a submit.
  - Known legacy violations still keep local error state (follow-up, don't copy them): AddMemberModal, DeleteAccountModal, DiscordLinkModal, EditProfileModal, EndSessionModal, MemberModal, ReadingLogModal, ReadingProgressModal, ShareClubModal.
- Footer layout:
  - `<Button variant="text">Cancel</Button>` on the left, and `primary` (or `danger` for destructive actions) on the right.
  - Both are disabled while `loading`.
  - The confirm button shows `<KluvsSpinner size={14} color="var(--color-on-primary)" />` and a progress label ("Deleting…") while loading.
  - Disable Save when nothing changed or the input is invalid.
- The anatomy spec (header, body, danger zone, footer, field labels, warning boxes) is `../design-system/docs/modal.md`. `BaseModal` implements it, so don't restyle the shell.
- Write tests for open/close, validation, submit success, and the `onError` path.

# Kluvs Frontend — Design Decisions

Design reference for the warm-dark UI. Covers interaction patterns, component conventions, and visual rules. Keep this updated as decisions are made.

---

## Motion

All transitions use `cubic-bezier(0.2, 0.8, 0.2, 1)` (the `--kluvs-ease` token) unless noted.

| Duration | Token | Use |
|---|---|---|
| 120ms | `--kluvs-dur-fast` | Button hover/active, overlay fade, avatar hover |
| 180ms | `--kluvs-dur-base` | Modal enter/exit, panel slide |
| 260ms | `--kluvs-dur-screen` | Page-level transitions |

**Default**: when in doubt, use 120ms. It reads as snappy without feeling abrupt.

---

## Buttons

### Primary (copper fill)
- Background: `#D16D30` → hover `#B85A22`
- Text: white
- Radius: `--kluvs-radius-btn` (12px)
- Use for: the one main action in a view (Save, Create, Confirm)

### Outlined
- Background: transparent → hover `rgba(242,237,229,0.06)`
- Border: `1px solid rgba(242,237,229,0.14)`
- Text: `--kluvs-warm-fg-primary`
- Radius: 8px
- Use for: secondary actions that sit next to or away from a primary (Edit profile, Cancel when paired with a text cancel)
- Active: `scale(0.97)`, 120ms

### Text / ghost
- No border, no background → hover: color shifts to primary text
- Use for: Cancel in modal footers, low-emphasis dismissals
- No scale animation — too subtle to reward with motion

---

## Hover & Click Animations

### Cards (ClubCard, shelf rows if made interactive)
- Hover: `filter: brightness(1.1)`, 120ms
- Active/click: `scale(0.98)` + `brightness(1.05)`, 80ms
- Implementation: `hover:brightness-110 active:scale-[0.98] active:brightness-105` with `transition: filter 120ms, transform 80ms`

### Outlined buttons (e.g. Edit profile)
- Hover: `background: rgba(242,237,229,0.06)`, 120ms — fills the button shell subtly
- Active: `scale(0.97)`, 120ms
- Implementation: `hover:bg-[rgba(242,237,229,0.06)] active:scale-[0.97]` + `transition-[background,transform] duration-[120ms]`

### Avatar (in Edit Profile modal)
- Hover: semi-transparent dark overlay (`bg-black/50`) with camera icon, `opacity-0 → opacity-100`, 120ms
- No scale — avatar is a media element, not a button in the traditional sense

### Primary buttons
- Hover: background shifts to `--kluvs-primary-hover` via Tailwind `hover:bg-primary-hover`
- Disabled: `opacity-40`, `cursor-not-allowed` — no hover/active feedback

---

## Role Eyebrows

Used in ClubCard sidebars and anywhere a member's role in a club is shown.

| Role | Dot color | Text color | Dot shown |
|---|---|---|---|
| Owner | `#C9900A` (mustard) | `#C9900A` | Yes |
| Admin | `#006781` (teal) | `#7BA8B8` (lighter teal — AA on dark card) | Yes |
| Member | — | `rgba(201,189,168,0.7)` | No |

**Why lighter teal for Admin text?** `#006781` fails AA contrast against `#241C17` (the card surface). `#7BA8B8` passes while staying on-hue.

The dot is 6×6px circle, positioned inline-flex with 7px gap before the label text. Eyebrow style: IBM Plex Sans, 10px, weight 500, `letter-spacing: 0.14em`, uppercase.

---

## Modal Layout

All modals follow this structure:

```
┌─────────────────────────────────────────┐
│  SECTION TITLE (copper eyebrow)    ✕    │  ← Header, 1px divider below
│─────────────────────────────────────────│
│                                         │
│  [content sections, space-y-5]          │  ← Body, px-6 pt-6 pb-6
│                                         │
│─────────────────────────────────────────│
│  Cancel                        Save     │  ← Footer, 1px divider above, py-4
└─────────────────────────────────────────┘
```

### Rules
- **Container**: `max-w-sm`, `rounded-2xl`, `overflow-hidden`, background `var(--color-bg-raised)`, border `1px solid var(--color-divider)`
- **Header**: copper eyebrow (`#D16D30`, 11px / 500 / 0.14em tracking / uppercase) on the left; `×` close button on the right. `px-6 pt-5 pb-5`.
- **Body**: `px-6 pt-6 pb-6 space-y-5`. Each section is self-contained.
- **Footer**: `px-6 py-4`, `flex justify-between`. Cancel (text/ghost button) on the left; primary action (copper fill) on the right.
- **Dividers**: `1px solid var(--color-divider)` — one below header, one above footer.
- **Labels**: section field labels use eyebrow style (IBM Plex Sans, 11px, 500, 0.14em tracking, uppercase, `var(--color-text-secondary)`), `margin-bottom: 8px`.
- **Save button**: disabled when no changes or invalid input (`opacity-40`, `cursor-not-allowed`). Shows a 14px spinner + "Saving…" while loading.
- **Escape key**: always closes if not loading.
- **`aria-labelledby`**: points to the header eyebrow span's `id`.

### Read-only rows (e.g. Discord status)
Used to surface external/non-editable data inside the modal. Style:
- Background `var(--color-bg-elevated)`, border `1px solid var(--color-divider)`, `rounded-input`, `px-4 py-3`
- Icon on the left, label + value in the middle (`flex-1`), status chip on the right

---

## Typography Quick Reference

| Role | Font | Size | Weight | Style | Tracking |
|---|---|---|---|---|---|
| Display (hero name) | EB Garamond | 56px desktop / 32px mobile | 500 | — | -0.02em |
| Up Next headline | EB Garamond | 44px desktop / 26px mobile | 500 | *italic* | -0.015em |
| Shelf book title | EB Garamond | 28px desktop / 22px mobile | 500 | *italic* | -0.008em |
| Club card name | EB Garamond | 22px | 500 | — | -0.008em |
| Stat numerals | EB Garamond | 56px desktop / 28px mobile | 500 | — | -0.02em |
| Eyebrow | IBM Plex Sans | 11px | 500 | — | 0.14em uppercase |
| Body / handle | IBM Plex Sans | 14–15px | 400 | — | — |
| Progress / meta | IBM Plex Sans | 13px | 400 | — | tabular-nums where numeric |

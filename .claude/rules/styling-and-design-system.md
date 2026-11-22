---
paths:
  - "src/**/*.tsx"
  - "src/index.css"
  - "src/constants/**"
  - "tailwind.config.js"
  - "index.html"
  - "public/**"
---

# Styling & the design system

`../design-system` is the source of truth: `tokens.json` plus `docs/*.md` (buttons, typography, modal, avatars, colors, cards, inputs, states, …). This repo mirrors the tokens in `src/index.css` (the `--color-*` vars and `t-*` families) and `tailwind.config.js`. If a value is missing, add it to the design system first. Don't invent it here.

## Color
- Use theme tokens through Tailwind arbitrary values: `bg-[var(--color-bg-raised)]`, `text-[var(--color-text-secondary)]`, `border-[var(--color-divider)]`. The Tailwind palette names (`bg-primary`, `text-danger`, `rounded-btn`, `rounded-input`, `rounded-card`) are fine too.
- Use inline `style={{}}` **only for computed or dynamic values** (a size from props, a color picked at runtime). Static styling goes in `className`.
- Don't use raw hex values. Exceptions:
  - third-party brand marks: the Google "G" SVG and Apple glyph in `LoginPage`, and top.gg pink on `DiscordPage`
  - the device-frame illustration in the `LandingPage` phone mockup
  - CSS-var fallbacks (`var(--color-primary, #D16D30)`)
- Theme: `ThemeContext` supports `'light' | 'dark' | 'system'`. It persists to localStorage `kluvs-theme` and toggles the `dark` class on `<html>` (`darkMode: 'class'`). Tokens are redefined under `.dark` in `index.css`.
- Marketing pages follow the system theme. An inline script in `index.html` resolves it before first paint and mirrors `resolveTheme()` in `ThemeContext.tsx`. Keep the two in sync.

## Typography
Every piece of text uses a design-system **family/rung** (`design-system/docs/typography.md`). The `t-*` classes in `src/index.css` carry the exact size, weight, px line-height and tracking. Nothing else should set them.
- **Families:** serif `t-display-{s,m,l}`, `t-headline-{s,m,l}`, `t-title-{s,m,l}`; sans `t-body-{l,m}`, `t-caption`, `t-eyebrow`, `t-label`, `t-fine-print`; `t-mono`. Modifier: `t-feature` (italic, for Headline, Title and Caption only).
- **Never** add raw type utilities, either on top of a family or on their own:
  - sizes: `text-xs/sm/base/lg/3xl`, `text-[Npx]`
  - spacing: `leading-*`, `tracking-*`
  - weights: `font-semibold`, `font-bold` (Bold is Display-only), `font-medium`, `font-normal`
  - other: `font-serif/sans/mono`, `italic`
  - inline `fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing` or `textTransform`
  - Nothing goes below 11px (Eyebrow).
- **Pick by role, not size:**
  - page and session titles, and the Profile name and stats, are Headline; Display is hero/masthead only
  - uppercase tracked text is `t-eyebrow`
  - button, nav, menu-item and other medium-weight sans text is `t-label`
  - prose is `t-body-m` or `t-body-l`; an italic sans aside is `t-caption t-feature`
  - dates, ISBNs and IDs are `t-mono`
- **One family per element.** To change size at a breakpoint, switch rungs (`lg:t-title-l`), never raw px.
- **Color is separate.** `t-caption` and `t-fine-print` bake in the muted color. Add an explicit color class (or `text-inherit`) when you need something else. Other families take their color from context.
- **Exempt:** Avatar initials (sized per `design-system/docs/avatars.md`, e.g. `ui/Avatar.tsx` and the EditProfileModal avatar) and Material Symbols icon sizes (`style={{ fontSize: 20 }}`). Markdown `prose` is themed to the families in `tailwind.config.js`.

## Buttons
Use the family in `src/components/ui/Button.tsx` (`design-system/docs/buttons.md`). Don't hand-write button class strings.
- **Variants:**
  - `primary`: copper fill, one per view
  - `danger`: filled destructive confirm
  - `secondary`: copper outline
  - `outlined`: grey outline
  - `text`: no container; grey, or copper with `emphasized`, or red with `destructive`
  - `social`: OAuth providers; brand colors come from `className`
- There is one size: 40 high, radius 12 (`rounded-btn`), 24px side padding (12 for `text`). Don't pass size, padding, height, type or weight overrides; the label is `t-label`. Filled variants use `--color-on-primary` text. Never write raw `bg-primary … text-white` button strings.
- One-shot pills ("Copy", "Copy Club ID") use `TriggerPill`. The shelf menu is `ShelfPill` (dropdown, 34 high).
- Segmented controls stay hand-written (34 high). Icon-only buttons stay raw: an outlined icon button is 40×40 with a 20px icon; prefer Material Symbols.
- Labels never end in an ellipsis except while loading ("Deleting…").

## Motion
Use the design-system motion tokens (`tokens.json` → `motion`):
- Durations: `duration-[120ms]` (fast: hover, press feedback), `duration-[180ms]` (base: standard UI transitions, modal enter/exit), `duration-[260ms]` (screen: page transitions).
- Easing: `ease-[cubic-bezier(0.2,0.8,0.2,1)]`.
- Don't use Tailwind's stock `duration-150/200/300`. Note that `duration-120` is not a Tailwind 3 default and generates nothing. Older sites still use these (follow-up).

## Icons & brand assets
- Icons:
  - UI icons are Material Symbols Outlined (font loaded in `index.html`), or SVGs in `public/icons/`.
  - Inline brand icons live in `components/icons/`.
  - The user supplies new icon assets. Ask and wait; don't invent SVGs.
- Brand assets:
  - `public/kluvs-lockup-*.svg` and `public/kluvs-wordmark-*.svg` are copied from `design-system/assets/`. Update them there first.
  - Lockup naming is inverted: `-light` has cream text (for dark surfaces), and `-dark` has dark text (for light surfaces).
- Google Play: use Google's official badge (`public/google-play-badge.png`) unmodified. Don't put the Play icon in custom buttons.
- Marketing pages use the shared class strings in `src/constants/marketingStyles.ts` (eyebrow, headline, card, buttons).

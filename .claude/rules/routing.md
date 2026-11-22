---
paths:
  - "src/App.tsx"
  - "src/pages/**"
  - "src/utils/domainNav.ts"
  - "src/content/faq.ts"
  - "src/components/layout/**"
  - "public/sitemap.xml"
  - "vercel.json"
  - "index.html"
---

# Routing

`App.tsx` uses React Router 7 (`BrowserRouter`). Routing is **domain-based**: `computeIsAppDomain()` checks for an `app.*` hostname or `VITE_FORCE_APP_DOMAIN === 'true'`. Cross-domain links go through `src/utils/domainNav.ts`.

## App domain (everything inside `AuthProvider`)
| Route | Component | Auth |
|---|---|---|
| `/`, `/login` | `PublicAuthRoute`: redirects to `/me` when signed in, else `LoginPage` | public |
| `/signup` | redirects to `/login` | public |
| `/join/:token` | `JoinPage` | public |
| `/me` | `ProfilePage` | protected |
| `/clubs` | `ClubsPage` | protected |
| `/clubs/new` | `ClubsPage openNewModal` | protected |
| `/clubs/:slug` | `ClubDetailPage` | protected |
| `/books` | `BooksPage` | protected |
| `*` | redirects to `/me` | |

Protected routes are wrapped `ProtectedRoute → AppShell → <Outlet />`. Main nav entries live in two places: the `TABS` array in `AppShell.tsx` (mobile bottom tab bar) and the `AppSidebar` `NAV` array (desktop).

## Marketing domain (no `AuthProvider`, no Supabase auth calls)
`/` LandingPage · `/privacy` PrivacyPolicy · `/terms` TermsOfUse · `/delete-account` DataDeletion · `/discord` DiscordPage · `/faq` FaqPage · `*` redirects to `/`.

To add a page on either domain, use the `new-page` skill.

## Page conventions
- A page that needs a mobile title or back button sets it in an effect and resets it on cleanup:
  ```tsx
  const { setTopBar, resetTopBar } = useMobileTopBar()
  useEffect(() => {
    if (!title) return
    setTopBar({ title, backLabel: 'Clubs', backPath: '/clubs' })
    return resetTopBar
  }, [title, setTopBar, resetTopBar])
  ```
- localStorage keys in use: `kluvs-theme` (ThemeContext) and `kluvs:lastClub` (last visited club).

## SEO & static routing files
- `public/sitemap.xml` lists the marketing routes. Update it whenever you add or remove a public page.
- `public/og-image.png` is the 1200×630 share image.
- There is deliberately no `public/robots.txt`. `vercel.json` rewrites `/robots.txt` to `robots-allow.txt` on `kluvs.com` and to `robots-disallow.txt` everywhere else. A real `robots.txt` would take precedence over the rewrite, so don't add one.

## Routes other platforms depend on
- Keep `/delete-account` (`DataDeletion`) even though in-app deletion exists (`DeleteAccountModal`). The Google Play listing requires a public deletion page that works without signing in.
- `/clubs/:slug` takes the club **id**. There are no name-based slugs until the backend adds a `slug` field. Links build `/clubs/${club.id}`.
- FAQ items in `src/content/faq.ts` are addressable as `/faq#<id>`, and mobile and the bot may deep-link to them. Reword questions freely, but never rename or remove an `id` without a redirect plan. A test guards a few key ids.

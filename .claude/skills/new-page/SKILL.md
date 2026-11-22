---
name: new-page
description: Adds a new page to kluvs-frontend end to end, on either the marketing domain (Markdown/legal or interactive) or the app domain (authenticated, inside AppShell). It covers the page component, route, sitemap or nav entry, mobile top bar and tests. Use when asked to create or add a new page or route.
---

# New page

Read `.claude/rules/routing.md`, `.claude/rules/styling-and-design-system.md` and `.claude/rules/testing.md` first. They define the conventions this skill applies.

## 1. Ask the user
1. The page name (e.g. "Cookie Policy"). The component is `PascalName`, and any content file is `kebab-name`.
2. The URL path (e.g. `/cookies`).
3. The page type:
   - **Marketing / Markdown**: legal or informational copy in `src/content/<kebab-name>.md`. Follows the PrivacyPolicy, TermsOfUse and DataDeletion pattern.
   - **Marketing / interactive**: content in the TSX itself. Follows the LandingPage, DiscordPage and FaqPage pattern.
   - **App domain**: an authenticated page inside `AppShell` (the ProfilePage, ClubsPage and BooksPage pattern). Also ask whether it gets a main-nav entry, and its mobile top bar title and back target.

Stop and confirm the answers before writing code.

## 2a. Marketing / Markdown
1. Create `src/content/<kebab-name>.md` with placeholder content and `<!-- TODO -->` markers. Copy the tone, the heading structure and the "Effective Date" / "Last updated" line from an existing content file.
2. Create `src/pages/<PascalName>.tsx` with exactly this shell (it matches `PrivacyPolicy.tsx`):
   ```tsx
   import ReactMarkdown from 'react-markdown'
   import Header from '../components/Header'
   import Footer from '../components/Footer'
   import content from '../content/<kebab-name>.md?raw'

   export default function <PascalName>() {
     return (
       <div className="min-h-screen bg-[var(--color-bg)]">
         <Header showDiscordLink={true} />
         <main className="max-w-3xl mx-auto px-6 py-12">
           <article className="prose prose-neutral dark:prose-invert max-w-none prose-a:text-primary hover:prose-a:text-primary-hover">
             <ReactMarkdown>{content}</ReactMarkdown>
           </article>
         </main>
         <Footer />
       </div>
     )
   }
   ```

## 2b. Marketing / interactive
- Create `src/pages/<PascalName>.tsx` with `<Header showDiscordLink={true} />` … `<Footer />`.
- Build sections from the class strings in `src/constants/marketingStyles.ts` (`eyebrow`, `headline`, `cardTitle`, `card`, …).
- Use `t-*` typography families, `var(--color-*)` tokens and `<Button>` from `components/ui/Button.tsx`. Never write raw type utilities or button class strings.
- Don't call Supabase auth. Marketing pages have no `AuthProvider`.

## 2c. App domain
1. Create `src/pages/<PascalName>.tsx`. Read auth state through `useAuth()` and fetch data per `.claude/rules/data-fetching.md`.
2. If the page has a mobile title or back button, add the `setTopBar` / `resetTopBar` effect from `routing.md`.
3. If it gets a main-nav entry, add it to **both** `TABS` in `src/components/layout/AppShell.tsx` and `NAV` in `src/components/layout/AppSidebar.tsx`. Ask the user for the icon asset; don't invent one.

## 3. Route (`src/App.tsx`)
- **Marketing**: add `<Route path="/<path>" element={<PascalName />} />` to the marketing-domain `<Routes>` block, before the `*` catch-all.
- **App domain**: add it inside the protected `<Route element={<AppShell />}>` block, next to `/me`, `/clubs` and `/books`.
- Import the page at the top with the other page imports. Update `src/__tests__/App.test.tsx` if it mocks each page.

## 4. Sitemap (marketing only)
Add `<url><loc>https://kluvs.com/<path></loc></url>` to `public/sitemap.xml`.

## 5. Tests: `src/__tests__/pages/<PascalName>.test.tsx`
- **Marketing**: render inside `<MemoryRouter><ThemeProvider>` with no AuthProvider (copy `PrivacyPolicy.test.tsx`). Cover the main heading, one test per major `##` section, and two or three key phrases or links.
- **App domain**: mock `../../supabase` with the `invokeFunction` → `functions.invoke` pattern, render with `render` from `../utils/test-utils` inside a `<MemoryRouter>`, and use fixtures from `../utils/mocks`. Cover loading, data, errors, and admin vs member states if anything is role-gated.

## 6. Verify and stop
- Run `npm run validate`. Read only the summary and failures, and fix until it is green.
- Stop and give the user the files you created, especially the content `.md` with its TODO placeholders, for review. Don't commit.

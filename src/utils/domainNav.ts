// Real Kluvs environments (production kluvs.com, integration kluvs.xyz) split marketing
// and app content across real subdomains (kluvs.* vs app.kluvs.*), so a link between them
// is a genuine navigation to another registered host. A Vercel preview or local dev server
// is a single origin with no such subdomain — a "cross-domain" link there either 404s or
// silently lands on a *different* environment's stable deployment. On those hosts, domain
// switching instead happens in-place via a `?domain=app|marketing` URL param, which
// App.tsx captures into sessionStorage and strips from the address bar on load.
export function isRealKluvsHost(hostname: string | undefined): boolean {
  if (!hostname) return false
  return (
    hostname === 'kluvs.com' || hostname.endsWith('.kluvs.com') ||
    hostname === 'kluvs.xyz' || hostname.endsWith('.kluvs.xyz')
  )
}

export const APP_DOMAIN_STORAGE_KEY = 'kluvs-preview-app-domain'

// From a marketing page, link to the app (e.g. the "Dashboard" button).
export function getAppHref(path: string): string {
  if (isRealKluvsHost(window.location.hostname)) {
    return `${import.meta.env.VITE_OAUTH_REDIRECT_URL}${path}`
  }
  return `${window.location.origin}${path}?domain=app`
}

// From the app, link back to marketing (e.g. the sidebar/top-bar wordmark).
export function getMarketingHref(): string {
  if (isRealKluvsHost(window.location.hostname)) {
    return import.meta.env.VITE_OAUTH_REDIRECT_URL?.replace('app.', '') ?? '/'
  }
  return `${window.location.origin}/?domain=marketing`
}

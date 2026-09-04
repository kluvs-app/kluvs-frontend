// TEMPORARY — for manually verifying the app/marketing domain-switch behavior on Vercel
// previews and local dev (see utils/domainNav.ts + App.tsx's computeIsAppDomain). Only
// rendered on non-real Kluvs hosts (App.tsx gates it), so it can never appear on
// kluvs.com/kluvs.xyz. Remove this component and its usage in App.tsx once confirmed.
import { getAppHref, getMarketingHref } from '../utils/domainNav'

interface PreviewDebugBadgeProps {
  isAppDomain: boolean
}

export default function PreviewDebugBadge({ isAppDomain }: PreviewDebugBadgeProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        right: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.5,
        padding: '8px 10px',
        borderRadius: 6,
        pointerEvents: 'none',
        maxWidth: '90vw',
        wordBreak: 'break-all',
      }}
    >
      <div>[preview debug — remove before merge]</div>
      <div>domain: {isAppDomain ? 'app' : 'marketing'}</div>
      <div>host: {window.location.hostname}</div>
      <div>dashboardHref: {getAppHref('/me')}</div>
      <div>marketingHref: {getMarketingHref()}</div>
    </div>
  )
}

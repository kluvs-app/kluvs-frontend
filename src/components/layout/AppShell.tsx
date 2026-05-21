import { Outlet, NavLink } from 'react-router-dom'
import AppSidebar from './AppSidebar'

const MS_VIEWBOX = "0 -960 960 960"

const TABS = [
  {
    to: '/me', label: 'Me',
    icon: <svg className="w-6 h-6" viewBox={MS_VIEWBOX} fill="currentColor"><path d="M480-489.61q-74.48 0-126.85-52.37-52.37-52.37-52.37-126.85 0-74.48 52.37-126.56 52.37-52.09 126.85-52.09 74.48 0 126.85 52.09 52.37 52.08 52.37 126.56t-52.37 126.85Q554.48-489.61 480-489.61ZM140.78-131.17v-132.35q0-39.26 20.44-72.17 20.43-32.9 54.3-50.22 63.7-31.57 129.93-47.63 66.24-16.07 134.55-16.07 69.39 0 135.65 15.78 66.26 15.79 128.83 47.35 33.87 17.24 54.3 49.99 20.44 32.75 20.44 72.94v132.38H140.78Z" /></svg>,
  },
  {
    to: '/clubs', label: 'Clubs',
    icon: <svg className="w-6 h-6" viewBox={MS_VIEWBOX} fill="currentColor"><path d="M264.65-107 48.74-480l215.91-373h430.7l215.91 373-215.91 373h-430.7Z" /></svg>,
  },
  {
    to: '/books', label: 'Books',
    icon: <svg className="w-6 h-6" viewBox={MS_VIEWBOX} fill="currentColor"><path d="M290.96-60.78q-62.53 0-106.35-43.83-43.83-43.82-43.83-106.35v-538.08q0-62.53 43.83-106.35 43.82-43.83 106.35-43.83h528.26v638.44q-20.76 0-35.29 14.53-14.54 14.53-14.54 35.29 0 20.76 14.54 35.3 14.53 14.53 35.29 14.53v100.35H290.96Zm30.17-300.92h100.35v-437.17H321.13v437.17Zm-30.17 200.57h387.13q-4.18-11.79-6.61-24-2.44-12.22-2.44-26.01 0-12.99 2.09-25.48 2.09-12.5 6.96-24.16H290.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z" /></svg>,
  },
]

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Main content — offset right on desktop, clear bottom on mobile */}
      <main className="lg:pl-[220px] pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--color-bg-raised)] border-t border-[var(--color-divider)] flex items-center justify-around"
        aria-label="Main navigation"
      >
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={false}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-[var(--color-text-secondary)]'
              }`
            }
          >
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

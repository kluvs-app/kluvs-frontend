import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/Header'
import { ThemeProvider } from '../../contexts/ThemeContext'

const originalLocation = window.location

function setHostname(hostname: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: { ...originalLocation, hostname, host: hostname },
  })
}

afterEach(() => {
  Object.defineProperty(window, 'location', { writable: true, configurable: true, value: originalLocation })
})

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Header {...props} />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('Header', () => {
  describe('Rendering', () => {
    it('should render the Kluvs logo image', () => {
      renderHeader()

      const logos = screen.getAllByAltText('Kluvs')
      expect(logos[0]).toBeInTheDocument()
      expect(logos[0]).toHaveAttribute('src', '/kluvs-lockup-dark.svg')
    })

    it('should render the Kluvs wordmark', () => {
      renderHeader()

      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('should have sticky positioning', () => {
      renderHeader()

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky', 'top-0', 'z-40')
    })

    it('should have border styling', () => {
      renderHeader()

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('border-b')
    })
  })

  describe('Navigation', () => {
    it('should render logo as a link to home', () => {
      renderHeader()

      const link = screen.getAllByAltText('Kluvs')[0].closest('a')
      expect(link).toHaveAttribute('href', '/')
    })

    it('should have the lockup inside a link', () => {
      renderHeader()

      const logos = screen.getAllByAltText('Kluvs')
      const link = logos[0].closest('a')
      expect(link).toBeInTheDocument()
      expect(link).toContainElement(logos[0])
    })
  })

  describe('Open Kluvs Button', () => {
    it('should display Open Kluvs button by default', () => {
      renderHeader()

      expect(screen.getByRole('link', { name: /Open Kluvs/i })).toBeInTheDocument()
    })

    it('should display Open Kluvs button when showOpenAppButton is true', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Open Kluvs/i })
      expect(button).toBeInTheDocument()
    })

    it('should not display Open Kluvs button when showOpenAppButton is false', () => {
      renderHeader({ showOpenAppButton: false })

      expect(screen.queryByRole('link', { name: /Open Kluvs/i })).not.toBeInTheDocument()
    })

    it('should link to the OAuth redirect URL on a real Kluvs host', () => {
      setHostname('kluvs.com')

      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Open Kluvs/i })
      expect(button).toHaveAttribute('href', `${import.meta.env.VITE_OAUTH_REDIRECT_URL}/me`)
    })

    it('should link to the same origin with the app-domain override on non-Kluvs hosts (e.g. previews)', () => {
      setHostname('kluvs-frontend-abc123.vercel.app')

      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Open Kluvs/i })
      expect(button).toHaveAttribute('href', `${window.location.origin}/me?domain=app`)
    })

    it('should have proper styling', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Open Kluvs/i })
      expect(button).toHaveClass('border', 'rounded-btn', 'font-medium', 'transition-colors')
    })
  })

  describe('Layout', () => {
    it('should have flexbox layout with space between', () => {
      renderHeader({ showOpenAppButton: true })

      const header = screen.getByRole('banner')
      expect(header).toHaveClass('flex', 'items-center', 'justify-between')
    })

    it('should display logo on the left', () => {
      renderHeader({ showOpenAppButton: true })

      const header = screen.getByRole('banner')
      const logo = screen.getAllByAltText('Kluvs')[0].closest('a')
      const appButton = screen.getByRole('link', { name: /Open Kluvs/i })

      // Logo should come before app button in DOM
      expect(logo).toBeInTheDocument()
      expect(header).toContainElement(appButton)
      expect(logo!.compareDocumentPosition(appButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('Discord Link', () => {
    it('should not display the Discord link by default', () => {
      renderHeader()

      expect(screen.queryByRole('link', { name: 'Discord' })).not.toBeInTheDocument()
    })

    it('should render no navigation when both the Discord link and Open Kluvs are off', () => {
      renderHeader({ showOpenAppButton: false })

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    it('should link to the Discord page when showDiscordLink is true', () => {
      renderHeader({ showDiscordLink: true })

      expect(screen.getByRole('link', { name: 'Discord' })).toHaveAttribute('href', '/discord')
    })

    it('should collapse the Discord label to icon-only on mobile', () => {
      renderHeader({ showDiscordLink: true })

      expect(screen.getByText('Discord')).toHaveClass('hidden', 'sm:inline')
    })

    it('should render the Discord link before the Open Kluvs button', () => {
      renderHeader({ showDiscordLink: true, showOpenAppButton: true })

      const discord = screen.getByRole('link', { name: 'Discord' })
      const openApp = screen.getByRole('link', { name: /Open Kluvs/i })
      expect(discord.compareDocumentPosition(openApp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})

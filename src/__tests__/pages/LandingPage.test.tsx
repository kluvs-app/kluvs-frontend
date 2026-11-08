import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import LandingPage from '../../pages/LandingPage'

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <LandingPage />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  describe('Rendering', () => {
    it('should render the Kluvs logo', () => {
      renderLandingPage()
      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('should render the brand name in the nav', () => {
      renderLandingPage()
      expect(screen.getAllByAltText('Kluvs').length).toBeGreaterThan(0)
    })

    it('should render the hero headline', () => {
      renderLandingPage()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should render the "Open Kluvs" nav link', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /open kluvs/i })
      expect(link).toBeInTheDocument()
      // jsdom's default test host (localhost) has no real app.* subdomain, so this stays
      // same-origin with the app-domain override — see utils/domainNav.ts.
      expect(link).toHaveAttribute('href', `${window.location.origin}/me?domain=app`)
    })
  })

  describe('Store Links', () => {
    it('should render a Google Play download link', () => {
      renderLandingPage()
      const links = screen.getAllByRole('link', { name: /google play/i })
      expect(links.length).toBeGreaterThan(0)
      expect(links[0]).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.ivangarzab.kluvs')
    })

    it('should use the official Google Play badge image', () => {
      renderLandingPage()
      expect(screen.getByRole('img', { name: 'Get it on Google Play' })).toHaveAttribute('src', '/google-play-badge.png')
    })

    it('should render an App Store download link', () => {
      renderLandingPage()
      const links = screen.getAllByRole('link', { name: /app store/i })
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => expect(link).toHaveAttribute('href', 'https://apps.apple.com/app/id6757938950'))
    })

    it('should use the official App Store badge image', () => {
      renderLandingPage()
      expect(screen.getByRole('img', { name: 'Download on the App Store' })).toHaveAttribute('src', '/app-store-badge.svg')
    })

    it('should place the App Store badge after the Google Play badge', () => {
      renderLandingPage()
      const play = screen.getByRole('img', { name: 'Get it on Google Play' })
      const appStore = screen.getByRole('img', { name: 'Download on the App Store' })
      expect(play.compareDocumentPosition(appStore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('should not show any iPhone "coming soon" copy', () => {
      renderLandingPage()
      expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/on its way/i)).not.toBeInTheDocument()
    })

    it('should render an "Open in your browser" link to the web app', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /open in your browser/i })
      expect(link).toHaveAttribute('href', `${window.location.origin}/me?domain=app`)
    })

    it('should link to the Discord page as a secondary option', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /run your club on discord/i })
      expect(link).toHaveAttribute('href', '/discord')
    })
  })

  describe('Features', () => {
    it.each([
      'The current read',
      'The next discussion',
      'Food for Thought',
      'Your shelf',
      'Pull up a chair',
      'Your reading life',
    ])('should render the "%s" feature card', (title) => {
      renderLandingPage()
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    })
  })

  describe('Platforms', () => {
    it('should render app screenshots', () => {
      renderLandingPage()
      expect(screen.getAllByRole('img', { name: /in kluvs/i })).toHaveLength(3)
    })

    it('should say the app is free on Android, iPhone, and the web', () => {
      renderLandingPage()
      expect(screen.getByText(/free on android, iphone, and the web/i)).toBeInTheDocument()
      expect(screen.getByText('Free on Google Play')).toBeInTheDocument()
      expect(screen.getByText('Free on the App Store')).toBeInTheDocument()
      expect(screen.getByText('Free in any browser')).toBeInTheDocument()
    })

    it('should not render the How It Works map (moved to the Discord page)', () => {
      renderLandingPage()
      expect(screen.queryByText(/how it works/i)).not.toBeInTheDocument()
    })
  })

  describe('Contact Form', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { ...window.location, href: '' })
    })

    it('should render the Name input field', () => {
      renderLandingPage()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    it('should render the Email input field', () => {
      renderLandingPage()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('should render the Message textarea', () => {
      renderLandingPage()
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    })

    it('should render the Send Message submit button', () => {
      renderLandingPage()
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    })

    it('should update fields when user types', async () => {
      const user = userEvent.setup()
      renderLandingPage()

      await user.type(screen.getByLabelText(/name/i), 'Jane')
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/message/i), 'Hello!')

      expect(screen.getByLabelText(/name/i)).toHaveValue('Jane')
      expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com')
      expect(screen.getByLabelText(/message/i)).toHaveValue('Hello!')
    })

    it('should show success message after form submission', async () => {
      const user = userEvent.setup()
      renderLandingPage()

      await user.type(screen.getByLabelText(/name/i), 'Jane')
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/message/i), 'Hello!')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(screen.getByText(/your mail app should open/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'kluvs.app@gmail.com' })).toHaveAttribute('href', 'mailto:kluvs.app@gmail.com')
      expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument()
    })

    it('should show the contact address as a fallback for visitors without a mail app', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: 'kluvs.app@gmail.com' })
      expect(link).toHaveAttribute('href', 'mailto:kluvs.app@gmail.com')
    })

    it('should set mailto href on submission', async () => {
      const user = userEvent.setup()
      renderLandingPage()

      await user.type(screen.getByLabelText(/name/i), 'Jane')
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
      await user.type(screen.getByLabelText(/message/i), 'Hello!')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(window.location.href).toContain('mailto:kluvs.app@gmail.com')
    })
  })

  describe('Footer', () => {
    it('should render the Privacy link', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /^privacy$/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/privacy')
    })

    it('should render the Terms link', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /^terms$/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/terms')
    })

    it('should render the copyright notice', () => {
      renderLandingPage()
      expect(screen.getByText(/© 2026 Kluvs/i)).toBeInTheDocument()
    })
  })
})

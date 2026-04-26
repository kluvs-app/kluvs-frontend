import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import DiscordPage from '../../pages/DiscordPage'

function renderDiscordPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <DiscordPage />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('DiscordPage', () => {
  describe('Rendering', () => {
    it('should render the Kluvs logo in the nav', () => {
      renderDiscordPage()
      const logos = screen.getAllByAltText('Kluvs')
      expect(logos.length).toBeGreaterThan(0)
    })

    it('should render the Kluvs nav link pointing to /', () => {
      renderDiscordPage()
      const links = screen.getAllByRole('link')
      const homeLink = links.find(l => l.getAttribute('href') === '/')
      expect(homeLink).toBeInTheDocument()
    })

    it('should render the hero heading', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('CTA Buttons', () => {
    it('should render the "Add to Server" invite link', () => {
      renderDiscordPage()
      const link = screen.getByRole('link', { name: /add kluvs bot to your discord server/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', expect.stringContaining('discord.com/oauth2/authorize'))
    })

    it('should render the "Join Support Server" link', () => {
      renderDiscordPage()
      const link = screen.getByRole('link', { name: /join the kluvs support server/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', expect.stringContaining('discord.gg'))
    })

    it('should render the "View on top.gg" link', () => {
      renderDiscordPage()
      const link = screen.getByRole('link', { name: /view kluvs on top\.gg/i })
      expect(link).toBeInTheDocument()
    })
  })

  describe('Feature Highlights', () => {
    it('should render the One Club per Channel feature card', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /one club per channel/i })).toBeInTheDocument()
    })

    it('should render the Session Tracking feature card', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /session tracking/i })).toBeInTheDocument()
    })

    it('should render the AI Summaries feature card', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /ai summaries/i })).toBeInTheDocument()
    })

    it('should render the Discussion Scheduling feature card', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /discussion scheduling/i })).toBeInTheDocument()
    })
  })

  describe('Commands Section', () => {
    it('should render the Member Commands heading', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /member commands/i })).toBeInTheDocument()
    })

    it('should render the Admin Commands heading', () => {
      renderDiscordPage()
      expect(screen.getByRole('heading', { name: /admin commands/i })).toBeInTheDocument()
    })

    it('should render user slash commands', () => {
      renderDiscordPage()
      expect(screen.getByText('/session')).toBeInTheDocument()
      expect(screen.getByText('/book')).toBeInTheDocument()
      expect(screen.getByText('/join')).toBeInTheDocument()
    })

    it('should render admin prefix commands', () => {
      renderDiscordPage()
      expect(screen.getByText('!setup')).toBeInTheDocument()
      expect(screen.getByText('!club_create')).toBeInTheDocument()
      expect(screen.getByText('!session_create')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('should render the Privacy Policy link', () => {
      renderDiscordPage()
      const link = screen.getByRole('link', { name: /privacy policy/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/privacy')
    })

    it('should render the Terms of Use link', () => {
      renderDiscordPage()
      const link = screen.getByRole('link', { name: /terms of use/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/terms')
    })

    it('should render the copyright notice', () => {
      renderDiscordPage()
      expect(screen.getByText(/© 2026 Kluvs/i)).toBeInTheDocument()
    })
  })
})

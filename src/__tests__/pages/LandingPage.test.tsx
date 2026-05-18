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
      expect(screen.getByText('Kluvs')).toBeInTheDocument()
    })

    it('should render the hero headline', () => {
      renderLandingPage()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should render the "Dashboard" nav link pointing to /app', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /dashboard/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/app')
    })
  })

  describe('Store Links', () => {
    it('should render a Google Play download link', () => {
      renderLandingPage()
      const links = screen.getAllByRole('link', { name: /google play/i })
      expect(links.length).toBeGreaterThan(0)
    })

    it('should render an App Store download link', () => {
      renderLandingPage()
      const links = screen.getAllByRole('link', { name: /app store/i })
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Features', () => {
    it('should render the Reading Sessions feature card', () => {
      renderLandingPage()
      expect(screen.getByRole('heading', { name: /reading sessions/i })).toBeInTheDocument()
    })

    it('should render the Discussions feature card', () => {
      renderLandingPage()
      expect(screen.getByRole('heading', { name: /discussions/i })).toBeInTheDocument()
    })

    it('should render the Member Management feature card', () => {
      renderLandingPage()
      expect(screen.getByRole('heading', { name: /member management/i })).toBeInTheDocument()
    })
  })

  describe('Contact Form', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { href: '' })
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

      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument()
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
    it('should render the Privacy Policy link', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /privacy policy/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/privacy')
    })

    it('should render the Terms of Use link', () => {
      renderLandingPage()
      const link = screen.getByRole('link', { name: /terms of use/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/terms')
    })

    it('should render the copyright notice', () => {
      renderLandingPage()
      expect(screen.getByText(/© 2026 Kluvs/i)).toBeInTheDocument()
    })
  })
})

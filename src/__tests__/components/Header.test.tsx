import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/Header'
import { ThemeProvider } from '../../contexts/ThemeContext'

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

  describe('Dashboard Button', () => {
    it('should not display Dashboard button by default', () => {
      renderHeader()

      expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument()
    })

    it('should display Dashboard button when showOpenAppButton is true', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Dashboard/i })
      expect(button).toBeInTheDocument()
    })

    it('should not display Dashboard button when showOpenAppButton is false', () => {
      renderHeader({ showOpenAppButton: false })

      expect(screen.queryByRole('link', { name: /Dashboard/i })).not.toBeInTheDocument()
    })

    it('should link to the OAuth redirect URL on the production marketing host', () => {
      const hostnameSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        hostname: 'kluvs.com',
      } as Location)

      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Dashboard/i })
      expect(button).toHaveAttribute('href', `${import.meta.env.VITE_OAUTH_REDIRECT_URL}/me`)

      hostnameSpy.mockRestore()
    })

    it('should link to the same origin on non-production hosts (e.g. previews)', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Dashboard/i })
      expect(button).toHaveAttribute('href', `${window.location.origin}/me`)
    })

    it('should have proper styling', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Dashboard/i })
      expect(button).toHaveClass('bg-primary', 'text-white', 'font-medium', 'transition-colors')
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
      const appButton = screen.getByRole('link', { name: /Dashboard/i })

      // Logo should come before app button in DOM
      expect(logo).toBeInTheDocument()
      const logoIndex = Array.from(header.children).indexOf(logo as Element)
      const buttonIndex = Array.from(header.children).indexOf(appButton)
      expect(logoIndex).toBeLessThan(buttonIndex)
    })
  })
})

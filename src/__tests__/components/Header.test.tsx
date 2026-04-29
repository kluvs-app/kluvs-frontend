import { describe, it, expect } from 'vitest'
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

      const logo = screen.getByAltText('Kluvs')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/ic-mark.svg')
    })

    it('should render the Kluvs text', () => {
      renderHeader()

      expect(screen.getByText('Kluvs')).toBeInTheDocument()
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

      const link = screen.getByAltText('Kluvs').closest('a')
      expect(link).toHaveAttribute('href', '/')
    })

    it('should have the logo and text inside the same link', () => {
      renderHeader()

      const link = screen.getByAltText('Kluvs').closest('a')
      expect(link).toBeInTheDocument()
      expect(link).toContainElement(screen.getByAltText('Kluvs'))
      expect(link).toContainElement(screen.getByText('Kluvs'))
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

    it('should link to /app', () => {
      renderHeader({ showOpenAppButton: true })

      const button = screen.getByRole('link', { name: /Dashboard/i })
      expect(button).toHaveAttribute('href', '/app')
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
      const logo = screen.getByAltText('Kluvs').closest('a')
      const appButton = screen.getByRole('link', { name: /Dashboard/i })

      // Logo should come before app button in DOM
      expect(logo).toBeInTheDocument()
      const logoIndex = Array.from(header.children).indexOf(logo as Element)
      const buttonIndex = Array.from(header.children).indexOf(appButton)
      expect(logoIndex).toBeLessThan(buttonIndex)
    })
  })
})

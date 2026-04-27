import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import PrivacyPolicy from '../../pages/PrivacyPolicy'

function renderPrivacyPolicy() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <PrivacyPolicy />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('PrivacyPolicy', () => {
  describe('Rendering', () => {
    it('should display the page title', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Privacy Policy/i, level: 1 })).toBeInTheDocument()
    })

    it('should display the effective date', () => {
      renderPrivacyPolicy()
      expect(screen.getByText(/Effective Date/i)).toBeInTheDocument()
    })

    it('should display the Kluvs logo in the header', () => {
      renderPrivacyPolicy()
      expect(screen.getByAltText('Kluvs')).toBeInTheDocument()
    })

    it('should display the Kluvs brand name in the header', () => {
      renderPrivacyPolicy()
      expect(screen.getByText('Kluvs')).toBeInTheDocument()
    })
  })

  describe('Section Headings', () => {
    it('should render the Information We Collect section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Information We Collect/i })).toBeInTheDocument()
    })

    it('should render the How We Use Your Information section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /How We Use Your Information/i })).toBeInTheDocument()
    })

    it('should render the Third-Party Service Providers section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Third-Party Service Providers/i })).toBeInTheDocument()
    })

    it('should render the Data Security and Retention section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Data Security and Retention/i })).toBeInTheDocument()
    })

    it('should render the Your Rights section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Your Rights/i })).toBeInTheDocument()
    })

    it('should render the Contact Us section', () => {
      renderPrivacyPolicy()
      expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should mention Supabase', () => {
      renderPrivacyPolicy()
      expect(screen.getAllByText(/Supabase/i).length).toBeGreaterThan(0)
    })

    it('should mention Discord', () => {
      renderPrivacyPolicy()
      expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0)
    })

    it('should mention data deletion rights', () => {
      renderPrivacyPolicy()
      expect(screen.getByText(/delete your account/i)).toBeInTheDocument()
    })

    it('should display a contact email', () => {
      renderPrivacyPolicy()
      expect(screen.getByText(/kluvs-app@gmail\.com/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should have a clickable Kluvs logo in the header', () => {
      renderPrivacyPolicy()
      const logo = screen.getByAltText('Kluvs').closest('a')
      expect(logo).toHaveAttribute('href', '/')
    })
  })
})

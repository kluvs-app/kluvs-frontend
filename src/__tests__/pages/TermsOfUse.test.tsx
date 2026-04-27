import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import TermsOfUse from '../../pages/TermsOfUse'

function renderTermsOfUse() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <TermsOfUse />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('TermsOfUse', () => {
  describe('Rendering', () => {
    it('should display the page title', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Terms of Use/i, level: 1 })).toBeInTheDocument()
    })

    it('should display the effective date', () => {
      renderTermsOfUse()
      expect(screen.getByText(/Effective Date/i)).toBeInTheDocument()
    })

    it('should display the Kluvs logo in the header', () => {
      renderTermsOfUse()
      expect(screen.getByAltText('Kluvs')).toBeInTheDocument()
    })

    it('should display the Kluvs brand name in the header', () => {
      renderTermsOfUse()
      expect(screen.getByText('Kluvs')).toBeInTheDocument()
    })
  })

  describe('Section Headings', () => {
    it('should render the Description of Service section', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Description of Service/i })).toBeInTheDocument()
    })

    it('should render the Accounts and Registration section', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Accounts and Registration/i })).toBeInTheDocument()
    })

    it('should render the Acceptable Use section', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Acceptable Use/i })).toBeInTheDocument()
    })

    it('should render the Limitation of Liability section', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Limitation of Liability/i })).toBeInTheDocument()
    })

    it('should render the Contact Us section', () => {
      renderTermsOfUse()
      expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should mention Discord', () => {
      renderTermsOfUse()
      expect(screen.getAllByText(/Discord/i).length).toBeGreaterThan(0)
    })

    it('should mention Supabase', () => {
      renderTermsOfUse()
      expect(screen.getAllByText(/Supabase/i).length).toBeGreaterThan(0)
    })

    it('should display a contact email', () => {
      renderTermsOfUse()
      expect(screen.getByText(/kluvs-app@gmail\.com/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should have a clickable Kluvs logo in the header', () => {
      renderTermsOfUse()
      const logo = screen.getByAltText('Kluvs').closest('a')
      expect(logo).toHaveAttribute('href', '/')
    })
  })
})

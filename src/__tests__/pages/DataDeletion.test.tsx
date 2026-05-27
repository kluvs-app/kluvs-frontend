import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import DataDeletion from '../../pages/DataDeletion'

function renderDataDeletion() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <DataDeletion />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('DataDeletion', () => {
  describe('Rendering', () => {
    it('should render the Kluvs logo', () => {
      renderDataDeletion()
      expect(screen.getAllByAltText('Kluvs')[0]).toBeInTheDocument()
    })

    it('should render the page title', () => {
      renderDataDeletion()
      expect(screen.getByRole('heading', { name: /account.*data deletion/i })).toBeInTheDocument()
    })

    it('should render the "Back to Kluvs" link', () => {
      renderDataDeletion()
      const link = screen.getByRole('link', { name: /back to kluvs/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })
  })

  describe('Section Headings', () => {
    it('should render the "How to Request Deletion" section', () => {
      renderDataDeletion()
      expect(screen.getByRole('heading', { name: /how to request deletion/i })).toBeInTheDocument()
    })

    it('should render the "What Gets Deleted" section', () => {
      renderDataDeletion()
      expect(screen.getByRole('heading', { name: /what gets deleted/i })).toBeInTheDocument()
    })

    it('should render the "What May Be Retained" section', () => {
      renderDataDeletion()
      expect(screen.getByRole('heading', { name: /what may be retained/i })).toBeInTheDocument()
    })

    it('should render the "Timeline" section', () => {
      renderDataDeletion()
      expect(screen.getByRole('heading', { name: /timeline/i })).toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('should mention the contact email', () => {
      renderDataDeletion()
      expect(screen.getAllByText(/kluvs\.app@gmail\.com/i).length).toBeGreaterThan(0)
    })

    it('should mention the 30-day deletion timeline', () => {
      renderDataDeletion()
      expect(screen.getAllByText(/30 days/i).length).toBeGreaterThan(0)
    })

    it('should mention the deletion request subject line', () => {
      renderDataDeletion()
      expect(screen.getByText(/account deletion request/i)).toBeInTheDocument()
    })
  })
})

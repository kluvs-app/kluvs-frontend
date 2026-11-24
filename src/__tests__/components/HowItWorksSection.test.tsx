import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowItWorksSection from '../../components/HowItWorksSection'

describe('HowItWorksSection', () => {
  it('renders the section header', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'One server, many clubs' })).toBeInTheDocument()
  })

  it('renders the three connector labels in order', () => {
    render(<HowItWorksSection />)
    const labels = [
      'One server · Many clubs',
      'One active session per club',
      'One session · Many discussions',
    ].map(text => screen.getByText(text))
    labels.reduce((prev, next) => {
      expect(prev.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      return next
    })
  })

  it('renders the Discord server, session and discussion tiers', () => {
    render(<HowItWorksSection />)
    expect(screen.getByText('Server')).toBeInTheDocument()
    expect(screen.getByText('Your community home')).toBeInTheDocument()
    expect(screen.getAllByText('Session').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Discussion').length).toBeGreaterThan(0)
  })
})

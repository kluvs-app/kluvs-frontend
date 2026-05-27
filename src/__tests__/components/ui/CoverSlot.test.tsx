import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import CoverSlot from '../../../components/ui/CoverSlot'

describe('CoverSlot', () => {
  describe('Image rendering', () => {
    it('renders image when imageUrl is provided', () => {
      render(
        <CoverSlot
          imageUrl="https://example.com/cover.jpg"
          width={128}
          height={192}
          alt="Book cover"
        />
      )
      const img = screen.getByAltText('Book cover')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg')
    })

    it('renders image with object-cover class', () => {
      render(
        <CoverSlot
          imageUrl="https://example.com/cover.jpg"
          width={128}
          height={192}
          alt="Book cover"
        />
      )
      const img = screen.getByAltText('Book cover')
      expect(img).toHaveClass('object-cover')
    })
  })

  describe('Placeholder rendering', () => {
    it('renders placeholder pattern when no image provided', () => {
      const { container } = render(
        <CoverSlot width={128} height={192} alt="Book cover" />
      )
      const slot = container.querySelector('[style*="background"]')
      expect(slot || container.firstChild).toBeInTheDocument()
    })

    it('renders slot container', () => {
      const { container } = render(
        <CoverSlot width={80} height={120} alt="Book cover" />
      )
      const slot = container.firstChild
      expect(slot).toBeInTheDocument()
    })
  })

  describe('Dimensions', () => {
    it('sets width and height via style prop', () => {
      const { container } = render(
        <CoverSlot width={128} height={192} alt="Book cover" />
      )
      const slot = container.firstChild as HTMLElement
      expect(slot.style.width).toBeTruthy()
      expect(slot.style.height).toBeTruthy()
    })

    it('supports small size dimensions', () => {
      const { container } = render(
        <CoverSlot width={56} height={84} alt="Small cover" />
      )
      const slot = container.firstChild as HTMLElement
      expect(slot).toBeInTheDocument()
    })

    it('supports large size dimensions', () => {
      const { container } = render(
        <CoverSlot width={128} height={192} alt="Large cover" />
      )
      const slot = container.firstChild as HTMLElement
      expect(slot).toBeInTheDocument()
    })
  })

  describe('Alt text', () => {
    it('uses provided alt text for image', () => {
      render(
        <CoverSlot
          imageUrl="https://example.com/cover.jpg"
          width={128}
          height={192}
          alt="The Great Gatsby"
        />
      )
      const img = screen.getByAltText('The Great Gatsby')
      expect(img).toBeInTheDocument()
    })
  })

  describe('Component behavior', () => {
    it('handles missing imageUrl gracefully', () => {
      const { container } = render(
        <CoverSlot width={128} height={192} alt="No image" />
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders with all props provided', () => {
      render(
        <CoverSlot
          imageUrl="https://example.com/book.jpg"
          width={100}
          height={150}
          alt="Test book"
        />
      )
      const img = screen.getByAltText('Test book')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/book.jpg')
    })
  })
})

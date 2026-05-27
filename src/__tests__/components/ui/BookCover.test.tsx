import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import BookCover from '../../../components/ui/BookCover'

vi.mock('../../../components/ui/CoverSlot', () => ({
  default: ({ imageUrl, width, height, alt }: any) => (
    <div data-testid="cover-slot" data-width={width} data-height={height}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} data-testid="cover-image" />
      ) : (
        <div data-testid="cover-placeholder">{alt}</div>
      )}
    </div>
  ),
}))

describe('BookCover', () => {
  describe('Size variants', () => {
    it('renders small size with correct dimensions', () => {
      render(<BookCover size="sm" />)
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toHaveAttribute('data-width', '56')
      expect(coverSlot).toHaveAttribute('data-height', '84')
    })

    it('renders medium size with correct dimensions by default', () => {
      render(<BookCover />)
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toHaveAttribute('data-width', '80')
      expect(coverSlot).toHaveAttribute('data-height', '120')
    })

    it('renders large size with correct dimensions', () => {
      render(<BookCover size="lg" />)
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toHaveAttribute('data-width', '128')
      expect(coverSlot).toHaveAttribute('data-height', '192')
    })
  })

  describe('Aspect ratio', () => {
    it('maintains 2:3 aspect ratio for small size', () => {
      render(<BookCover size="sm" />)
      const coverSlot = screen.getByTestId('cover-slot')
      const width = parseInt(coverSlot.getAttribute('data-width') || '0')
      const height = parseInt(coverSlot.getAttribute('data-height') || '0')
      expect(height / width).toBeCloseTo(1.5, 1) // 2:3 ratio = height/width = 1.5
    })

    it('maintains 2:3 aspect ratio for medium size', () => {
      render(<BookCover size="md" />)
      const coverSlot = screen.getByTestId('cover-slot')
      const width = parseInt(coverSlot.getAttribute('data-width') || '0')
      const height = parseInt(coverSlot.getAttribute('data-height') || '0')
      expect(height / width).toBeCloseTo(1.5, 1)
    })

    it('maintains 2:3 aspect ratio for large size', () => {
      render(<BookCover size="lg" />)
      const coverSlot = screen.getByTestId('cover-slot')
      const width = parseInt(coverSlot.getAttribute('data-width') || '0')
      const height = parseInt(coverSlot.getAttribute('data-height') || '0')
      expect(height / width).toBeCloseTo(1.5, 1)
    })
  })

  describe('Image URL', () => {
    it('renders image when imageUrl is provided', () => {
      render(<BookCover imageUrl="https://example.com/book.jpg" />)
      expect(screen.getByTestId('cover-image')).toBeInTheDocument()
      expect(screen.getByTestId('cover-image')).toHaveAttribute(
        'src',
        'https://example.com/book.jpg'
      )
    })

    it('renders placeholder when imageUrl is not provided', () => {
      render(<BookCover />)
      expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument()
    })

    it('renders placeholder when imageUrl is null', () => {
      render(<BookCover imageUrl={null} />)
      expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument()
    })

    it('renders placeholder when imageUrl is empty string', () => {
      render(<BookCover imageUrl="" />)
      expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument()
    })
  })

  describe('Alt text', () => {
    it('uses default alt text', () => {
      render(<BookCover />)
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toBeInTheDocument()
    })

    it('uses custom title as alt text', () => {
      render(<BookCover title="The Great Gatsby" />)
      expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
    })

    it('uses default title when not provided', () => {
      render(<BookCover />)
      expect(screen.getByText('Book cover')).toBeInTheDocument()
    })
  })

  describe('Props combination', () => {
    it('combines size, image, and title props', () => {
      render(
        <BookCover
          size="lg"
          imageUrl="https://example.com/gatsby.jpg"
          title="Gatsby Book Cover"
        />
      )
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toHaveAttribute('data-width', '128')
      expect(coverSlot).toHaveAttribute('data-height', '192')
      expect(screen.getByTestId('cover-image')).toHaveAttribute(
        'src',
        'https://example.com/gatsby.jpg'
      )
    })

    it('works with all size variants and images', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']
      sizes.forEach((size) => {
        const { unmount } = render(
          <BookCover size={size} imageUrl={`https://example.com/${size}.jpg`} />
        )
        expect(screen.getByTestId('cover-image')).toHaveAttribute(
          'src',
          `https://example.com/${size}.jpg`
        )
        unmount()
      })
    })
  })

  describe('Default behavior', () => {
    it('renders with all default props', () => {
      render(<BookCover />)
      const coverSlot = screen.getByTestId('cover-slot')
      expect(coverSlot).toHaveAttribute('data-width', '80')
      expect(coverSlot).toHaveAttribute('data-height', '120')
      expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument()
      expect(screen.getByText('Book cover')).toBeInTheDocument()
    })
  })
})

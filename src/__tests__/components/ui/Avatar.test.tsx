import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import Avatar from '../../../components/ui/Avatar'

describe('Avatar', () => {
  describe('Rendering', () => {
    it('renders avatar with initials when no image URL', () => {
      render(<Avatar name="John Doe" userId="123" />)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders avatar with image when imageUrl provided', () => {
      render(
        <Avatar
          name="Jane Doe"
          userId="456"
          imageUrl="https://example.com/avatar.jpg"
        />
      )
      const img = screen.getByAltText('Jane Doe')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('renders image with rounded-full and object-cover classes', () => {
      render(
        <Avatar
          name="Jane Doe"
          userId="456"
          imageUrl="https://example.com/avatar.jpg"
        />
      )
      const img = screen.getByAltText('Jane Doe')
      expect(img).toHaveClass('rounded-full', 'object-cover')
    })
  })

  describe('Sizing', () => {
    it('applies small size classes', () => {
      render(<Avatar name="John Doe" userId="123" size="sm" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('w-5', 'h-5', 'text-[8px]')
    })

    it('applies medium size classes by default', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('w-6', 'h-6', 'text-[10px]')
    })

    it('applies large size classes', () => {
      render(<Avatar name="John Doe" userId="123" size="lg" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('w-10', 'h-10', 'text-[12px]')
    })

    it('applies xl size classes', () => {
      render(<Avatar name="John Doe" userId="123" size="xl" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('w-[88px]', 'h-[88px]', 'text-[35px]')
    })

    it('applies 2xl size classes', () => {
      render(<Avatar name="John Doe" userId="123" size="2xl" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('w-[112px]', 'h-[112px]', 'text-[45px]')
    })
  })

  describe('Color assignment', () => {
    it('assigns consistent color based on userId', () => {
      const { container, rerender } = render(<Avatar name="User A" userId="0" />)
      const div = container.firstChild as HTMLElement
      const color1 = div.style.backgroundColor

      rerender(<Avatar name="User B" userId="0" />)
      const color2 = div.style.backgroundColor

      expect(color1).toBe(color2)
    })

    it('assigns different colors for different userIds', () => {
      const { container, rerender } = render(<Avatar name="User A" userId="0" />)
      const div = container.firstChild as HTMLElement
      const color1 = div.style.backgroundColor

      rerender(<Avatar name="User B" userId="1" />)
      const color2 = div.style.backgroundColor

      expect(color1).not.toBe(color2)
    })

    it('handles negative userId by using absolute value', () => {
      const { container, rerender } = render(<Avatar name="User A" userId="-5" />)
      const div = container.firstChild as HTMLElement
      const color1 = div.style.backgroundColor

      rerender(<Avatar name="User B" userId="5" />)
      const color2 = div.style.backgroundColor

      expect(color1).toBe(color2)
    })

    it('uses palette colors from the avatar hue token scale', () => {
      const { container } = render(<Avatar name="User" userId="0" />)
      const div = container.firstChild as HTMLElement
      const backgroundColor = div.style.backgroundColor
      expect(backgroundColor).toBeTruthy()
      expect(backgroundColor).toMatch(/^var\(--kluvs-avatar-hue-\d+\)$/)
    })

    it('uses primary color token when isOwn is true', () => {
      const { container } = render(<Avatar name="Ivan Garza" userId="5" isOwn />)
      const div = container.firstChild as HTMLElement
      expect(div.style.backgroundColor).toBe('var(--color-primary)')
    })

    it('uses palette color (not primary token) for other users', () => {
      const { container } = render(<Avatar name="Other User" userId="5" />)
      const div = container.firstChild as HTMLElement
      expect(div.style.backgroundColor).not.toBe('var(--color-primary)')
    })
  })

  describe('Title and accessibility', () => {
    it('renders with default title as name', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveAttribute('title', 'John Doe')
    })

    it('renders with custom title when provided', () => {
      render(<Avatar name="John Doe" userId="123" title="Admin User" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveAttribute('title', 'Admin User')
    })

    it('has proper semantic classes', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center')
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<Avatar name="John Doe" userId="123" className="custom-class" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('custom-class')
    })

    it('preserves default classes when adding custom className', () => {
      render(<Avatar name="John Doe" userId="123" className="custom-class" />)
      const avatar = screen.getByText('JD').parentElement
      expect(avatar).toHaveClass('rounded-full', 'custom-class')
    })
  })

  describe('Initials', () => {
    it('shows first and last initials for multi-word names', () => {
      render(<Avatar name="Alice Wonderland" userId="123" />)
      expect(screen.getByText('AW')).toBeInTheDocument()
    })

    it('shows first two characters for single-word names', () => {
      render(<Avatar name="Alice" userId="123" />)
      expect(screen.getByText('AL')).toBeInTheDocument()
    })

    it('capitalizes initials', () => {
      render(<Avatar name="alice smith" userId="123" />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('handles single character names', () => {
      render(<Avatar name="X" userId="123" />)
      expect(screen.getByText('X')).toBeInTheDocument()
    })

    it('renders initials with serif font', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const initials = screen.getByText('JD')
      expect(initials).toHaveClass('font-serif')
    })
  })

  describe('Image handling', () => {
    it('renders image with correct alt text', () => {
      render(
        <Avatar
          name="Jane Doe"
          userId="456"
          imageUrl="https://example.com/avatar.jpg"
        />
      )
      expect(screen.getByAltText('Jane Doe')).toBeInTheDocument()
    })

    it('does not render image when imageUrl is null', () => {
      render(<Avatar name="John Doe" userId="123" imageUrl={null} />)
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('does not render image when imageUrl is undefined', () => {
      render(<Avatar name="John Doe" userId="123" imageUrl={undefined} />)
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })
})

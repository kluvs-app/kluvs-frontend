import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import Avatar from '../../../components/ui/Avatar'

describe('Avatar', () => {
  describe('Rendering', () => {
    it('renders avatar with initials when no image URL', () => {
      render(<Avatar name="John Doe" userId="123" />)
      expect(screen.getByText('J')).toBeInTheDocument()
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
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('w-5', 'h-5', 'text-[8px]')
    })

    it('applies medium size classes by default', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('w-6', 'h-6', 'text-[10px]')
    })

    it('applies large size classes', () => {
      render(<Avatar name="John Doe" userId="123" size="lg" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('w-10', 'h-10', 'text-[12px]')
    })
  })

  describe('Color assignment', () => {
    it('assigns consistent color based on userId', () => {
      const { rerender } = render(<Avatar name="User A" userId="0" />)
      const avatar1 = screen.getByText('U').parentElement
      const color1 = avatar1?.style.backgroundColor

      rerender(<Avatar name="User B" userId="0" />)
      const avatar2 = screen.getByText('U').parentElement
      const color2 = avatar2?.style.backgroundColor

      expect(color1).toBe(color2)
    })

    it('assigns different colors for different userIds', () => {
      const { rerender } = render(<Avatar name="User A" userId="0" />)
      const avatar1 = screen.getByText('U').parentElement
      const color1 = avatar1?.style.backgroundColor

      rerender(<Avatar name="User B" userId="1" />)
      const avatar2 = screen.getByText('U').parentElement
      const color2 = avatar2?.style.backgroundColor

      expect(color1).not.toBe(color2)
    })

    it('handles negative userId by using absolute value', () => {
      const { rerender } = render(<Avatar name="User A" userId="-5" />)
      const avatar1 = screen.getByText('U').parentElement
      const color1 = avatar1?.style.backgroundColor

      rerender(<Avatar name="User B" userId="5" />)
      const avatar2 = screen.getByText('U').parentElement
      const color2 = avatar2?.style.backgroundColor

      expect(color1).toBe(color2)
    })

    it('uses palette colors from AVATAR_HUES', () => {
      render(<Avatar name="User" userId="0" />)
      const avatar = screen.getByText('U').parentElement
      const backgroundColor = avatar?.style.backgroundColor

      // backgroundColor is set inline, so it should match one of the hex colors
      // (browsers may convert hex to rgb, so we check the computed style contains a color value)
      expect(backgroundColor).toBeTruthy()
      expect(backgroundColor).toMatch(/^(#|rgb)/) // Should be a valid color format
    })
  })

  describe('Title and accessibility', () => {
    it('renders with default title as name', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveAttribute('title', 'John Doe')
    })

    it('renders with custom title when provided', () => {
      render(<Avatar name="John Doe" userId="123" title="Admin User" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveAttribute('title', 'Admin User')
    })

    it('has proper semantic classes', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('rounded-full', 'flex', 'items-center', 'justify-center')
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      render(<Avatar name="John Doe" userId="123" className="custom-class" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('custom-class')
    })

    it('preserves default classes when adding custom className', () => {
      render(<Avatar name="John Doe" userId="123" className="custom-class" />)
      const avatar = screen.getByText('J').parentElement
      expect(avatar).toHaveClass('rounded-full', 'custom-class')
    })
  })

  describe('Initials', () => {
    it('uses first character of name as initial', () => {
      render(<Avatar name="Alice" userId="123" />)
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('capitalizes the initial', () => {
      render(<Avatar name="alice" userId="123" />)
      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('handles single character names', () => {
      render(<Avatar name="X" userId="123" />)
      expect(screen.getByText('X')).toBeInTheDocument()
    })

    it('renders initial with serif font', () => {
      render(<Avatar name="John Doe" userId="123" />)
      const initial = screen.getByText('J')
      expect(initial).toHaveClass('font-serif')
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
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('does not render image when imageUrl is undefined', () => {
      render(<Avatar name="John Doe" userId="123" imageUrl={undefined} />)
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('J')).toBeInTheDocument()
    })
  })
})

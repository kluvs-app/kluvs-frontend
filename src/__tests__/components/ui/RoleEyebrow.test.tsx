import { describe, it, expect } from 'vitest'
import { render, screen } from '../../utils/test-utils'
import RoleEyebrow from '../../../components/ui/RoleEyebrow'

describe('RoleEyebrow', () => {
  describe('Rendering', () => {
    it('renders role text', () => {
      render(<RoleEyebrow role="admin" />)
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('renders owner role', () => {
      render(<RoleEyebrow role="owner" />)
      expect(screen.getByText('owner')).toBeInTheDocument()
    })

    it('renders member role', () => {
      render(<RoleEyebrow role="member" />)
      expect(screen.getByText('member')).toBeInTheDocument()
    })
  })

  describe('Visual indicators', () => {
    it('renders colored dot for owner role', () => {
      const { container } = render(<RoleEyebrow role="owner" />)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).toBeInTheDocument()
      expect(dot?.className).toContain('bg-[#C9900A]')
    })

    it('renders colored dot for admin role', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).toBeInTheDocument()
      expect(dot?.className).toContain('bg-[#006781]')
    })

    it('does not render dot for member role', () => {
      const { container } = render(<RoleEyebrow role="member" />)
      const dots = container.querySelectorAll('[aria-hidden="true"]')
      expect(dots.length).toBe(0)
    })
  })

  describe('Color styling', () => {
    it('applies gold color for owner', () => {
      const { container } = render(<RoleEyebrow role="owner" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('text-[#C9900A]')
    })

    it('applies blue color for admin', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('text-[#7BA8B8]')
    })

    it('applies muted color for member', () => {
      const { container } = render(<RoleEyebrow role="member" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('text-[#48A480]')
    })
  })

  describe('Typography', () => {
    it('applies uppercase text transformation', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('uppercase')
    })

    it('applies font-medium weight', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('font-medium')
    })

    it('applies letter spacing', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('tracking-')
    })

    it('applies small text size', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('text-[11px]')
    })
  })

  describe('Custom className', () => {
    it('accepts custom className prop', () => {
      const { container } = render(
        <RoleEyebrow role="admin" className="custom-class" />
      )
      const span = container.querySelector('span')
      expect(span?.className).toContain('custom-class')
    })

    it('preserves default styles when custom className is added', () => {
      const { container } = render(<RoleEyebrow role="admin" className="custom" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('custom')
      expect(span?.className).toContain('font-medium')
      expect(span?.className).toContain('uppercase')
    })
  })

  describe('Structure', () => {
    it('renders as inline-flex', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('inline-flex')
    })

    it('centers items vertically', () => {
      const { container } = render(<RoleEyebrow role="admin" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('items-center')
    })

    it('applies gap spacing between icon and text', () => {
      const { container } = render(<RoleEyebrow role="owner" />)
      const span = container.querySelector('span')
      expect(span?.className).toContain('gap-')
    })
  })

  describe('Accessibility', () => {
    it('hides visual indicator from screen readers', () => {
      const { container } = render(<RoleEyebrow role="owner" />)
      const dot = container.querySelector('[aria-hidden="true"]')
      expect(dot).toHaveAttribute('aria-hidden', 'true')
    })

    it('provides semantic text for all roles', () => {
      const roles: Array<'owner' | 'admin' | 'member'> = [
        'owner',
        'admin',
        'member',
      ]
      roles.forEach((role) => {
        const { unmount } = render(<RoleEyebrow role={role} />)
        expect(screen.getByText(role)).toBeInTheDocument()
        unmount()
      })
    })
  })
})

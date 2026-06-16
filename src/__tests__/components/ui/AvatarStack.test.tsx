import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvatarStack from '../../../components/ui/AvatarStack'

vi.mock('../../../supabase', () => ({
  getAvatarUrl: (path: string) => `https://example.com/${path}`,
}))

const makeMembers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Member ${i + 1}`,
    avatar_path: null,
  }))

describe('AvatarStack', () => {
  describe('Rendering', () => {
    it('renders initials for each shown member', () => {
      render(
        <AvatarStack
          members={[
            { id: 1, name: 'Alice Adams', avatar_path: null },
            { id: 2, name: 'Bob Brown', avatar_path: null },
          ]}
        />
      )
      expect(screen.getByText('AA')).toBeInTheDocument()
      expect(screen.getByText('BB')).toBeInTheDocument()
    })

    it('renders avatar image when avatar_path is provided', () => {
      render(
        <AvatarStack
          members={[{ id: 1, name: 'Alice Adams', avatar_path: 'avatars/alice.jpg' }]}
        />
      )
      const img = screen.getByAltText('Alice Adams')
      expect(img).toHaveAttribute('src', 'https://example.com/avatars/alice.jpg')
    })

    it('renders nothing when members array is empty', () => {
      const { container } = render(<AvatarStack members={[]} />)
      expect(container.firstChild).toBeEmptyDOMElement()
    })

    it('falls back to "?" for members with no name', () => {
      render(<AvatarStack members={[{ id: 1, name: null, avatar_path: null }]} />)
      expect(screen.getByText('?')).toBeInTheDocument()
    })
  })

  describe('max cap and overflow pill', () => {
    it('shows no overflow pill when count is within max', () => {
      render(<AvatarStack members={makeMembers(5)} max={5} />)
      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })

    it('shows +N pill when members exceed max (default 5)', () => {
      render(<AvatarStack members={makeMembers(8)} />)
      expect(screen.getByText('+3')).toBeInTheDocument()
    })

    it('respects a custom max prop', () => {
      render(<AvatarStack members={makeMembers(10)} max={3} />)
      expect(screen.getByText('+7')).toBeInTheDocument()
    })

    it('does not render avatars beyond max', () => {
      render(<AvatarStack members={makeMembers(8)} max={5} />)
      // Only first 5 member titles should be in the DOM
      expect(screen.getAllByTitle(/Member \d/).length).toBe(5)
      expect(screen.getByText('+3')).toBeInTheDocument()
    })
  })

  describe('isOwn highlight', () => {
    it('renders without errors when currentMemberId matches a member', () => {
      render(
        <AvatarStack
          members={[
            { id: 1, name: 'Me', avatar_path: null },
            { id: 2, name: 'Other', avatar_path: null },
          ]}
          currentMemberId={1}
        />
      )
      expect(screen.getByText('ME')).toBeInTheDocument()
      expect(screen.getByText('OT')).toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('renders sm size without errors', () => {
      render(<AvatarStack members={makeMembers(3)} size="sm" />)
      expect(screen.getAllByTitle(/Member \d/).length).toBe(3)
    })

    it('renders md size without errors', () => {
      render(<AvatarStack members={makeMembers(3)} size="md" />)
      expect(screen.getAllByTitle(/Member \d/).length).toBe(3)
    })
  })

  describe('borderColor prop', () => {
    it('applies custom border color to avatar wrappers', () => {
      const { container } = render(
        <AvatarStack
          members={makeMembers(2)}
          borderColor="var(--color-bg-raised)"
        />
      )
      // jsdom doesn't resolve CSS custom properties via element.style,
      // so check the raw rendered HTML for the custom property value.
      expect(container.innerHTML).toContain('var(--color-bg-raised)')
    })
  })
})

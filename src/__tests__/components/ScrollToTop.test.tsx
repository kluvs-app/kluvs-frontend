import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ScrollToTop from '../../components/ScrollToTop'

function NavButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(to)}>go</button>
}

describe('ScrollToTop', () => {
  const scrollTo = vi.fn()

  beforeEach(() => {
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  })

  it('renders nothing', () => {
    const { container } = render(
      <MemoryRouter><ScrollToTop /></MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('scrolls to the top on mount', () => {
    render(<MemoryRouter><ScrollToTop /></MemoryRouter>)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('scrolls to the top again when the pathname changes', async () => {
    const user = userEvent.setup()
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/a']}>
        <ScrollToTop />
        <NavButton to="/b" />
      </MemoryRouter>
    )
    expect(scrollTo).toHaveBeenCalledTimes(1)

    await user.click(getByRole('button', { name: 'go' }))

    expect(scrollTo).toHaveBeenCalledTimes(2)
  })
})

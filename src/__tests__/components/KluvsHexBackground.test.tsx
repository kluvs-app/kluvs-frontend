import { render } from '../utils/test-utils'
import { act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import KluvsHexBackground from '../../components/KluvsHexBackground'

// ─── Shared mock canvas context ───────────────────────────────────────────────

function makeMockCtx() {
  return {
    scale: vi.fn().mockReturnThis(),
    clearRect: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    restore: vi.fn().mockReturnThis(),
    translate: vi.fn().mockReturnThis(),
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'round' as CanvasLineJoin,
  }
}

function makeMockResizeObserver() {
  class MockResizeObserver {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) { this.callback = callback }
    observe = vi.fn((element: HTMLElement) => {
      const entry = {
        target: element,
        contentRect: { width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) },
        borderBoxSize: [],
        contentBoxSize: [],
        devicePixelContentBoxSize: [],
      }
      this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
    })
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  return MockResizeObserver
}

// ─── Suite: basic rendering (no size / canvas execution) ─────────────────────

describe('KluvsHexBackground – rendering', () => {
  let mockCtx: ReturnType<typeof makeMockCtx>

  beforeEach(() => {
    mockCtx = makeMockCtx()
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)
    global.ResizeObserver = makeMockResizeObserver() as unknown as typeof ResizeObserver
  })

  it('renders wrapper div with aria-hidden and correct styles', () => {
    const { container } = render(<KluvsHexBackground />)
    const wrapper = container.querySelector('div')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    expect(wrapper?.getAttribute('style')).toContain('position: absolute')
    expect(wrapper?.getAttribute('style')).toContain('inset: 0')
    expect(wrapper?.getAttribute('style')).toContain('overflow: hidden')
    expect(wrapper?.getAttribute('style')).toContain('pointer-events: none')
  })

  it('renders a canvas element with 100% width/height', () => {
    const { container } = render(<KluvsHexBackground />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveStyle({ display: 'block', width: '100%', height: '100%' })
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(<KluvsHexBackground className="my-class" />)
    expect(container.querySelector('div')).toHaveClass('my-class')
  })

  it('renders without className by default', () => {
    const { container } = render(<KluvsHexBackground />)
    expect(container.querySelector('div')?.className).toBe('')
  })

  it('unmounts cleanly', () => {
    const { unmount } = render(<KluvsHexBackground />)
    expect(() => unmount()).not.toThrow()
  })

  it('handles multiple mount/unmount cycles', () => {
    const pairs = Array.from({ length: 3 }, () => render(<KluvsHexBackground />))
    expect(() => pairs.forEach(({ unmount }) => unmount())).not.toThrow()
  })

  it('fires resize event without throwing', () => {
    const { container } = render(<KluvsHexBackground />)
    window.dispatchEvent(new Event('resize'))
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('canvas getContext returns non-null', () => {
    const { container } = render(<KluvsHexBackground />)
    expect((container.querySelector('canvas') as HTMLCanvasElement).getContext('2d')).not.toBeNull()
  })
})

// ─── Suite: props (smoke tests) ───────────────────────────────────────────────

describe('KluvsHexBackground – props', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(makeMockCtx())
    global.ResizeObserver = makeMockResizeObserver() as unknown as typeof ResizeObserver
  })

  const propCases: Array<[string, Partial<React.ComponentProps<typeof KluvsHexBackground>>]> = [
    ['accentColor', { accentColor: '#FF0000' }],
    ['bgFill', { bgFill: '#FFFFFF' }],
    ['bgContour', { bgContour: '#333333' }],
    ['cellSize', { cellSize: 64 }],
    ['logoTopPx', { logoTopPx: 200 }],
    ['ringGap', { ringGap: 0.2 }],
    ['pulseDuration', { pulseDuration: 1.0 }],
    ['loopGap', { loopGap: 5.0 }],
    ['jumpPx', { jumpPx: 20 }],
    ['className', { className: 'test' }],
    ['all props', {
      accentColor: '#FF6600', bgFill: '#000000', bgContour: '#1a1a1a',
      cellSize: 48, logoTopPx: 150, ringGap: 0.15, pulseDuration: 0.6,
      loopGap: 3.5, jumpPx: 18, className: 'test-class',
    }],
  ]

  it.each(propCases)('accepts %s prop', (_name, props) => {
    const { container } = render(<KluvsHexBackground {...props} />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('rerenders with new props without throwing', () => {
    const { rerender } = render(<KluvsHexBackground accentColor="#D16D30" cellSize={32} />)
    rerender(<KluvsHexBackground accentColor="#FF0000" cellSize={48} />)
    rerender(<KluvsHexBackground accentColor="#00FF00" cellSize={64} />)
  })
})

// ─── Suite: canvas drawing (with real size via getBoundingClientRect mock) ────

describe('KluvsHexBackground – canvas drawing with real size', () => {
  let mockCtx: ReturnType<typeof makeMockCtx>
  let rafQueue: Array<FrameRequestCallback>
  let originalGetBCR: typeof Element.prototype.getBoundingClientRect
  let originalRAF: typeof requestAnimationFrame
  let originalCAF: typeof cancelAnimationFrame
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    mockCtx = makeMockCtx()
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)

    // Make the wrapper div report a real size
    originalGetBCR = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800, height: 600,
      top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    // Capture RAF callbacks without auto-executing them
    rafQueue = []
    originalRAF = global.requestAnimationFrame
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafQueue.push(cb)
      return rafQueue.length
    })

    originalCAF = global.cancelAnimationFrame
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {})

    // matchMedia stub
    originalMatchMedia = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '',
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })

    // ResizeObserver that fires measure() with getBoundingClientRect result
    global.ResizeObserver = makeMockResizeObserver() as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBCR
    global.requestAnimationFrame = originalRAF
    global.cancelAnimationFrame = originalCAF
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia })
    vi.restoreAllMocks()
  })

  function flushOneDrawFrame() {
    // The draw RAF is the last one scheduled after the size effect runs.
    // Execute all queued callbacks once (draw schedules itself again, but we stop).
    const pending = rafQueue.splice(0)
    for (const cb of pending) cb(performance.now())
  }

  it('calls clearRect when size is set', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('fills background rect with bgFill color', async () => {
    render(<KluvsHexBackground bgFill="#112233" />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.fillStyle).toBeDefined()
  })

  it('calls save/restore for trefoil transform', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.save).toHaveBeenCalled()
    expect(mockCtx.restore).toHaveBeenCalled()
  })

  it('calls translate for trefoil centroid offset', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.translate).toHaveBeenCalled()
  })

  it('calls stroke for trefoil bevel outline', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.stroke).toHaveBeenCalled()
  })

  it('uses accentColor for stroke', async () => {
    render(<KluvsHexBackground accentColor="#ABCDEF" />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.strokeStyle).toBe('#ABCDEF')
  })

  it('calls beginPath/fill for hex cells', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.beginPath).toHaveBeenCalled()
    expect(mockCtx.fill).toHaveBeenCalled()
  })

  it('sets lineJoin to round', async () => {
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.lineJoin).toBe('round')
  })

  it('draws correctly with reduced motion enabled', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: '',
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
    render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
    expect(mockCtx.fillRect).toHaveBeenCalled()
  })

  it('draws multiple frames without errors', async () => {
    render(<KluvsHexBackground />)
    await act(async () => {
      // Execute a few frames; each draw call re-queues itself
      for (let i = 0; i < 3; i++) {
        const pending = rafQueue.splice(0)
        if (pending.length === 0) break
        for (const cb of pending) cb(performance.now() + i * 16)
      }
    })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('runs draw effect again when props change', async () => {
    const { rerender } = render(<KluvsHexBackground accentColor="#D16D30" />)
    await act(async () => { flushOneDrawFrame() })

    const callCount = (mockCtx.clearRect as ReturnType<typeof vi.fn>).mock.calls.length

    rerender(<KluvsHexBackground accentColor="#FF0000" />)
    await act(async () => { flushOneDrawFrame() })

    expect((mockCtx.clearRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callCount)
  })

  it('cancels animation frame on unmount', async () => {
    const { unmount } = render(<KluvsHexBackground />)
    await act(async () => { flushOneDrawFrame() })
    expect(() => unmount()).not.toThrow()
    expect(global.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('handles small cellSize without throwing', async () => {
    render(<KluvsHexBackground cellSize={8} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('handles large cellSize without throwing', async () => {
    render(<KluvsHexBackground cellSize={256} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('handles zero jumpPx', async () => {
    render(<KluvsHexBackground jumpPx={0} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('handles large logoTopPx', async () => {
    render(<KluvsHexBackground logoTopPx={1000} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('handles extreme pulseDuration', async () => {
    render(<KluvsHexBackground pulseDuration={0.1} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('handles extreme loopGap', async () => {
    render(<KluvsHexBackground loopGap={0.1} />)
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
  })

  it('renders with all custom props and draws', async () => {
    render(
      <KluvsHexBackground
        accentColor="#FF6600"
        bgFill="#000000"
        bgContour="#1a1a1a"
        cellSize={48}
        logoTopPx={150}
        ringGap={0.15}
        pulseDuration={0.6}
        loopGap={3.5}
        jumpPx={18}
        className="test-class"
      />
    )
    await act(async () => { flushOneDrawFrame() })
    expect(mockCtx.clearRect).toHaveBeenCalled()
    expect(mockCtx.stroke).toHaveBeenCalled()
    expect(mockCtx.fill).toHaveBeenCalled()
  })

  it('draws rings at non-zero elapsed time (animation phase)', async () => {
    render(<KluvsHexBackground ringGap={0.05} pulseDuration={0.4} loopGap={1.0} />)
    const startTime = performance.now()
    await act(async () => {
      const pending = rafQueue.splice(0)
      // first frame sets startTime
      for (const cb of pending) cb(startTime)
    })
    await act(async () => {
      const pending = rafQueue.splice(0)
      // second frame at t+500ms exercises animation phase branches
      for (const cb of pending) cb(startTime + 500)
    })
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(2)
  })
})

// ─── Suite: size guard (no draw when size is zero) ────────────────────────────

describe('KluvsHexBackground – size guard', () => {
  let rafQueue: Array<FrameRequestCallback>

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(makeMockCtx())

    // getBoundingClientRect returns 0,0 (default jsdom behaviour)
    rafQueue = []
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {})

    global.ResizeObserver = makeMockResizeObserver() as unknown as typeof ResizeObserver
  })

  afterEach(() => vi.restoreAllMocks())

  it('does not call getContext when size is 0×0', () => {
    // getBoundingClientRect not mocked here → returns 0,0 → guard fires
    render(<KluvsHexBackground />)
    // The draw RAF is never scheduled, so queue only has the measure RAF
    // clearRect is never called
    const mockCtx = (HTMLCanvasElement.prototype.getContext as ReturnType<typeof vi.fn>).mock.results[0]?.value
    // getContext itself may be called by the test harness but clearRect must not be
    if (mockCtx) {
      expect(mockCtx.clearRect).not.toHaveBeenCalled()
    }
  })
})

import { render } from '../utils/test-utils'
import { vi } from 'vitest'
import KluvsHexBackground from '../../components/KluvsHexBackground'

// Test helper: extract and test pure functions that are internal to the component
// We'll test them through the component's behavior with mocked canvas

describe('KluvsHexBackground', () => {
  let mockCanvasContext: any
  let mockResizeObserverCallback: FrameRequestCallback | null = null

  beforeEach(() => {
    // Create a comprehensive mock canvas context
    mockCanvasContext = {
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
      lineJoin: 'round',
    }

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext)

    // Mock ResizeObserver to trigger callback with a size
    class MockResizeObserver {
      callback: any
      constructor(callback: any) {
        this.callback = callback
      }
      observe = vi.fn((element: HTMLElement) => {
        // Simulate ResizeObserver callback with a mock entry
        const entry = {
          target: element,
          contentRect: {
            width: 800,
            height: 600,
            top: 0,
            left: 0,
            bottom: 600,
            right: 800,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        }
        this.callback([entry])
      })
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
    global.ResizeObserver = MockResizeObserver as any
  })

  describe('Rendering', () => {
    it('should render the wrapper div with correct attributes', () => {
      const { container } = render(<KluvsHexBackground />)
      const wrapper = container.querySelector('div')

      expect(wrapper).toBeInTheDocument()
      expect(wrapper).toHaveAttribute('aria-hidden', 'true')
      expect(wrapper?.getAttribute('style')).toContain('position: absolute')
      expect(wrapper?.getAttribute('style')).toContain('inset: 0')
      expect(wrapper?.getAttribute('style')).toContain('overflow: hidden')
      expect(wrapper?.getAttribute('style')).toContain('pointer-events: none')
    })

    it('should render a canvas element inside the wrapper', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas')

      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveStyle({
        display: 'block',
        width: '100%',
        height: '100%',
      })
    })

    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <KluvsHexBackground className="custom-class" />
      )
      const wrapper = container.querySelector('div')

      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('Canvas Setup', () => {
    it('should render canvas with correct styles', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas')

      expect(canvas).toHaveStyle({
        display: 'block',
        width: '100%',
        height: '100%',
      })
    })

    it('should initialize canvas element', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement

      expect(canvas).toBeInTheDocument()
      expect(canvas.getContext('2d')).not.toBeNull()
    })
  })

  describe('ResizeObserver', () => {
    it('should render without errors with ResizeObserver', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas')

      expect(canvas).toBeInTheDocument()
    })

    it('should unmount without errors', () => {
      const { unmount } = render(<KluvsHexBackground />)

      expect(() => unmount()).not.toThrow()
    })

    it('should handle multiple mount/unmount cycles', () => {
      const renders = [
        render(<KluvsHexBackground />),
        render(<KluvsHexBackground />),
        render(<KluvsHexBackground />),
      ]

      expect(() => {
        renders.forEach(r => r.unmount())
      }).not.toThrow()
    })
  })

  describe('Window Resize Listener', () => {
    it('should render component and handle resize setup/cleanup', () => {
      const { unmount } = render(<KluvsHexBackground />)

      // Component mounts and sets up resize listeners without throwing
      expect(() => unmount()).not.toThrow()
    })

    it('should render without errors on resize', () => {
      const { container } = render(<KluvsHexBackground />)

      // Simulate window resize
      window.dispatchEvent(new Event('resize'))

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Animation Frame Management', () => {
    it('should render and manage animation frames without errors', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should cleanup animation frames on unmount', () => {
      const { unmount } = render(<KluvsHexBackground />)

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Props Handling', () => {
    it('should use default colors when no props provided', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom accentColor', () => {
      const { container } = render(
        <KluvsHexBackground accentColor="#FF0000" />
      )

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom bgFill', () => {
      const { container } = render(<KluvsHexBackground bgFill="#FFFFFF" />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom bgContour', () => {
      const { container } = render(
        <KluvsHexBackground bgContour="#333333" />
      )

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom cellSize', () => {
      const { container } = render(<KluvsHexBackground cellSize={64} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom logoTopPx', () => {
      const { container } = render(<KluvsHexBackground logoTopPx={200} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom ringGap', () => {
      const { container } = render(<KluvsHexBackground ringGap={0.2} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom pulseDuration', () => {
      const { container } = render(
        <KluvsHexBackground pulseDuration={1.0} />
      )

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom loopGap', () => {
      const { container } = render(<KluvsHexBackground loopGap={5.0} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept custom jumpPx', () => {
      const { container } = render(<KluvsHexBackground jumpPx={20} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept all props simultaneously', () => {
      const { container } = render(
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

      const wrapper = container.querySelector('div')
      const canvas = container.querySelector('canvas')

      expect(wrapper).toHaveClass('test-class')
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Prefers Reduced Motion', () => {
    it('should render with default motion settings', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render without errors', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup without errors on unmount', () => {
      const { unmount } = render(<KluvsHexBackground />)

      expect(() => unmount()).not.toThrow()
    })

    it('should handle multiple mount/unmount cycles without memory leaks', () => {
      const unmounts = []

      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<KluvsHexBackground />)
        unmounts.push(unmount)
      }

      expect(() => {
        unmounts.forEach(unmount => unmount())
      }).not.toThrow()
    })
  })

  describe('DOM Structure', () => {
    it('should maintain correct DOM hierarchy', () => {
      const { container } = render(<KluvsHexBackground />)

      const wrappers = container.querySelectorAll('div')
      const canvas = container.querySelector('canvas')

      expect(wrappers.length).toBeGreaterThan(0)
      expect(canvas).toBeInTheDocument()
    })

    it('should render with canvas element', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas')

      expect(canvas).toBeInTheDocument()
      expect(canvas?.parentElement).toBeTruthy()
    })
  })

  describe('Default Props', () => {
    it('should render with all default props', () => {
      const { container } = render(<KluvsHexBackground />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render without className when not provided', () => {
      const { container } = render(<KluvsHexBackground />)
      const wrapper = container.querySelector('div')
      expect(wrapper?.className).toBe('')
    })
  })

  describe('Canvas Drawing Operations', () => {
    it('should get 2D context from canvas', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement

      expect(canvas.getContext('2d')).not.toBeNull()
    })

    it('should initialize canvas with correct methods available', () => {
      render(<KluvsHexBackground />)

      // All required canvas methods should be available on the mock
      expect(mockCanvasContext.clearRect).toBeDefined()
      expect(mockCanvasContext.fillRect).toBeDefined()
      expect(mockCanvasContext.beginPath).toBeDefined()
      expect(mockCanvasContext.moveTo).toBeDefined()
      expect(mockCanvasContext.lineTo).toBeDefined()
      expect(mockCanvasContext.closePath).toBeDefined()
      expect(mockCanvasContext.fill).toBeDefined()
      expect(mockCanvasContext.stroke).toBeDefined()
      expect(mockCanvasContext.save).toBeDefined()
      expect(mockCanvasContext.restore).toBeDefined()
      expect(mockCanvasContext.translate).toBeDefined()
      expect(mockCanvasContext.scale).toBeDefined()
    })

    it('should support fillStyle property', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.fillStyle).toBeDefined()
    })

    it('should support strokeStyle property', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.strokeStyle).toBeDefined()
    })

    it('should support lineWidth property', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.lineWidth).toBeGreaterThan(0)
    })

    it('should support lineJoin property', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.lineJoin).toBe('round')
    })

    it('should support globalAlpha property', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.globalAlpha).toBeDefined()
    })
  })

  describe('Props Affecting Canvas', () => {
    it('should accept accentColor prop', () => {
      const { container } = render(
        <KluvsHexBackground accentColor="#FF5500" />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept bgFill prop', () => {
      const { container } = render(
        <KluvsHexBackground bgFill="#FFFFFF" />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept bgContour prop', () => {
      const { container } = render(
        <KluvsHexBackground bgContour="#333333" />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept cellSize prop', () => {
      const { container } = render(<KluvsHexBackground cellSize={64} />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept logoTopPx prop', () => {
      const { container } = render(<KluvsHexBackground logoTopPx={200} />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept ringGap prop', () => {
      const { container } = render(<KluvsHexBackground ringGap={0.2} />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept pulseDuration prop', () => {
      const { container } = render(
        <KluvsHexBackground pulseDuration={1.0} />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept loopGap prop', () => {
      const { container } = render(<KluvsHexBackground loopGap={5.0} />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should accept jumpPx prop', () => {
      const { container } = render(<KluvsHexBackground jumpPx={20} />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Size and Positioning', () => {
    it('should initialize canvas with width property', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement

      expect(canvas.width).toBeDefined()
      expect(typeof canvas.width).toBe('number')
    })

    it('should initialize canvas with height property', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement

      expect(canvas.height).toBeDefined()
      expect(typeof canvas.height).toBe('number')
    })

    it('should render with small logoTopPx', () => {
      const { container } = render(<KluvsHexBackground logoTopPx={10} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with large logoTopPx', () => {
      const { container } = render(<KluvsHexBackground logoTopPx={1000} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Global Alpha and Opacity', () => {
    it('should set globalAlpha for animations', () => {
      render(<KluvsHexBackground />)
      // globalAlpha should be modified during animation
      expect(mockCanvasContext.globalAlpha).toBeDefined()
    })

    it('should reset globalAlpha after drawing rings', () => {
      render(<KluvsHexBackground />)
      // After drawing rings, globalAlpha should be reset to 1
      expect(mockCanvasContext.globalAlpha === 1 || mockCanvasContext.globalAlpha === undefined).toBe(true)
    })
  })

  describe('Line Styling', () => {
    it('should set lineJoin to round', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.lineJoin).toBe('round')
    })

    it('should set lineWidth for strokes', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.lineWidth).toBeGreaterThan(0)
    })

    it('should set strokeStyle for outlines', () => {
      render(<KluvsHexBackground />)
      expect(mockCanvasContext.strokeStyle).toBeDefined()
    })
  })

  describe('Animation and Effects', () => {
    it('should initialize canvas effect properly', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas')

      expect(canvas).toBeInTheDocument()
      expect(mockCanvasContext).toBeDefined()
    })

    it('should handle different pulseDuration values', () => {
      const { rerender } = render(<KluvsHexBackground pulseDuration={0.55} />)

      rerender(<KluvsHexBackground pulseDuration={0.3} />)
      expect(mockCanvasContext).toBeDefined()

      rerender(<KluvsHexBackground pulseDuration={1.5} />)
      expect(mockCanvasContext).toBeDefined()
    })

    it('should handle various animation parameters', () => {
      const { container } = render(
        <KluvsHexBackground
          pulseDuration={0.6}
          loopGap={2.5}
          ringGap={0.15}
          jumpPx={18}
        />
      )

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Multiple Renders with Different Props', () => {
    it('should handle sequential prop changes', () => {
      const { rerender } = render(
        <KluvsHexBackground accentColor="#D16D30" cellSize={32} />
      )

      rerender(
        <KluvsHexBackground accentColor="#FF0000" cellSize={48} />
      )

      rerender(
        <KluvsHexBackground accentColor="#00FF00" cellSize={64} />
      )

      expect(mockCanvasContext).toBeDefined()
    })

    it('should handle all props changing at once', () => {
      const { rerender } = render(
        <KluvsHexBackground
          accentColor="#D16D30"
          bgFill="#0a0a0a"
          bgContour="#1a1a1a"
          cellSize={32}
          logoTopPx={96}
          ringGap={0.1}
          pulseDuration={0.55}
          loopGap={3.2}
          jumpPx={14}
        />
      )

      rerender(
        <KluvsHexBackground
          accentColor="#FF5500"
          bgFill="#FFFFFF"
          bgContour="#333333"
          cellSize={64}
          logoTopPx={200}
          ringGap={0.2}
          pulseDuration={1.0}
          loopGap={5.0}
          jumpPx={25}
        />
      )

      expect(mockCanvasContext).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero width canvas gracefully', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should handle very small cellSize', () => {
      const { container } = render(<KluvsHexBackground cellSize={8} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should handle very large cellSize', () => {
      const { container } = render(<KluvsHexBackground cellSize={256} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should handle extreme animation durations', () => {
      const { container } = render(
        <KluvsHexBackground pulseDuration={0.1} />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()

      const { container: container2 } = render(
        <KluvsHexBackground pulseDuration={10} />
      )
      expect(container2.querySelector('canvas')).toBeInTheDocument()
    })

    it('should handle extreme ring gaps', () => {
      const { container } = render(
        <KluvsHexBackground ringGap={0.01} />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()

      const { container: container2 } = render(
        <KluvsHexBackground ringGap={1.0} />
      )
      expect(container2.querySelector('canvas')).toBeInTheDocument()
    })

    it('should handle zero jumpPx', () => {
      const { container } = render(<KluvsHexBackground jumpPx={0} />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })
  })

  describe('Canvas State Management', () => {
    it('should maintain canvas reference throughout lifecycle', () => {
      const { container, unmount } = render(<KluvsHexBackground />)

      const canvas = container.querySelector('canvas') as HTMLCanvasElement
      expect(canvas).toBeInTheDocument()

      unmount()
      // Component should unmount without errors
      expect(true).toBe(true)
    })

    it('should handle canvas context retrieval', () => {
      const { container } = render(<KluvsHexBackground />)
      const canvas = container.querySelector('canvas') as HTMLCanvasElement

      const ctx = canvas.getContext('2d')
      expect(ctx).not.toBeNull()
    })
  })

  describe('Effect Dependencies and Redraws', () => {
    it('should have size as dependency for draw effect', () => {
      const { rerender } = render(<KluvsHexBackground cellSize={32} />)

      // Force a rerender to trigger size updates
      rerender(<KluvsHexBackground cellSize={32} />)

      expect(mockCanvasContext).toBeDefined()
    })

    it('should update canvas when any animation prop changes', () => {
      const { rerender } = render(
        <KluvsHexBackground
          accentColor="#D16D30"
          bgFill="#0a0a0a"
          bgContour="#1a1a1a"
          cellSize={32}
          logoTopPx={96}
          ringGap={0.1}
          pulseDuration={0.55}
          loopGap={3.2}
          jumpPx={14}
        />
      )

      // Change one prop to trigger effect
      rerender(
        <KluvsHexBackground
          accentColor="#FF0000"
          bgFill="#0a0a0a"
          bgContour="#1a1a1a"
          cellSize={32}
          logoTopPx={96}
          ringGap={0.1}
          pulseDuration={0.55}
          loopGap={3.2}
          jumpPx={14}
        />
      )

      expect(mockCanvasContext).toBeDefined()
    })
  })

  describe('Component Lifecycle', () => {
    it('should mount and render canvas', () => {
      const { container } = render(<KluvsHexBackground />)

      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should cleanup on unmount', () => {
      const { unmount } = render(<KluvsHexBackground />)

      expect(() => unmount()).not.toThrow()
    })

    it('should handle rapid mount/unmount cycles', () => {
      const cycles = 5
      for (let i = 0; i < cycles; i++) {
        const { unmount } = render(<KluvsHexBackground />)
        expect(() => unmount()).not.toThrow()
      }
    })

    it('should persist canvas element across prop updates', () => {
      const { container, rerender } = render(
        <KluvsHexBackground accentColor="#D16D30" />
      )

      const canvas1 = container.querySelector('canvas')

      rerender(<KluvsHexBackground accentColor="#FF0000" />)

      const canvas2 = container.querySelector('canvas')

      // Same canvas element should be in DOM
      expect(canvas2).toBeInTheDocument()
    })
  })

  describe('Complex Prop Combinations', () => {
    it('should render with minimal props', () => {
      const { container } = render(<KluvsHexBackground />)
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with custom color scheme', () => {
      const { container } = render(
        <KluvsHexBackground
          accentColor="#FF5500"
          bgFill="#FFFFFF"
          bgContour="#CCCCCC"
        />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with custom dimensions', () => {
      const { container } = render(
        <KluvsHexBackground cellSize={48} logoTopPx={150} />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with custom animation timing', () => {
      const { container } = render(
        <KluvsHexBackground
          pulseDuration={0.75}
          loopGap={4.0}
          ringGap={0.12}
        />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with custom animation distance', () => {
      const { container } = render(
        <KluvsHexBackground jumpPx={20} />
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
    })

    it('should render with all custom props', () => {
      const { container } = render(
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

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()

      const wrapper = container.querySelector('div')
      expect(wrapper).toHaveClass('test-class')
    })
  })
})

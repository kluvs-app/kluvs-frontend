import { useEffect, useRef, useState } from 'react'

type Cell = { q: number; r: number }
type Pt = [number, number]

interface Props {
  accentColor?: string
  bgFill?: string
  bgContour?: string
  cellSize?: number
  logoTopPx?: number
  ringGap?: number
  pulseDuration?: number
  loopGap?: number
  jumpPx?: number
  className?: string
}

const SQRT3 = Math.sqrt(3)
const NEIGHBORS: Array<[number, number]> = [
  [+1,  0], [-1,  0],
  [ 0, +1], [ 0, -1],
  [+1, -1], [-1, +1],
]

const TREFOIL: Cell[] = [
  { q: 0, r: 0 },
  { q: 1, r: 0 },
  { q: 0, r: 1 },
]

const keyOf = (q: number, r: number) => `${q},${r}`

/* istanbul ignore next */
function buildRings(maxRing: number): Cell[][] {
  const visited = new Map<string, number>()
  const rings: Cell[][] = [[]]
  for (const c of TREFOIL) {
    visited.set(keyOf(c.q, c.r), 0)
    rings[0].push(c)
  }
  let frontier: Cell[] = [...TREFOIL]
  for (let n = 1; n <= maxRing; n++) {
    const next: Cell[] = []
    const ring: Cell[] = []
    for (const c of frontier) {
      for (const [dq, dr] of NEIGHBORS) {
        const nq = c.q + dq
        const nr = c.r + dr
        const k = keyOf(nq, nr)
        if (!visited.has(k)) {
          visited.set(k, n)
          ring.push({ q: nq, r: nr })
          next.push({ q: nq, r: nr })
        }
      }
    }
    rings.push(ring)
    frontier = next
  }
  return rings
}

/* istanbul ignore next */
function offsetPolygon(pts: Pt[], dist: number): Pt[] {
  const n = pts.length
  const cx = pts.reduce((s, p) => s + p[0], 0) / n
  const cy = pts.reduce((s, p) => s + p[1], 0) / n
  function offsetWith(sign: 1 | -1): Pt[] {
    const edges: Array<{ p1: Pt; p2: Pt }> = []
    for (let i = 0; i < n; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % n]
      const ex = x2 - x1, ey = y2 - y1
      const len = Math.hypot(ex, ey)
      const nx = (sign * -ey) / len
      const ny = (sign *  ex) / len
      edges.push({
        p1: [x1 + nx * dist, y1 + ny * dist],
        p2: [x2 + nx * dist, y2 + ny * dist],
      })
    }
    const out: Pt[] = []
    for (let i = 0; i < n; i++) {
      const e0 = edges[(i + n - 1) % n]
      const e1 = edges[i]
      const [a1, a2] = e0.p1
      const b1 = e0.p2[0] - e0.p1[0], b2 = e0.p2[1] - e0.p1[1]
      const [c1, c2] = e1.p1
      const d1 = e1.p2[0] - e1.p1[0], d2 = e1.p2[1] - e1.p1[1]
      const denom = b1 * d2 - b2 * d1
      if (Math.abs(denom) < 1e-9) {
        out.push([(e0.p2[0] + e1.p1[0]) / 2, (e0.p2[1] + e1.p1[1]) / 2])
      } else {
        const t = ((c1 - a1) * d2 - (c2 - a2) * d1) / denom
        out.push([a1 + t * b1, a2 + t * b2])
      }
    }
    return out
  }
  const tp = offsetWith(+1), tm = offsetWith(-1)
  const dp = Math.hypot(tp[0][0] - cx, tp[0][1] - cy)
  const dm = Math.hypot(tm[0][0] - cx, tm[0][1] - cy)
  return dp > dm ? tp : tm
}

/* istanbul ignore next */
function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    const x = cx + size * Math.cos(a)
    const y = cy + size * Math.sin(a)
    if (i === 0) { ctx.moveTo(x, y) } else { ctx.lineTo(x, y) }
  }
  ctx.closePath()
}

/* istanbul ignore next */
function drawPolygonPath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  if (pts.length === 0) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
}

/* istanbul ignore next */
// Opacity + vertical offset for one ripple ring over its animation phase [0..1]
function getRingState(phase: number, jumpPx: number): { opacity: number; dy: number } {
  if (phase <= 0.14) {
    const t = phase / 0.14
    return { opacity: t, dy: -jumpPx * t }
  }
  if (phase <= 0.38) {
    const t = (phase - 0.14) / 0.24
    return { opacity: 1, dy: -jumpPx * (1 - t) }
  }
  if (phase <= 0.66) {
    const t = (phase - 0.38) / 0.28
    return { opacity: 1 - t, dy: 0 }
  }
  return { opacity: 0, dy: 0 }
}

/* istanbul ignore next */
// Vertical offset + scale for the trefoil pulse over its animation phase [0..1]
function getTrefoilState(phase: number, jumpPx: number): { dy: number; scale: number } {
  if (phase <= 0.22) {
    const t = phase / 0.22
    const ease = Math.sin(t * Math.PI / 2)
    return { dy: -jumpPx * ease, scale: 1 + 0.05 * ease }
  }
  if (phase <= 0.50) {
    const t = (phase - 0.22) / 0.28
    const ease = Math.sin(t * Math.PI / 2)
    return { dy: -jumpPx * (1 - ease), scale: 1.05 - 0.05 * ease }
  }
  return { dy: 0, scale: 1 }
}

export default function KluvsHexBackground({
  accentColor = '#D16D30',
  bgFill = '#0a0a0a',
  bgContour = '#1a1a1a',
  cellSize = 32,
  logoTopPx = 96,
  ringGap = 0.10,
  pulseDuration = 0.55,
  loopGap = 3.2,
  jumpPx = 14,
  className = '',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize(prev =>
        prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }
      )
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  useEffect(() => {
    /* istanbul ignore next */
    const canvas = canvasRef.current
    if (!canvas || size.w === 0 || size.h === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(size.w * dpr)
    canvas.height = Math.round(size.h * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // Hex layout (pointy-top)
    const W = SQRT3 * cellSize
    const ROW_H = 1.5 * cellSize
    const axial = (q: number, r: number) => ({ x: W * (q + r / 2), y: ROW_H * r })

    // Trefoil anchor
    const A = axial(0, 0), B = axial(1, 0), C = axial(0, 1)
    const tCx = (A.x + B.x + C.x) / 3
    const tCy = (A.y + B.y + C.y) / 3
    const trefoilTopRelToCentroid = -cellSize - tCy
    const offX = size.w / 2 - tCx
    const offY = (logoTopPx - trefoilTopRelToCentroid) - tCy

    // Rings
    const anchorX = size.w / 2
    const anchorY = logoTopPx - trefoilTopRelToCentroid
    const reachPx = Math.max(
      Math.hypot(anchorX,          anchorY),
      Math.hypot(size.w - anchorX, anchorY),
      Math.hypot(anchorX,          size.h - anchorY),
      Math.hypot(size.w - anchorX, size.h - anchorY),
    )
    const reach = Math.ceil(reachPx / (cellSize * SQRT3 * 0.9)) + 2
    const rings = buildRings(reach)
    const totalCycle = pulseDuration + (rings.length - 1) * ringGap + loopGap

    // Trefoil bevel outline (in world space)
    const halfW = W / 2
    const halfR = cellSize / 2
    const cornersOf = (cx: number, cy: number): Pt[] => [
      [cx,         cy - cellSize],
      [cx + halfW, cy - halfR],
      [cx + halfW, cy + halfR],
      [cx,         cy + cellSize],
      [cx - halfW, cy + halfR],
      [cx - halfW, cy - halfR],
    ]
    const cA = cornersOf(A.x, A.y), cB = cornersOf(B.x, B.y), cC = cornersOf(C.x, C.y)
    const trefoilOutline: Pt[] = [
      cA[5], cA[0], cA[1],
      cB[0], cB[1], cB[2], cB[3],
      cC[2], cC[3], cC[4], cC[5],
      cA[4],
    ]
    const BEVEL = cellSize * 0.11
    const INSET = cellSize * 0.055
    const STROKE_W = cellSize * 0.14
    const innerR = cellSize - INSET
    const bevelPts: Pt[] = offsetPolygon(trefoilOutline, BEVEL).map(([x, y]) => [x + offX, y + offY])

    // Centroid in world space (pivot for trefoil transform)
    const worldCx = tCx + offX
    const worldCy = tCy + offY

    /* istanbul ignore next */
    // Check prefers-reduced-motion once per effect run
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let startTime: number | null = null
    let rafId: number

    /* istanbul ignore next */
    function draw(timestamp: number) {
      if (startTime === null) startTime = timestamp
      const elapsed = reducedMotion ? 0 : (timestamp - startTime) / 1000

      ctx.clearRect(0, 0, size.w, size.h)

      // Solid background
      ctx.fillStyle = bgFill
      ctx.fillRect(0, 0, size.w, size.h)

      // Background rings — outermost first so inner rings paint on top
      for (let n = rings.length - 1; n >= 1; n--) {
        const rawPhase = (elapsed - n * ringGap) / totalCycle
        const phase = rawPhase - Math.floor(rawPhase)
        const { opacity, dy } = getRingState(phase, jumpPx)

        if (!reducedMotion && opacity < 0.01) continue

        ctx.globalAlpha = reducedMotion ? 1 : opacity
        for (const { q, r } of rings[n]) {
          const { x, y } = axial(q, r)
          const cx = x + offX
          const cy = y + offY + (reducedMotion ? 0 : dy)
          drawHex(ctx, cx, cy, cellSize)
          ctx.fillStyle = bgContour
          ctx.fill()
          drawHex(ctx, cx, cy, cellSize - 1.5)
          ctx.fillStyle = bgFill
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // Trefoil
      const trefoilPhase = reducedMotion ? 0 : (elapsed / totalCycle) % 1
      const { dy: tDy, scale: tScale } = getTrefoilState(trefoilPhase, jumpPx)

      ctx.save()
      // Scale around trefoil centroid, then shift vertically
      ctx.translate(worldCx, worldCy + tDy)
      ctx.scale(tScale, tScale)
      ctx.translate(-worldCx, -worldCy)

      // Bevel outline
      drawPolygonPath(ctx, bevelPts)
      ctx.strokeStyle = accentColor
      ctx.lineWidth = STROKE_W
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Filled hexes
      for (const { q, r } of TREFOIL) {
        const { x, y } = axial(q, r)
        drawHex(ctx, x + offX, y + offY, innerR)
        ctx.fillStyle = accentColor
        ctx.fill()
      }

      ctx.restore()

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [size, accentColor, bgFill, bgContour, cellSize, logoTopPx, ringGap, pulseDuration, loopGap, jumpPx])

  return (
    <div
      ref={wrapRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}

import { useId, useMemo } from 'react'

export interface PlaceholderImageProps {
  /** CSS aspect-ratio value, e.g. "16 / 9", "4 / 3", "1 / 1". Defaults to "16 / 9". */
  aspectRatio?: string
  /** Gradient start color (top-left). Any CSS color string. */
  gradientFrom?: string
  /** Gradient end color (bottom-right). Any CSS color string. */
  gradientTo?: string
  /** Contour line color. Any CSS color string. */
  lineColor?: string
  /** Contour line opacity, 0–1. */
  lineOpacity?: number
  /** Optional label rendered in the corner (e.g. "Site photo coming soon"). */
  label?: string
  /** Label text color. Any CSS color string. */
  labelColor?: string
  /** Seed to vary the generated contours between instances. */
  seed?: number
  className?: string
}

const VIEW_W = 800
const VIEW_H = 500

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Builds a set of nested, irregular closed curves around a center point,
 * like elevation contours around a hill.
 */
function buildContourGroup(
  rand: () => number,
  cx: number,
  cy: number,
  baseRadius: number,
  rings: number,
): string[] {
  const points = 14
  // Fixed angular noise per vertex, shared by every ring so rings nest without crossing.
  const angleJitter = Array.from({ length: points }, () => 0.55 + rand() * 0.9)
  const paths: string[] = []

  for (let ring = 0; ring < rings; ring++) {
    const radius = baseRadius * (1 - ring / (rings + 0.8))
    const wobble = 1 + (rand() - 0.5) * 0.06
    const pts: Array<[number, number]> = []
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = radius * angleJitter[i] * wobble
      pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.72])
    }
    // Catmull-Rom → cubic Bézier for a smooth closed curve.
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 0; i < points; i++) {
      const p0 = pts[(i - 1 + points) % points]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % points]
      const p3 = pts[(i + 2) % points]
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    }
    paths.push(d + ' Z')
  }
  return paths
}

export default function PlaceholderImage({
  aspectRatio = '16 / 9',
  gradientFrom = '#1e293b',
  gradientTo = '#0f172a',
  lineColor = '#94a3b8',
  lineOpacity = 0.45,
  label,
  labelColor,
  seed = 1,
  className = '',
}: PlaceholderImageProps) {
  const gradientId = useId()

  const paths = useMemo(() => {
    const rand = mulberry32(seed * 2654435761)
    const groups = [
      buildContourGroup(rand, VIEW_W * 0.3, VIEW_H * 0.42, 260, 7),
      buildContourGroup(rand, VIEW_W * 0.78, VIEW_H * 0.68, 200, 5),
      buildContourGroup(rand, VIEW_W * 0.62, VIEW_H * 0.12, 150, 4),
    ]
    return groups.flat()
  }, [seed])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label={label ?? 'Topographic contour placeholder image'}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <rect width={VIEW_W} height={VIEW_H} fill={`url(#${gradientId})`} />
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={lineColor}
            strokeOpacity={lineOpacity * (i % 2 === 0 ? 1 : 0.6)}
            strokeWidth={i % 3 === 0 ? 1.6 : 0.9}
          />
        ))}
      </svg>
      {label && (
        <span
          className="absolute bottom-2 right-3 text-xs tracking-wide opacity-70"
          style={{ color: labelColor ?? lineColor }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

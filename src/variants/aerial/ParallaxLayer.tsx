import type { CSSProperties, ReactNode } from 'react'

/**
 * Scroll-driven depth layer. The child drifts vertically across the
 * viewport at a rate set by `drift` (rem travelled from entry to exit),
 * creating the descent-from-altitude feeling. Pure CSS: the animation
 * only exists inside @supports (animation-timeline: view()) and
 * prefers-reduced-motion: no-preference, so this wrapper is inert
 * everywhere else.
 */
export default function ParallaxLayer({
  children,
  drift = 3,
  className = '',
  style,
}: {
  children: ReactNode
  /** Vertical travel in rem across the full scroll range. Negative inverts. */
  drift?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`ae-parallax ${className}`}
      style={{ '--ae-pr': `${drift}rem`, ...style } as CSSProperties}
    >
      {children}
    </div>
  )
}

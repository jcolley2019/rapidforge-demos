import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

/**
 * Geospatial flavor of the scroll entrance — a scan pass that resolves the
 * readout. Native CSS scroll-driven animation is the primary mechanism (see
 * the @supports block in geospatial.css); this observer only runs when the
 * browser lacks it.
 */
export default function Reveal({
  children,
  delay = 0,
  stagger,
  className = '',
}: {
  children: ReactNode
  /** Fallback-path transition delay, in ms. */
  delay?: number
  /** 0-based index for staggered scroll-range offsets within a group. */
  stagger?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (supportsScrollTimeline) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties = {}
  if (delay) style.transitionDelay = `${delay}ms`
  if (stagger !== undefined) {
    ;(style as Record<string, string>)['--g-ar'] = `${Math.min(stagger * 5, 20)}%`
  }

  return (
    <div
      ref={ref}
      className={`g-reveal ${stagger !== undefined ? 'g-reveal-stagger' : ''} ${visible ? 'g-in' : ''} ${className}`}
      style={Object.keys(style).length ? style : undefined}
    >
      {children}
    </div>
  )
}

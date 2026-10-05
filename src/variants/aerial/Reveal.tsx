import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

/**
 * Aerial flavor of the scroll entrance: a slow, heavy fade-up. CSS
 * scroll-driven animations are the primary mechanism (see aerial.css
 * @supports block); the IntersectionObserver only runs when the browser
 * lacks them.
 */
export default function Reveal({
  children,
  className = '',
  style,
  stagger,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** 0-based index for staggered range offsets within a group. */
  stagger?: number
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
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const staggerStyle: CSSProperties | undefined =
    stagger !== undefined
      ? ({
          '--ae-ar': `${Math.min(stagger * 6, 24)}%`,
          '--ae-delay': `${Math.min(stagger * 0.09, 0.36)}s`,
        } as CSSProperties)
      : undefined

  return (
    <div
      ref={ref}
      className={`ae-reveal ${stagger !== undefined ? 'ae-reveal-stagger' : ''} ${visible ? 'ae-in' : ''} ${className}`}
      style={{ ...staggerStyle, ...style }}
    >
      {children}
    </div>
  )
}

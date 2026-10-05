import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

/**
 * Shared scroll entrance. Adds `rv` and, once on screen, `rv-in`; each
 * variant styles `.rv` inside its own scope so the motion matches the
 * preset. Native scroll-driven animation is the primary path (variants
 * declare it under @supports); this observer only runs as the fallback.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
  style,
}: {
  children: ReactNode
  /** Fallback-path transition delay, in ms. */
  delay?: number
  className?: string
  style?: CSSProperties
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

  const merged: CSSProperties = { ...style }
  if (delay) merged.transitionDelay = `${delay}ms`

  return (
    <div ref={ref} className={`rv ${visible ? 'rv-in' : ''} ${className}`} style={merged}>
      {children}
    </div>
  )
}

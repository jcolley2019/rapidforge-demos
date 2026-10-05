import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')

/**
 * Texas flavor of the scroll entrance. CSS scroll-driven animations are the
 * primary mechanism (see texas.css @supports block); this component only
 * runs its IntersectionObserver when the browser lacks them.
 */
export default function Reveal({
  children,
  className = '',
  style,
  slide = false,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Horizontal slide-in flavor (used by the giant stat numeral). */
  slide?: boolean
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

  return (
    <div
      ref={ref}
      className={`tx-reveal ${slide ? 'tx-reveal-slide' : ''} ${visible ? 'tx-in' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

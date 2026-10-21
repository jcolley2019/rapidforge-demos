import { useEffect, useState, type AnimationEvent, type ReactNode, type RefObject } from 'react'
import './OverlayHeader.css'

/** `over`: floating on the hero. `solid`: fixed, fading in. `leaving`: fixed, fading out. */
export type OverlayHeaderMode = 'over' | 'solid' | 'leaving'

/**
 * The utility bar and nav of a full-bleed page. They float over the top of
 * the hero, out of flow on a transparent ground, so the photo starts at the
 * top edge; once the hero has scrolled away the header turns fixed with the
 * variant's own solid nav and fades in, and fades out again when the hero
 * comes back. An IntersectionObserver on the hero drives it, never a scroll
 * listener. Being out of flow in every mode, it moves nothing on the page.
 * Each variant styles `oh-over` (white type on the hero's top shade); the
 * solid modes show its nav as it is elsewhere, without the utility bar.
 */
export default function OverlayHeader({ hero, children }: { hero: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [mode, setMode] = useState<OverlayHeaderMode>('over')

  useEffect(() => {
    const el = hero.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      // Several entries can queue up between callbacks; the latest is where the hero is now.
      const entry = entries[entries.length - 1]
      const past = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
      setMode((m) => (past ? 'solid' : m === 'solid' ? 'leaving' : m))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hero])

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && mode === 'leaving') setMode('over')
  }

  return (
    <div className={`oh oh-${mode}`} data-overlay-header={mode} onAnimationEnd={onAnimationEnd}>
      {children}
    </div>
  )
}

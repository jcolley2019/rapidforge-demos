import { useEffect, useState } from 'react'
import { content } from '../../content/content'

/**
 * Minimal top bar: transparent while the hero is on screen, a soft
 * blurred bar once the descent begins.
 */
export default function AerialTopBar() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const hero = document.querySelector('.ae-hero')
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <header className={`ae-topbar ${solid ? 'ae-topbar-solid' : ''}`}>
      <a href="#top" className="ae-wordmark ae-link">
        {content.shortName}
      </a>
      <div className="ae-topbar-right">
        <a href={content.contact.phoneHref} className="ae-topbar-phone ae-link">
          {content.contact.phone}
        </a>
        <a href="#quote" className="ae-topbar-quote">
          Request a Survey
        </a>
      </div>
    </header>
  )
}

import { useEffect, useState } from 'react'
import { siteContent as site } from '../../brief/current'

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
        {site.shortName}
      </a>
      <div className="ae-topbar-right">
        {site.phoneHref && (
          <a href={site.phoneHref} className="ae-topbar-phone ae-link">
            {site.phone}
          </a>
        )}
        <a href={site.cta.href} className="ae-topbar-quote">
          {site.cta.label}
        </a>
      </div>
    </header>
  )
}

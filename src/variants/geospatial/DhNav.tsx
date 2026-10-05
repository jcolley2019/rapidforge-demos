import { useEffect, useState } from 'react'
import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site)

export default function DhNav() {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`dh-nav ${solid ? 'dh-nav-solid' : ''}`}>
      <div className="dh-wrap dh-nav-inner">
        <a href="#top" className="text-base font-medium tracking-tight">
          {site.shortName}
        </a>
        <nav className="dh-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="dh-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="dh-nav-right">
          {site.phoneHref && (
            <a href={site.phoneHref} className="dh-nav-phone dh-num">
              {site.phone}
            </a>
          )}
          <a href={site.cta.href} className="dh-btn dh-btn-ember dh-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

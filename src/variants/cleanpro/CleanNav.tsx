import { useEffect, useState } from 'react'
import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'
import Brand from './Brand'

const links = navLinks(site, 'Hours & Contact')

export default function CleanNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-40 bg-white transition-shadow duration-300"
      style={{ boxShadow: scrolled ? 'var(--cp-shadow-soft)' : 'none' }}
    >
      <div className="cp-container flex items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="text-lg font-extrabold tracking-tight">
          <Brand />
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="cp-navlink">
              {l.label}
            </a>
          ))}
        </div>
        <a href={site.cta.href} className="cp-btn cp-btn-primary !px-5 !py-2.5 text-sm">
          {site.cta.label}
        </a>
      </div>
    </nav>
  )
}

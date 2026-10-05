import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Contact')

export default function PpNav() {
  return (
    <header className="pp-nav">
      <div className="pp-nav-pill">
        <a href="#top" className="pp-display text-lg">
          {site.shortName}
        </a>
        <nav className="pp-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="pp-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <a href={site.cta.href} className="pp-btn pp-btn-ink pp-nav-cta">
          {site.cta.label}
        </a>
      </div>
    </header>
  )
}

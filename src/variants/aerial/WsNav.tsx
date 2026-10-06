import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')

export default function WsNav() {
  return (
    <header className="ws-nav">
      <div className="ws-wrap ws-nav-inner">
        <a href="#top" className="ws-display text-xl">
          {site.shortName}
        </a>
        <nav className="ws-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="ws-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ws-nav-right">
          {site.phoneHref && (
            <a href={site.phoneHref} className="ws-nav-phone ws-num">
              {site.phone}
            </a>
          )}
          <a href={site.cta.href} className="ws-btn ws-btn-green ws-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

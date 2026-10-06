import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')

export default function PpNav() {
  return (
    <header className="pp-nav">
      <div className="pp-wrap pp-nav-inner">
        <a href="#top" className="pp-display pp-brand">
          {site.shortName}
        </a>
        <nav className="pp-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="pp-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="pp-nav-right">
          {site.phoneHref && (
            <a href={site.phoneHref} className="pp-nav-phone pp-num" aria-label={`Call ${site.phone}`}>
              <span className="pp-nav-number">{site.phone}</span>
              <span className="pp-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="pp-btn pp-btn-orange pp-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

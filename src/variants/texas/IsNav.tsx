import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')

export default function IsNav() {
  return (
    <header className="is-nav">
      <div className="is-wrap is-nav-inner">
        <a href="#top" className="is-display is-brand">
          {site.shortName}
        </a>
        <nav className="is-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="is-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="is-nav-right">
          {site.phoneHref && (
            <a href={site.phoneHref} className="is-nav-phone is-num" aria-label={`Call ${site.phone}`}>
              <span className="is-nav-number">{site.phone}</span>
              <span className="is-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="is-btn is-btn-amber is-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

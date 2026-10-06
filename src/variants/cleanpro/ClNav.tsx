import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')

export default function ClNav() {
  return (
    <header className="cl-nav">
      <div className="cl-wrap cl-nav-inner">
        <a href="#top" className="cl-display cl-brand">
          {site.shortName}
        </a>
        <nav className="cl-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="cl-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="cl-nav-right">
          {site.phoneHref && (
            <a href={site.phoneHref} className="cl-nav-phone cl-num" aria-label={`Call ${site.phone}`}>
              <span className="cl-nav-number">{site.phone}</span>
              <span className="cl-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="cl-btn cl-btn-gold cl-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

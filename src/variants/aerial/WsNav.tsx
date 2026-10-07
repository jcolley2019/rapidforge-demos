import { useSite } from '../../brief/site-context'
import { navLinks } from '../../brief/site-helpers'

export default function WsNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  return (
    <header className="ws-nav">
      <div className="ws-wrap ws-nav-inner">
        <a href="#top" className="ws-display ws-brand">
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
            <a href={site.phoneHref} className="ws-nav-phone ws-num" aria-label={`Call ${site.phone}`}>
              <span className="ws-nav-number">{site.phone}</span>
              <span className="ws-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="ws-btn ws-btn-red ws-nav-cta">
            {site.navCtaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}

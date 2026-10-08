import { useSite } from '../../brief/site-context'
import { navLinks, navPhoneHref } from '../../brief/site-helpers'
import BrandMark from '../../components/BrandMark'

export default function WsNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const phoneHref = navPhoneHref(site)
  return (
    <header className="ws-nav">
      <div className="ws-wrap ws-nav-inner">
        <a href="#top" className="ws-display ws-brand">
          <BrandMark plate />
        </a>
        <nav className="ws-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="ws-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ws-nav-right">
          {phoneHref && (
            <a href={phoneHref} className="ws-nav-phone ws-num" aria-label={`Call ${site.phone}`}>
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

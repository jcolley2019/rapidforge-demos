import { useSite } from '../../brief/site-context'
import { navLinks, navPhoneHref } from '../../brief/site-helpers'
import BrandMark from '../../components/BrandMark'

export default function PpNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const phoneHref = navPhoneHref(site)
  return (
    <header className="pp-nav">
      <div className="pp-wrap pp-nav-inner">
        <a href="#top" className="pp-display pp-brand">
          <BrandMark />
        </a>
        <nav className="pp-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="pp-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="pp-nav-right">
          {phoneHref && (
            <a href={phoneHref} className="pp-nav-phone pp-num" aria-label={`Call ${site.phone}`}>
              <span className="pp-nav-number">{site.phone}</span>
              <span className="pp-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="pp-btn pp-btn-navy pp-nav-cta">
            {site.navCtaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}

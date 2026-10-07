import { useSite } from '../../brief/site-context'
import { navLinks } from '../../brief/site-helpers'
import BrandMark from '../../components/BrandMark'

export default function DhNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  return (
    <header className="dh-nav">
      <div className="dh-wrap dh-nav-inner">
        <a href="#top" className="dh-display dh-brand">
          <BrandMark />
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
            <a href={site.phoneHref} className="dh-nav-phone dh-num" aria-label={`Call ${site.phone}`}>
              <span className="dh-nav-number">{site.phone}</span>
              <span className="dh-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="dh-btn dh-btn-ink dh-nav-cta">
            {site.navCtaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}

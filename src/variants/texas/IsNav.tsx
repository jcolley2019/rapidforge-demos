import { useSite } from '../../brief/site-context'
import { navLinks, navPhoneHref } from '../../brief/site-helpers'
import BrandMark from '../../components/BrandMark'

export default function IsNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const phoneHref = navPhoneHref(site)
  return (
    <header className="is-nav">
      <div className="is-wrap is-nav-inner">
        <a href="#top" className="is-display is-brand">
          <BrandMark plate />
        </a>
        <nav className="is-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="is-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="is-nav-right">
          {phoneHref && (
            <a href={phoneHref} className="is-nav-phone is-num" aria-label={`Call ${site.phone}`}>
              <span className="is-nav-number">{site.phone}</span>
              <span className="is-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="is-btn is-btn-lime is-nav-cta">
            {site.navCtaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}

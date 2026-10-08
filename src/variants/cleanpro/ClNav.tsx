import { useSite } from '../../brief/site-context'
import { navLinks, navPhoneHref } from '../../brief/site-helpers'
import BrandMark from '../../components/BrandMark'

export default function ClNav() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const phoneHref = navPhoneHref(site)
  return (
    <header className="cl-nav">
      <div className="cl-wrap cl-nav-inner">
        <a href="#top" className="cl-display cl-brand">
          <BrandMark plate />
        </a>
        <nav className="cl-nav-links" aria-label="Page sections">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="cl-navlink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="cl-nav-right">
          {phoneHref && (
            <a href={phoneHref} className="cl-nav-phone cl-num" aria-label={`Call ${site.phone}`}>
              <span className="cl-nav-number">{site.phone}</span>
              <span className="cl-nav-call">Call</span>
            </a>
          )}
          <a href={site.cta.href} className="cl-btn cl-btn-gold cl-nav-cta">
            {site.navCtaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}

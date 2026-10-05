import { siteContent as site } from '../../brief/current'
import { navLinks } from '../../brief/site-helpers'

const links = navLinks(site)

export default function IsNav() {
  return (
    <header className="is-nav">
      <div className="is-wrap is-nav-inner">
        <a href="#top" className="is-display text-xl">
          {site.shortName}
          <span className="is-mark">.</span>
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
            <a href={site.phoneHref} className="is-nav-phone is-num">
              {site.phone}
            </a>
          )}
          <a href={site.cta.href} className="is-btn is-btn-black is-nav-cta">
            {site.cta.label}
          </a>
        </div>
      </div>
    </header>
  )
}

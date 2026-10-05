import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site)

export default function AerialFooter() {
  return (
    <footer className="ae-footer" aria-label="Footer">
      <div className="ae-wrap">
        <div className="ae-footer-grid">
          <div>
            <p className="ae-footer-heading">{site.name}</p>
            <address>
              {site.address && (
                <>
                  {site.address}
                  <br />
                </>
              )}
              {site.phoneHref && (
                <a href={site.phoneHref} className="ae-link">
                  {site.phone}
                </a>
              )}
            </address>
          </div>
          <div>
            <p className="ae-footer-heading">Get in touch</p>
            <ul className="ae-footer-list">
              <li>
                <a href={site.cta.href} className="ae-link">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="ae-footer-heading">On this page</p>
            <ul className="ae-footer-list">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="ae-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="ae-footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {site.name}
          </span>
          <span>{localityLine(site)}</span>
        </div>
      </div>
    </footer>
  )
}

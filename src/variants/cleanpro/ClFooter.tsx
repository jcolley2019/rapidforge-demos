import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Contact')

export default function ClFooter() {
  return (
    <footer className="cl-footer">
      <div className="cl-wrap py-12">
        <div className="cl-footer-grid">
          <div>
            <p className="cl-display text-xl">{site.shortName}</p>
            <p className="mt-2 text-sm text-(--cl-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--cl-muted)">{site.address}</p>}
          </div>
          <div>
            <p className="cl-mono">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="cl-quiet cl-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="cl-quiet">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="cl-mono">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="cl-quiet">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="cl-mono mt-10 border-t border-(--cl-line) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

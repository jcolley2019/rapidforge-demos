import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site)

export default function DhFooter() {
  return (
    <footer className="dh-footer">
      <div className="dh-wrap">
        <div className="dh-footer-grid">
          <div>
            <p className="text-base font-medium">{site.shortName}</p>
            <p className="mt-2 text-sm text-(--dh-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--dh-muted)">{site.address}</p>}
          </div>
          <div>
            <p className="dh-mono">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="dh-quiet dh-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="dh-quiet">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="dh-mono">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="dh-quiet">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="dh-mono mt-12 border-t border-(--dh-line) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Contact')

export default function PpFooter() {
  return (
    <footer className="pp-footer">
      <div className="pp-wrap py-12">
        <div className="pp-footer-grid">
          <div>
            <p className="pp-display text-xl">{site.shortName}</p>
            <p className="mt-2 text-sm text-(--pp-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--pp-muted)">{site.address}</p>}
          </div>
          <div>
            <p className="pp-mono">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="pp-quiet pp-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="pp-quiet">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="pp-mono">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="pp-quiet">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <hr className="pp-dash mt-10" />
        <p className="pp-mono mt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
          {site.city ? ` · ${site.city}` : ''}
        </p>
      </div>
    </footer>
  )
}

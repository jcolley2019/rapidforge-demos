import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Contact')

export default function WsFooter() {
  return (
    <footer className="ws-footer">
      <div className="ws-wrap py-12">
        <div className="ws-footer-grid">
          <div>
            <p className="ws-display text-xl">{site.shortName}</p>
            <p className="mt-2 text-sm text-(--ws-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--ws-muted)">{site.address}</p>}
          </div>
          <div>
            <p className="ws-mono">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="ws-quiet ws-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="ws-quiet">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="ws-mono">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="ws-quiet">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="ws-mono mt-10 border-t border-(--ws-line) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

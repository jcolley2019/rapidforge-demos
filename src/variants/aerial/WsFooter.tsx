import { siteContent as site } from '../../brief/current'
import { hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')
const hours = hoursSummary(site.hours)

export default function WsFooter() {
  return (
    <footer className="ws-footer">
      <div className="ws-wrap py-12">
        <div className="ws-footer-grid">
          <div>
            <p className="ws-display text-xl">{site.name}</p>
            <p className="mt-2 text-sm text-(--ws-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--ws-muted)">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="ws-quiet ws-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="ws-mono">Hours</p>
            <p className="mt-3 text-sm text-(--ws-muted)">{hours ?? 'Call for current hours'}</p>
            <p className="ws-mono mt-6">Licensed &amp; insured</p>
            <a href={site.cta.href} className="ws-quiet mt-3 block text-sm">
              {site.cta.label}
            </a>
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

import { siteContent as site } from '../../brief/current'
import { hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')
const hours = hoursSummary(site.hours)

export default function DhFooter() {
  return (
    <footer className="dh-footer">
      <div className="dh-wrap">
        <div className="dh-footer-grid">
          <div>
            <p className="text-base font-medium">{site.name}</p>
            <p className="mt-2 text-sm text-(--dh-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--dh-muted)">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="dh-quiet dh-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="dh-mono">Hours</p>
            <p className="mt-3 text-sm text-(--dh-muted)">{hours ?? 'Call for current hours'}</p>
            <p className="dh-mono mt-6">Licensed &amp; insured</p>
            <a href={site.cta.href} className="dh-quiet mt-3 block text-sm">
              {site.cta.label}
            </a>
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

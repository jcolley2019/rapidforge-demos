import { siteContent as site } from '../../brief/current'
import { hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')
const hours = hoursSummary(site.hours)

export default function PpFooter() {
  return (
    <footer className="pp-footer">
      <div className="pp-wrap py-12">
        <div className="pp-footer-grid">
          <div>
            <p className="pp-display text-xl">{site.name}</p>
            <p className="mt-2 text-sm text-(--pp-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--pp-muted)">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="pp-quiet pp-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="mt-3 text-sm text-(--pp-muted)">{hours ?? 'Call for current hours'}</p>
            <p className="pp-mono mt-6">Licensed &amp; insured</p>
            <a href={site.cta.href} className="pp-quiet mt-3 block text-sm">
              {site.cta.label}
            </a>
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
        <p className="pp-mono mt-10 border-t border-(--pp-border) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
          {site.city ? ` · ${site.city}` : ''}
        </p>
      </div>
    </footer>
  )
}

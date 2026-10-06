import { siteContent as site } from '../../brief/current'
import { hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Location')
const hours = hoursSummary(site.hours)

export default function IsFooter() {
  return (
    <footer className="is-footer">
      <div className="is-wrap py-12">
        <div className="is-footer-grid">
          <div>
            <p className="is-display text-xl">
              {site.name}
            </p>
            <p className="mt-2 text-sm text-(--is-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--is-muted)">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="is-quiet is-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="mt-3 text-sm text-(--is-muted)">{hours ?? 'Call for current hours'}</p>
            <p className="is-mono mt-6">Licensed &amp; insured</p>
            <a href={site.cta.href} className="is-quiet mt-3 block text-sm">
              {site.cta.label}
            </a>
          </div>
          <div>
            <p className="is-mono">On this page</p>
            <ul className="mt-3 space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="is-quiet">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="is-mono mt-10 border-t border-(--is-border) pt-5">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

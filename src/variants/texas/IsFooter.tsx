import { useSite } from '../../brief/site-context'
import { credentialLines, hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

export default function IsFooter() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const hours = hoursSummary(site.hours)
  return (
    <footer className="is-footer">
      <div className="is-wrap py-12">
        <div className="is-footer-grid">
          <div>
            <p className="is-display text-2xl">{site.name}</p>
            <p className="mt-2 text-sm">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="is-quiet is-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="is-mono">Hours</p>
            <p className="mt-3 text-sm">{hours ?? 'Call for current hours'}</p>
            {site.hoursNote && <p className="mt-1 text-sm font-bold text-(--is-lime)">{site.hoursNote}</p>}
            <ul className="mt-6 space-y-1">
              {credentialLines(site).map((line) => (
                <li key={line} className="is-mono">
                  {line}
                </li>
              ))}
            </ul>
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
        <p className="is-mono mt-10 border-t border-(--is-on-navy-line) pt-5">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

import { useSite } from '../../brief/site-context'
import { credentialLines, hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

export default function DhFooter() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const hours = hoursSummary(site.hours)
  return (
    <footer className="dh-footer">
      <div className="dh-wrap">
        <div className="dh-footer-grid">
          <div>
            <p className="dh-display text-lg">{site.name}</p>
            <p className="mt-2 text-sm text-(--dh-on-ink-muted)">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm text-(--dh-on-ink-muted)">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="dh-quiet dh-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="dh-mono">Hours</p>
            <p className="mt-3 text-sm text-(--dh-on-ink-muted)">{hours ?? 'Call for current hours'}</p>
            {site.hoursNote && <p className="mt-1 text-sm font-bold">{site.hoursNote}</p>}
            <ul className="mt-6 space-y-1">
              {credentialLines(site).map((line) => (
                <li key={line} className="dh-mono">
                  {line}
                </li>
              ))}
            </ul>
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
        <p className="dh-mono mt-12 border-t border-(--dh-on-ink-line) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

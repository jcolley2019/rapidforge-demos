import { useSite } from '../../brief/site-context'
import { credentialLines, hoursSummary, localityLine, navLinks } from '../../brief/site-helpers'

export default function WsFooter() {
  const site = useSite()
  const links = navLinks(site, 'Hours & Location')
  const hours = hoursSummary(site.hours)
  return (
    <footer className="ws-footer">
      <div className="ws-wrap py-12">
        <div className="ws-footer-grid">
          <div>
            <p className="ws-display text-xl">{site.name}</p>
            <p className="mt-2 text-sm">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm">{site.address}</p>}
            {site.phoneHref && (
              <a href={site.phoneHref} className="ws-quiet ws-num mt-1 block text-sm">
                {site.phone}
              </a>
            )}
          </div>
          <div>
            <p className="ws-mono">Hours</p>
            <p className="mt-3 text-sm">{hours ?? 'Call for current hours'}</p>
            {site.hoursNote && <p className="mt-1 text-sm font-extrabold">{site.hoursNote}</p>}
            <ul className="mt-6 space-y-1">
              {credentialLines(site).map((line) => (
                <li key={line} className="ws-mono">
                  {line}
                </li>
              ))}
            </ul>
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
        <p className="ws-mono mt-10 border-t border-(--ws-on-black-line) pt-5 text-center">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

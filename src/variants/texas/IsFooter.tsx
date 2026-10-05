import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site)

export default function IsFooter() {
  return (
    <footer className="is-footer">
      <div className="is-wrap py-12">
        <div className="is-footer-grid">
          <div>
            <p className="is-display text-xl">
              {site.shortName}
              <span className="is-mark">.</span>
            </p>
            <p className="mt-2 text-sm opacity-70">{localityLine(site)}</p>
            {site.address && <p className="mt-3 text-sm opacity-70">{site.address}</p>}
          </div>
          <div>
            <p className="is-mono">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="is-quiet is-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="is-quiet">
                  {site.cta.label}
                </a>
              </li>
            </ul>
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
        <p className="is-mono mt-10 border-t border-white/20 pt-5">
          &copy; {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  )
}

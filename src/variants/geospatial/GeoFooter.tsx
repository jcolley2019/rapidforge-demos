import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'
import { LOCALITY_TAG } from './localityTag'

const links = navLinks(site)

export default function GeoFooter() {
  return (
    <footer className="border-t border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {site.shortName}
              <span className="text-(--geo-accent)">.</span>
            </p>
            <p className="mt-2 text-sm text-(--geo-text-dim)">{localityLine(site)}</p>
            {site.address && <p className="mt-4 text-sm text-(--geo-text-dim)">{site.address}</p>}
          </div>
          <div>
            <p className="g-eyebrow">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="g-quiet-link g-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="g-quiet-link">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="g-eyebrow">Index</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="g-quiet-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-(--geo-line) pt-6 sm:flex-row">
          <p className="g-num text-xs text-(--geo-text-faint)">
            &copy; {new Date().getFullYear()} {site.name}
          </p>
          <p className="g-meta">{LOCALITY_TAG}</p>
        </div>
      </div>
    </footer>
  )
}

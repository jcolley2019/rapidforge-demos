import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'

const links = navLinks(site, 'Hours & Contact')

export default function HeritageFooter() {
  return (
    <footer className="border-t border-(--brass)/40 bg-(--parchment-deep)">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="h-display text-xl font-semibold">{site.shortName}</p>
            <p className="mt-2 text-sm text-(--ink-soft)">{localityLine(site)}</p>
            {site.address && <p className="mt-4 text-sm text-(--ink-soft)">{site.address}</p>}
          </div>
          <div>
            <p className="h-eyebrow">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {site.phoneHref && (
                <li>
                  <a href={site.phoneHref} className="h-quiet-link h-num">
                    {site.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={site.cta.href} className="h-quiet-link">
                  {site.cta.label}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="h-eyebrow">On this page</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="h-quiet-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <hr className="h-rule mt-12" />
        <p className="h-num mt-6 text-center text-xs tracking-wide text-(--ink-faint)">
          &copy; {new Date().getFullYear()} {site.name}
          {site.city ? ` · ${site.city}` : ''}
        </p>
      </div>
    </footer>
  )
}

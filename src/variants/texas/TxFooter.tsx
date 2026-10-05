import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'
import TxBrand from './TxBrand'

const links = navLinks(site)

export default function TxFooter() {
  return (
    <footer
      style={{ background: 'var(--tx-black)', color: 'var(--tx-steel-on-dark)', borderTop: '4px solid var(--tx-orange)' }}
    >
      <div className="tx-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="tx-display" style={{ fontSize: 'var(--tx-t1)', color: 'var(--tx-paper)' }}>
            <TxBrand />
          </p>
          <p className="mt-3 text-sm">{localityLine(site)}</p>
          {site.address && <p className="mt-1 text-sm">{site.address}</p>}
        </div>
        <div>
          <p className="tx-label" style={{ color: 'var(--tx-paper)' }}>
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {site.phoneHref && (
              <li>
                <a href={site.phoneHref} className="tx-num tx-hot-link">
                  {site.phone}
                </a>
              </li>
            )}
            <li>
              <a href={site.cta.href} className="tx-hot-link">
                {site.cta.label}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="tx-label" style={{ color: 'var(--tx-paper)' }}>
            On this page
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="tx-hot-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className="tx-container flex flex-wrap items-center justify-between gap-2 py-5 text-xs"
        style={{ borderTop: '1px solid rgba(163, 163, 156, 0.3)' }}
      >
        <span className="tx-num">
          &copy; {new Date().getFullYear()} {site.name}
        </span>
        {site.city && <span>{site.city}</span>}
      </div>
    </footer>
  )
}

import { siteContent as site } from '../../brief/current'
import { localityLine, navLinks } from '../../brief/site-helpers'
import Brand from './Brand'

const links = navLinks(site, 'Hours & Contact')

export default function CleanFooter() {
  return (
    <footer className="px-6 pb-10 pt-16" style={{ background: 'var(--cp-gray)', borderTop: '1px solid var(--cp-border)' }}>
      <div className="cp-container grid gap-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight">
            <Brand />
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--cp-navy-soft)' }}>
            {localityLine(site)}
          </p>
          {site.address && (
            <p className="mt-2 text-sm" style={{ color: 'var(--cp-navy-soft)' }}>
              {site.address}
            </p>
          )}
          {site.phoneHref && (
            <p className="mt-2 text-sm">
              <a href={site.phoneHref} className="cp-inline-link cp-num">
                {site.phone}
              </a>
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
            Services
          </p>
          <ul className="mt-4 space-y-2">
            {site.services.map((service) => (
              <li key={service.title}>
                <a href="#services" className="cp-quiet-link text-sm">
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
            On this page
          </p>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="cp-quiet-link text-sm">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href={site.cta.href} className="cp-quiet-link text-sm">
                {site.cta.label}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="cp-container cp-num mt-12 border-t pt-6 text-center text-xs"
        style={{ borderColor: 'var(--cp-border)', color: 'var(--cp-navy-soft)' }}
      >
        &copy; {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  )
}

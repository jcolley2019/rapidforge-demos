import { content } from '../../content/content'

const serviceLinks = content.services.map((s) => s.title)

export default function CleanFooter() {
  return (
    <footer className="px-6 pb-10 pt-16" style={{ background: 'var(--cp-gray)', borderTop: '1px solid var(--cp-border)' }}>
      <div className="cp-container grid gap-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--cp-navy)' }}>
            Brittain <span style={{ color: 'var(--cp-blue)' }}>&amp;</span> Crawford
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--cp-navy-soft)' }}>
            {content.contact.address}
          </p>
          <p className="mt-2 text-sm">
            <a href={content.contact.phoneHref} className="cp-inline-link cp-num">
              {content.contact.phone}
            </a>
          </p>
          <p className="mt-1 text-sm">
            <a href={`mailto:${content.contact.quoteEmail}`} className="cp-inline-link">
              {content.contact.quoteEmail}
            </a>
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
            Services
          </p>
          <ul className="mt-4 space-y-2">
            {serviceLinks.map((title) => (
              <li key={title}>
                <a href="#services" className="cp-quiet-link text-sm">
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--cp-navy)' }}>
            Connect
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <a
                href={content.contact.clientPortal}
                target="_blank"
                rel="noreferrer"
                className="cp-quiet-link text-sm"
              >
                Client Portal (ShareFile)
              </a>
            </li>
            <li>
              <a
                href={content.contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="cp-quiet-link text-sm"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={content.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="cp-quiet-link text-sm"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="cp-container cp-num mt-12 border-t pt-6 text-center text-xs"
        style={{ borderColor: 'var(--cp-border)', color: 'var(--cp-navy-soft)' }}
      >
        &copy; {new Date().getFullYear()} {content.name}. Serving {content.serviceArea}.
      </div>
    </footer>
  )
}

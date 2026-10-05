import { content } from '../../content/content'

export default function TxFooter() {
  return (
    <footer
      style={{ background: 'var(--tx-black)', color: 'var(--tx-steel-on-dark)', borderTop: '4px solid var(--tx-orange)' }}
    >
      <div className="tx-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="tx-display" style={{ fontSize: 'var(--tx-t1)', color: 'var(--tx-paper)' }}>
            Brittain <span style={{ color: 'var(--tx-orange)' }}>&amp;</span> Crawford
          </p>
          <p className="mt-3 text-sm">{content.contact.address}</p>
        </div>
        <div>
          <p className="tx-label" style={{ color: 'var(--tx-paper)' }}>
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={content.contact.phoneHref} className="tx-num tx-hot-link">
                {content.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${content.contact.quoteEmail}`} className="tx-hot-link">
                {content.contact.quoteEmail}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="tx-label" style={{ color: 'var(--tx-paper)' }}>
            Portal
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={content.contact.clientPortal}
                target="_blank"
                rel="noreferrer"
                className="tx-hot-link"
              >
                Client Portal (ShareFile)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="tx-label" style={{ color: 'var(--tx-paper)' }}>
            Follow
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={content.contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="tx-hot-link"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={content.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="tx-hot-link"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="tx-container flex flex-wrap items-center justify-between gap-2 py-5 text-xs"
        style={{ borderTop: '1px solid rgba(163, 163, 156, 0.3)' }}
      >
        <span className="tx-num">
          &copy; {new Date().getFullYear()} {content.name}
        </span>
        <span>Serving {content.serviceArea}</span>
      </div>
    </footer>
  )
}

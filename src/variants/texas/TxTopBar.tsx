import { content } from '../../content/content'

export default function TxTopBar() {
  return (
    <div style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container flex items-center justify-between gap-4 py-2">
        <a
          href={content.contact.phoneHref}
          className="tx-num tx-monument tx-hot-link py-1 text-sm font-semibold tracking-wide"
        >
          {content.contact.phone}
        </a>
        <div className="tx-label flex items-center gap-6" style={{ color: 'var(--tx-steel-on-dark)' }}>
          <span className="hidden sm:inline">Fort Worth, TX</span>
          <span className="tx-num">Est. {content.founded.year}</span>
        </div>
      </div>
    </div>
  )
}

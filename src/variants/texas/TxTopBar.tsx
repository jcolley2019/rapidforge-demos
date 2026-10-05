import { siteContent as site } from '../../brief/current'

export default function TxTopBar() {
  return (
    <div style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container flex items-center justify-between gap-4 py-2">
        {site.phoneHref ? (
          <a
            href={site.phoneHref}
            className="tx-num tx-monument tx-hot-link py-1 text-sm font-semibold tracking-wide"
          >
            {site.phone}
          </a>
        ) : (
          <span className="tx-label tx-monument py-1" style={{ color: 'var(--tx-steel-on-dark)' }}>
            {site.verticalLabel}
          </span>
        )}
        <div className="tx-label flex items-center gap-6" style={{ color: 'var(--tx-steel-on-dark)' }}>
          {site.city && <span className="hidden sm:inline">{site.city}</span>}
          <span>{site.verticalLabel}</span>
        </div>
      </div>
    </div>
  )
}

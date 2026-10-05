import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function TxQuoteCta() {
  return (
    <section id="quote" style={{ background: 'var(--tx-paper)', color: 'var(--tx-black)', borderTop: '4px solid var(--tx-orange)' }}>
      <div className="tx-container tx-section">
        <Reveal>
          <h2 className="tx-display" style={{ fontSize: 'var(--tx-t6)', fontWeight: 700 }}>
            Let&rsquo;s get it{' '}
            <span className="block" style={{ color: 'var(--tx-orange)' }}>
              done.
            </span>
          </h2>
        </Reveal>
        <Reveal>
          <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md" style={{ color: 'var(--tx-steel-on-light)' }}>
              {site.subhead}
            </p>
            <div className="flex flex-col items-start gap-5">
              <a href={site.cta.href} className="tx-btn tx-btn-orange">
                {site.cta.label}
              </a>
              {site.phoneHref && (
                <a
                  href={site.phoneHref}
                  className="tx-display tx-num tx-hot-link"
                  style={{ fontSize: 'var(--tx-t4)' }}
                >
                  {site.phone}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

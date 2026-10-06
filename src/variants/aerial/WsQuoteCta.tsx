import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function WsQuoteCta() {
  return (
    <section id="quote" className="ws-green">
      <div className="ws-wrap ws-section">
        <Reveal>
          <p className="ws-eyebrow">{site.cta.label}</p>
          <h2 className="ws-display ws-h2 mx-auto max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="ws-display ws-green-phone ws-num">
              {site.phone}
            </a>
          )}
          <p className="ws-green-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="ws-btn ws-btn-warm">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="ws-btn ws-btn-pale ws-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <span className="ws-display ws-masked" aria-hidden="true">
            {site.shortName}
          </span>
        </Reveal>
      </div>
    </section>
  )
}

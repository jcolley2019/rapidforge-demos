import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function WsQuoteCta() {
  return (
    <section id="quote" className="ws-band">
      <div className="ws-wrap ws-section">
        <Reveal>
          <h2 className="ws-display ws-h2 max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="ws-display ws-band-phone ws-num">
              {site.phone}
            </a>
          )}
          <p className="ws-band-sub mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={site.cta.href} className="ws-btn ws-btn-blue">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="ws-btn ws-btn-outline ws-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

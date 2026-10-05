import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function WsQuoteCta() {
  return (
    <section id="quote" className="ws-green">
      <div className="ws-wrap ws-section">
        <Reveal>
          <p className="ws-eyebrow">{site.cta.label}</p>
          <h2 className="ws-display ws-h2 mx-auto max-w-[16ch]">Ready when you are.</h2>
          <p className="ws-green-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href={site.cta.href} className="ws-btn ws-btn-warm">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="ws-green-phone ws-num">
                {site.phone}
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

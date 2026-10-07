import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function WsQuoteCta() {
  const site = useSite()
  const { primary, secondary } = heroActions(site)
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
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={primary.href} className={`ws-btn ws-btn-white ${primary.call ? 'ws-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`ws-btn ws-btn-ghost ${secondary.call ? 'ws-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

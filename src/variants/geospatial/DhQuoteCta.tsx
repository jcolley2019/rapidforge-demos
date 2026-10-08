import { useSite } from '../../brief/site-context'
import { quoteActions } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function DhQuoteCta() {
  const site = useSite()
  const { primary, secondary } = quoteActions(site)
  return (
    <section id="quote" className="dh-quote-band">
      <div className="dh-wrap dh-section">
        <Reveal>
          <h2 className="dh-display dh-h2 max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="dh-quote-phone dh-num">
              {site.phone}
            </a>
          )}
          <p className="mt-5 max-w-xl">{site.subhead}</p>
          {primary && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={primary.href} className={`dh-btn dh-btn-white ${primary.call ? 'dh-num' : ''}`.trim()}>
                {primary.label}
              </a>
              {secondary && (
                <a href={secondary.href} className={`dh-btn dh-btn-ghost ${secondary.call ? 'dh-num' : ''}`.trim()}>
                  {secondary.label}
                </a>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}

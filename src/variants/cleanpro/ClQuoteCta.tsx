import { useSite } from '../../brief/site-context'
import { quoteActions } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function ClQuoteCta() {
  const site = useSite()
  const { primary, secondary } = quoteActions(site)
  return (
    <section id="quote" className="cl-plate">
      <div className="cl-wrap cl-section">
        <Reveal>
          {/* Cormorant's zero is narrow, so its ch runs short: measure wider. */}
          <h2 className="cl-display cl-h2 mx-auto max-w-[24ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="cl-display cl-plate-phone cl-num">
              {site.phone}
            </a>
          )}
          <p className="cl-plate-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          {primary && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href={primary.href} className={`cl-btn cl-btn-gold ${primary.call ? 'cl-num' : ''}`.trim()}>
                {primary.label}
              </a>
              {secondary && (
                <a href={secondary.href} className={`cl-btn cl-btn-outline ${secondary.call ? 'cl-num' : ''}`.trim()}>
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

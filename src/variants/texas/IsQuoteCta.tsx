import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'

export default function IsQuoteCta() {
  const site = useSite()
  const { primary, secondary } = heroActions(site)
  return (
    <section id="quote" className="is-band">
      <div className="is-wrap is-section">
        <Reveal>
          <h2 className="is-display is-h2 mx-auto max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="is-display is-band-phone is-num">
              {site.phone}
            </a>
          )}
          <p className="is-band-sub mx-auto mt-4 max-w-xl">{site.subhead}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href={primary.href} className={`is-btn is-btn-lime ${primary.call ? 'is-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`is-btn is-btn-outline ${secondary.call ? 'is-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

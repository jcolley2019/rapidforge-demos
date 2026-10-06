import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function IsQuoteCta() {
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
          <p className="is-band-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="is-btn is-btn-amber">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="is-btn is-btn-white is-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function IsQuoteCta() {
  return (
    <section id="quote" className="is-section">
      <div className="is-wrap">
        <Reveal>
          <p className="is-mono">{site.cta.label}</p>
          <h2 className="is-display is-cta-h2 mt-3">{site.ctaHeadline}</h2>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              {site.phoneHref && (
                <a href={site.phoneHref} className="is-display is-cta-phone is-num">
                  {site.phone}
                </a>
              )}
              <p className="mt-5 max-w-md text-(--is-muted)">{site.subhead}</p>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <a href={site.cta.href} className="is-btn is-btn-black">
                {site.cta.label}
              </a>
              {site.ctaSecondary && (
                <a href={site.ctaSecondary.href} className="is-btn is-btn-outline is-num">
                  {site.ctaSecondary.label}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

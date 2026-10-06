import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'
import ClOrbits from './ClOrbits'

export default function ClQuoteCta() {
  return (
    <section id="quote" className="cl-plate">
      <ClOrbits stroke="#a9bdf0" />
      <div className="cl-wrap cl-section">
        <Reveal>
          <p className="cl-eyebrow">{site.cta.label}</p>
          <h2 className="cl-display cl-h2 mx-auto max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="cl-display cl-plate-phone cl-num">
              {site.phone}
            </a>
          )}
          <p className="cl-plate-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="cl-btn cl-btn-white">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="cl-btn cl-btn-plate cl-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

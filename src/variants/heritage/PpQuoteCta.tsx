import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function PpQuoteCta() {
  return (
    <section id="quote" className="pp-plate">
      <span className="pp-reg pp-reg-tl" aria-hidden="true" />
      <span className="pp-reg pp-reg-tr" aria-hidden="true" />
      <span className="pp-reg pp-reg-bl" aria-hidden="true" />
      <span className="pp-reg pp-reg-br" aria-hidden="true" />
      <div className="pp-wrap pp-section text-center">
        <Reveal>
          <p className="pp-mono">{site.cta.label}</p>
          <h2 className="pp-display pp-h2 mx-auto mt-3 max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="pp-display pp-plate-phone pp-num">
              {site.phone}
            </a>
          )}
          <p className="pp-plate-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="pp-btn pp-btn-paper">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="pp-btn pp-btn-plate pp-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

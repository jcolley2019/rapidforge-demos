import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function DhQuoteCta() {
  return (
    <section id="quote" className="dh-quote-band">
      <div className="dh-wrap dh-section">
        <Reveal>
          <p className="dh-label">{site.cta.label}</p>
          <h2 className="dh-display dh-h2 mx-auto max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="dh-quote-phone dh-num">
              {site.phone}
            </a>
          )}
          <p className="mx-auto mt-6 max-w-xl text-(--dh-muted)">{site.subhead}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="dh-btn dh-btn-ember">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="dh-btn dh-btn-ghost dh-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

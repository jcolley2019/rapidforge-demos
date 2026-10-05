import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function AerialQuoteCta() {
  return (
    <section className="ae-quote" id="quote" aria-label={site.cta.label}>
      <div className="ae-quote-inner ae-wrap">
        <Reveal>
          <p className="ae-eyebrow">{site.cta.label}</p>
          <h2 className="ae-quote-headline">{site.headline}</h2>
        </Reveal>
        <Reveal stagger={1}>
          <div className="ae-quote-actions">
            <a href={site.cta.href} className="ae-cta">
              {site.cta.label}
              <span className="ae-cta-mark" aria-hidden="true">
                &rarr;
              </span>
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="ae-quote-phone ae-link">
                {site.phone}
              </a>
            )}
          </div>
          <p className="ae-quote-note">{site.subhead}</p>
        </Reveal>
      </div>
    </section>
  )
}

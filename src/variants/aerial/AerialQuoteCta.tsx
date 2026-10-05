import { content } from '../../content/content'
import Reveal from './Reveal'

export default function AerialQuoteCta() {
  return (
    <section className="ae-quote" id="quote" aria-label="Request a survey">
      <div className="ae-quote-inner ae-wrap">
        <Reveal>
          <p className="ae-eyebrow">Request a survey</p>
          <h2 className="ae-quote-headline">
            See your land from a new perspective.
          </h2>
        </Reveal>
        <Reveal stagger={1}>
          <div className="ae-quote-actions">
            <a
              href={`mailto:${content.contact.quoteEmail}`}
              className="ae-cta"
            >
              {content.contact.quoteEmail}
              <span className="ae-cta-mark" aria-hidden="true">
                &rarr;
              </span>
            </a>
            <a href={content.contact.phoneHref} className="ae-quote-phone ae-link">
              {content.contact.phone}
            </a>
          </div>
          <p className="ae-quote-note">
            {content.taglines.secondary} Serving {content.serviceArea}.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

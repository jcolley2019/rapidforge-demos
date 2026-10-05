import { content } from '../../content/content'
import Reveal from './Reveal'
import Ticks from './Ticks'

export default function GeoQuoteCta() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <div className="relative border border-(--geo-line-strong) bg-(--geo-panel) px-6 py-14 text-center shadow-[0_18px_60px_-24px_rgba(61,220,151,0.4)] sm:px-12 lg:py-16">
          <Ticks />
          <p className="g-eyebrow g-num">04 / Request survey</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Get millimeter-grade data on your site
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-(--geo-text-dim)">
            Send the site address, survey type, and timeline to{' '}
            <a href={`mailto:${content.contact.quoteEmail}`} className="g-inline-link">
              {content.contact.quoteEmail}
            </a>
            . A licensed surveyor scopes every request — not a call center.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href={`mailto:${content.contact.quoteEmail}`} className="g-btn g-btn-accent">
              Request Survey
            </a>
            <a href={content.contact.phoneHref} className="g-btn g-btn-outline">
              TEL {content.contact.phone}
            </a>
          </div>
          <p className="g-meta mt-8">
            RESPONSE_WINDOW: BUSINESS_HOURS // {content.contact.address.toUpperCase()}
          </p>
        </div>
      </Reveal>
    </section>
  )
}

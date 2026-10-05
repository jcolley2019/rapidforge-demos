import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'
import Ticks from './Ticks'
import { LOCALITY_TAG } from './localityTag'

export default function GeoQuoteCta({ index }: { index: string }) {
  return (
    <section id="quote" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <div className="relative border border-(--geo-line-strong) bg-(--geo-panel) px-6 py-14 text-center shadow-[0_18px_60px_-24px_rgba(61,220,151,0.4)] sm:px-12 lg:py-16">
          <Ticks />
          <p className="g-eyebrow g-num">
            {index} / {site.cta.label}
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {site.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-(--geo-text-dim)">{site.subhead}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="g-btn g-btn-accent">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="g-btn g-btn-outline">
                TEL {site.phone}
              </a>
            )}
          </div>
          <p className="g-meta mt-8">{LOCALITY_TAG}</p>
        </div>
      </Reveal>
    </section>
  )
}

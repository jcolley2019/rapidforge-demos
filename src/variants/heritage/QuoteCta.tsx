import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function QuoteCta() {
  return (
    <section id="quote" className="h-on-ink bg-(--ink) text-(--parchment)">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:py-28">
        <Reveal>
          <p className="h-eyebrow text-(--brass-soft)">{site.cta.label}</p>
          <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-(--parchment)/75">{site.subhead}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={site.cta.href} className="h-btn h-btn-brass">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="h-btn h-btn-outline-light h-num">
                {site.phone}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

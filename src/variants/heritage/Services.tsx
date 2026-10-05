import { content } from '../../content/content'
import Reveal from './Reveal'

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="h-eyebrow">Services</p>
          <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
            Nine disciplines. One standard of care.
          </h2>
          <hr className="h-rule h-rule-short h-rule-draw mt-7" />
          <p className="mt-7 text-(--ink-soft)">
            Every deliverable leaves this office reviewed, sealed, and ready for
            the lender, the city, or the court that will rely on it.
          </p>
        </div>
      </Reveal>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {content.services.map((service, i) => (
          <Reveal key={service.title} delay={(i % 3) * 90} stagger={i % 3}>
            <article className="h-card">
              <div className="h-plate">
                <span className="h-plate-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="h-display text-xl leading-snug font-semibold">
                  {service.title}
                </h3>
                <p className="mt-3 text-[0.95rem] text-(--ink-soft)">
                  {service.description}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

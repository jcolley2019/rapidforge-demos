import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

export default function GeoServices({ index }: { index: string }) {
  return (
    <section id="services" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <SectionTag index={index} label="Services" />
        <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          What we do
        </h2>
      </Reveal>
      <div className="g-matrix mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {site.services.map((service, i) => (
          <Reveal key={service.title} stagger={i % 3} delay={(i % 3) * 80}>
            <article className="g-matrix-cell group">
              <Ticks className="opacity-40 transition-opacity duration-500 group-hover:opacity-100" />
              <p className="g-meta g-num">SVC_{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-lg leading-snug font-semibold">{service.title}</h3>
              {service.blurb && (
                <p className="mt-2.5 text-sm text-(--geo-text-dim)">{service.blurb}</p>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

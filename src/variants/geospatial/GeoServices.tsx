import { content } from '../../content/content'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

export default function GeoServices() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <SectionTag index="01" label="Services" />
        <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Nine survey products. Zero guesswork.
        </h2>
        <p className="mt-4 max-w-2xl text-(--geo-text-dim)">
          Every deliverable is measured on the Texas State Plane coordinate
          system and sealed by a Registered Professional Land Surveyor.
        </p>
      </Reveal>
      <div className="g-matrix mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {content.services.map((service, i) => (
          <Reveal key={service.title} stagger={i % 3} delay={(i % 3) * 80}>
            <article className="g-matrix-cell group">
              <Ticks className="opacity-40 transition-opacity duration-500 group-hover:opacity-100" />
              <p className="g-meta g-num">SVC_{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 text-lg leading-snug font-semibold">{service.title}</h3>
              <p className="mt-2.5 text-sm text-(--geo-text-dim)">{service.description}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

import { content } from '../../content/content'
import Reveal from './Reveal'

export default function CapabilitiesStrip() {
  return (
    <section className="border-y border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-14">
        {/* dt precedes dd in the DOM for correct <dl> semantics; each cell
            reverses so the reading still comes first. */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden border border-(--geo-line) bg-(--geo-line) sm:grid-cols-3 lg:grid-cols-6">
          {content.stats.map((stat, i) => (
            <div key={stat.label} className="bg-(--geo-panel) p-5">
              <Reveal delay={i * 60} stagger={i} className="flex flex-col-reverse">
                <dt className="mt-2 text-[0.72rem] leading-snug tracking-wide text-(--geo-text-dim)">
                  {stat.label}
                </dt>
                <dd className="g-mono g-glow text-3xl font-semibold text-(--geo-accent)">
                  {stat.value}
                </dd>
              </Reveal>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

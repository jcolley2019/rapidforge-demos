import PlaceholderImage from '../../components/PlaceholderImage'
import { content } from '../../content/content'
import Reveal from './Reveal'

const techServices = content.services.filter((s) =>
  /Drone|Laser|Terrain/.test(s.title),
)
const gnssStat = content.stats.find((s) => s.label.includes('GNSS'))!

export default function Technology() {
  return (
    <section id="technology" className="bg-(--parchment-deep)">
      <div className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="h-eyebrow">Technology</p>
              <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
                Old-school rigor. Modern instruments.
              </h2>
              <hr className="h-rule h-rule-short h-rule-draw mt-7" />
              <p className="mt-7 text-(--ink-soft)">
                The firm runs {gnssStat.value}{' '}
                {gnssStat.label.charAt(0).toLowerCase() + gnssStat.label.slice(1)}{' '}
                — the same discipline that closed
                traverses by hand in {content.founded.year}, now measured in
                millimeters.
              </p>
            </Reveal>
            <div className="mt-10 space-y-8">
              {techServices.map((service, i) => (
                <Reveal key={service.title} delay={i * 100} stagger={i}>
                  <div className="flex gap-5">
                    <span
                      className="h-display h-num mt-0.5 text-2xl leading-none font-semibold text-(--brass)/70"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="h-display text-lg font-semibold">{service.title}</h3>
                      <p className="mt-1.5 max-w-xl text-[0.95rem] text-(--ink-soft)">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={150} className="lg:sticky lg:top-28">
            <div className="border border-(--brass)/50 bg-(--parchment) p-2 shadow-[0_30px_70px_-35px_rgba(43,33,25,0.4)]">
              <div className="overflow-hidden border border-(--brass)/30">
                <PlaceholderImage
                  aspectRatio="4 / 5"
                  gradientFrom="#efe6d3"
                  gradientTo="#d9c69c"
                  lineColor="#8a6b34"
                  lineOpacity={0.55}
                  seed={7}
                  label="Terrain model — placeholder"
                  labelColor="#5d4d3b"
                />
              </div>
            </div>
            <div className="mt-4 border border-(--brass)/40 bg-(--parchment) px-5 py-4">
              <p className="h-eyebrow">On the network</p>
              <p className="mt-1.5 text-sm text-(--ink-soft)">
                {gnssStat.value} {gnssStat.label}.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

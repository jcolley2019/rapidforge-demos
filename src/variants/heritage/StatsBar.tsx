import { content } from '../../content/content'
import Reveal from './Reveal'

export default function StatsBar() {
  return (
    <section className="bg-(--ink) text-(--parchment)">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        {/* dt precedes dd in the DOM for correct <dl> semantics; each column
            reverses so the figure still reads first. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {content.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 70} stagger={i}>
              <div className="flex flex-col-reverse items-center text-center">
                <dt className="text-xs leading-relaxed tracking-wide text-(--parchment)/70">
                  {stat.label}
                </dt>
                <hr className="h-rule my-3 w-10" />
                <dd className="h-display h-num text-4xl font-semibold text-(--brass-soft) lg:text-[2.6rem]">
                  {stat.value}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

import { content } from '../../content/content'
import Reveal from './Reveal'

export default function StatsBand() {
  return (
    <section className="cp-on-blue px-6 py-20" style={{ background: 'var(--cp-blue-dark)' }}>
      <div className="cp-container">
        {/* dt precedes dd in the DOM for correct <dl> semantics; each column
            reverses so the figure still reads first. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 text-center sm:grid-cols-3 lg:grid-cols-6">
          {content.stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              stagger={i}
              delay={i * 60}
              className="flex flex-col-reverse"
            >
              <dt
                className="mx-auto mt-3 max-w-[11rem] text-[0.8125rem] leading-snug font-medium"
                style={{ color: '#dcebff' }}
              >
                {stat.label}
              </dt>
              <dd className="cp-num text-[2.75rem] leading-none font-extrabold tracking-tight text-white">
                {stat.value}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

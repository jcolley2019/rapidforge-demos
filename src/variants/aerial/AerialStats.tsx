import { content } from '../../content/content'
import Reveal from './Reveal'

export default function AerialStats() {
  return (
    <section className="ae-stats" aria-label="Firm statistics">
      <div className="ae-wrap">
        {/* dt precedes dd in the DOM for correct <dl> semantics; each cell
            reverses so the figure still reads first. */}
        <dl className="ae-stats-grid">
          {content.stats.map((stat, i) => (
            <Reveal key={stat.label} stagger={i}>
              <div className="ae-stat">
                <dt className="ae-stat-label">{stat.label}</dt>
                <dd className="ae-stat-value">{stat.value}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

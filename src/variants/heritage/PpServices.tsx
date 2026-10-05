import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function PpServices() {
  return (
    <section id="services" className="pp-section">
      <div className="pp-wrap">
        <Reveal>
          <div className="pp-head">
            <p className="pp-mono">Index · Services</p>
            <h2 className="pp-display pp-h2">
              What we <em>do</em>
            </h2>
          </div>
        </Reveal>
        <div className="pp-index">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <article className="pp-row">
                <span className="pp-row-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="pp-display pp-row-title">{service.title}</h3>
                  {service.blurb && <p className="pp-row-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <hr className="pp-dash" />
      </div>
    </section>
  )
}

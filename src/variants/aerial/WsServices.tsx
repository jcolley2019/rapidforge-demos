import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function WsServices() {
  return (
    <section id="services" className="ws-section">
      <div className="ws-wrap">
        <Reveal>
          <p className="ws-eyebrow">Services</p>
          <h2 className="ws-display ws-h2">
            What we <span className="ws-warm">do.</span>
          </h2>
        </Reveal>
        <div className="ws-chapters">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <article className="ws-chapter">
                <span className="ws-chapter-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="ws-chapter-title">{service.title}</h3>
                  {service.blurb && <p className="ws-chapter-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function DhServices() {
  return (
    <section id="services" className="dh-section">
      <div className="dh-wrap">
        <Reveal>
          <p className="dh-label">Services</p>
          <h2 className="dh-display dh-h2">What we do</h2>
        </Reveal>
        <div className="dh-rows">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <article className="dh-row">
                <span className="dh-mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="dh-row-title">{service.title}</h3>
                {service.blurb ? <p className="dh-row-blurb">{service.blurb}</p> : <span />}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

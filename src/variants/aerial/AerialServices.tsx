import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'
import { FEATURED_COUNT } from './AerialCapabilities'

/** The remaining services, listed as quiet rows below the showcase. */
export default function AerialServices() {
  const rest = site.services.slice(FEATURED_COUNT)
  return (
    <section className="ae-ground" id="services" aria-label="All services">
      <div className="ae-wrap">
        <div className="ae-ground-head">
          <Reveal>
            <p className="ae-eyebrow">Services</p>
            <h2 className="ae-ground-title">
              {rest.length > 0 ? 'And everything else we do' : 'What we do'}
            </h2>
          </Reveal>
        </div>
        <div>
          {(rest.length > 0 ? rest : site.services).map((service, i) => (
            <Reveal key={service.title} stagger={i % 2}>
              <div className="ae-service-row">
                <h3 className="ae-service-title">{service.title}</h3>
                {service.blurb ? <p className="ae-service-desc">{service.blurb}</p> : <span />}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

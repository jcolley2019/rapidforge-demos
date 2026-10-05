import { content } from '../../content/content'
import Reveal from './Reveal'

/** The six ground services: everything before the aerial trio. */
const GROUND_SERVICES = content.services.slice(0, 6)

export default function GroundServices() {
  return (
    <section className="ae-ground" id="services" aria-label="Ground services">
      <div className="ae-wrap">
        <div className="ae-ground-head">
          <Reveal>
            <p className="ae-eyebrow">On the ground</p>
            <h2 className="ae-ground-title">
              Boundary, topographic, and platting work across{' '}
              {content.serviceArea.replace('Fort Worth, Arlington, Dallas, and ', '')}
            </h2>
          </Reveal>
        </div>
        <div>
          {GROUND_SERVICES.map((service, i) => (
            <Reveal key={service.title} stagger={i % 2}>
              <div className="ae-service-row">
                <h3 className="ae-service-title">{service.title}</h3>
                <p className="ae-service-desc">{service.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function ClServices() {
  return (
    <section id="services" className="cl-section">
      <div className="cl-wrap">
        <Reveal>
          <p className="cl-eyebrow">Services</p>
          <h2 className="cl-display cl-h2">
            What we <em>do</em>
          </h2>
        </Reveal>
        <div className="cl-register">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 90}>
              <article className="cl-entry">
                <span className="cl-entry-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="cl-display cl-entry-title">{service.title}</h3>
                  {service.blurb && <p className="cl-entry-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function IsServices() {
  return (
    <section id="services" className="is-section">
      <div className="is-wrap">
        <Reveal>
          <p className="is-mono">Services</p>
          <h2 className="is-display is-h2">
            What we do<span className="is-mark">.</span>
          </h2>
        </Reveal>
        <div className="is-ledger">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 2) * 70}>
              <article className="is-ledger-row">
                <span className="is-mono" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="is-display is-ledger-title">{service.title}</h3>
                {service.blurb ? <p className="is-ledger-blurb">{service.blurb}</p> : <span />}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

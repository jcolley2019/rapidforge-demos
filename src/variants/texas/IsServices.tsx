import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

const palette = presetForVariant('texas').palette
const photos = tilePhotosFor('texas')

export default function IsServices() {
  return (
    <section id="services" className="is-section">
      <div className="is-wrap">
        <Reveal>
          <h2 className="is-display is-h2">
            Our Services
          </h2>
        </Reveal>
        <div className="is-tiles">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 70}>
              <article className="is-tile">
                <div className="is-tile-media">
                  <PlaceholderImage
                    src={photos[i % photos.length]}
                    palette={palette}
                    aspectRatio="4 / 3"
                    seed={i + 1}
                    loading="lazy"
                  />
                </div>
                <div className="is-tile-body">
                  <h3 className="is-display is-tile-title">{service.title}</h3>
                  {service.blurb && <p className="is-tile-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

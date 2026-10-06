import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

const palette = presetForVariant('heritage').palette
const photos = tilePhotosFor('heritage')

export default function PpServices() {
  return (
    <section id="services" className="pp-section">
      <div className="pp-wrap">
        <Reveal>
          <div className="pp-head">
            <h2 className="pp-display pp-h2">Our Services</h2>
          </div>
        </Reveal>
        <div className="pp-tiles">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90}>
              <article className="pp-tile">
                <div className="pp-tile-media">
                  <PlaceholderImage
                    src={photos[i % photos.length]}
                    palette={palette}
                    aspectRatio="4 / 3"
                    seed={i + 1}
                    loading="lazy"
                  />
                </div>
                <div className="pp-tile-body">
                  <h3 className="pp-display pp-tile-title">{service.title}</h3>
                  {service.blurb && <p className="pp-tile-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

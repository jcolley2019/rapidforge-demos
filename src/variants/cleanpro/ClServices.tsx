import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

const palette = presetForVariant('cleanpro').palette
const photos = tilePhotosFor('cleanpro')

export default function ClServices() {
  return (
    <section id="services" className="cl-section">
      <div className="cl-wrap">
        <Reveal>
          <h2 className="cl-display cl-h2">Our Services</h2>
        </Reveal>
        <div className="cl-tiles">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90}>
              <article className="cl-tile">
                <div className="cl-tile-media">
                  <PlaceholderImage
                    src={photos[i % photos.length]}
                    palette={palette}
                    aspectRatio="4 / 3"
                    seed={i + 1}
                    loading="lazy"
                  />
                </div>
                <div className="cl-tile-body">
                  <h3 className="cl-display cl-tile-title">{service.title}</h3>
                  {service.blurb && <p className="cl-tile-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'

const palette = presetForVariant('geospatial').palette
const photos = site.detailPhotos

export default function DhServices() {
  return (
    <section id="services" className="dh-section">
      <div className="dh-wrap">
        <Reveal>
          <p className="dh-label">Services</p>
          <h2 className="dh-display dh-h2">Our Services</h2>
        </Reveal>
        <div className="dh-tiles">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90}>
              <article className="dh-tile">
                <div className="dh-tile-media">
                  <PlaceholderImage
                    src={photos[i % photos.length]}
                    palette={palette}
                    aspectRatio="16 / 10"
                    seed={i + 1}
                    loading="lazy"
                  />
                </div>
                <div className="dh-tile-body">
                  <h3 className="dh-tile-title">{service.title}</h3>
                  {service.blurb && <p className="dh-tile-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

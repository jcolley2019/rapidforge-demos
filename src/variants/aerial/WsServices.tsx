import { useSite } from '../../brief/site-context'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

const palette = presetForVariant('aerial').palette

export default function WsServices() {
  const site = useSite()
  const photos = tilePhotosFor('aerial', site.photos, site.detailPhotos)
  return (
    <section id="services" className="ws-section ws-services">
      <div className="ws-wrap">
        {/* Not revealed: it sits at the fold and must be visible on load. */}
        <h2 className="ws-display ws-h2">Our Services</h2>
        <div className="ws-tiles">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90}>
              <article className="ws-tile">
                <div className="ws-tile-media">
                  <PlaceholderImage
                    src={photos[i % photos.length]}
                    palette={palette}
                    aspectRatio="4 / 3"
                    seed={i + 1}
                    loading="lazy"
                  />
                </div>
                <div className="ws-tile-body">
                  <h3 className="ws-tile-title">{service.title}</h3>
                  {service.blurb && <p className="ws-tile-blurb">{service.blurb}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

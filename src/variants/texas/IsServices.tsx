import { useSite } from '../../brief/site-context'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

const palette = presetForVariant('texas').palette

export default function IsServices() {
  const site = useSite()
  const photos = tilePhotosFor('texas', site.photos, site.detailPhotos)
  return (
    <section id="services" className="is-section is-services">
      <div className="is-wrap">
        {/* Not revealed: it sits at the fold and must be visible on load. */}
        <h2 className="is-display is-h2">Our Services</h2>
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
                  <h3 className="is-tile-title">{service.title}</h3>
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

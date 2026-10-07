import { useSite } from '../../brief/site-context'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

export default function PpServices() {
  const site = useSite()
  const palette = presetForVariant('heritage', site.vertical).palette
  const photos = tilePhotosFor('heritage', site.photos, site.detailPhotos)
  return (
    <section id="services" className="pp-section pp-services">
      <div className="pp-wrap">
        {/* Not revealed: it sits at the fold and must be visible on load. */}
        <h2 className="pp-display pp-h2">Our Services</h2>
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

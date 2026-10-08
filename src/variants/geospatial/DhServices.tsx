import { useSite } from '../../brief/site-context'
import { PHOTO_SIZES } from '../../brief/photo-sizes'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

export default function DhServices() {
  const site = useSite()
  const palette = presetForVariant('geospatial', site.vertical).palette
  const photos = tilePhotosFor('geospatial', site.photos, site.detailPhotos)
  return (
    <section id="services" className="dh-section dh-services">
      <div className="dh-wrap">
        {/* Not revealed: it sits at the fold and must be visible on load. */}
        <h2 className="dh-display dh-h2">Our Services</h2>
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
                    sizes={PHOTO_SIZES.tile}
                  />
                </div>
                <div className="dh-tile-body">
                  <h3 className="dh-display dh-tile-title">{service.title}</h3>
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

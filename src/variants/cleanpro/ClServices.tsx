import { useSite } from '../../brief/site-context'
import { PHOTO_SIZES } from '../../brief/photo-sizes'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from '../../components/Reveal'
import { presetForVariant } from '../../presets/presets'
import { tilePhotosFor } from '../heroPhoto'

export default function ClServices() {
  const site = useSite()
  const palette = presetForVariant('cleanpro', site.vertical).palette
  const photos = tilePhotosFor('cleanpro', site.photos, site.detailPhotos)
  return (
    <section id="services" className="cl-section">
      <div className="cl-wrap">
        {/* Not revealed: it sits at the fold and must be visible on load. */}
        <h2 className="cl-display cl-h2">Our Services</h2>
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
                    sizes={PHOTO_SIZES.tile}
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

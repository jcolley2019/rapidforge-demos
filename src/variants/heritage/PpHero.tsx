import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'
import PpRidge from './PpRidge'

export default function PpHero() {
  const site = useSite()
  const palette = presetForVariant('heritage', site.vertical).palette
  const photo = heroPhotoFor('heritage', site.photos, site.crewPhotos)
  const { primary, secondary } = heroActions(site)
  return (
    <section className="pp-hero" aria-label="Introduction">
      <div className="pp-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="pp-hero-img" />
      </div>
      <div className="pp-wrap pp-hero-inner">
        <div className="pp-hero-copy">
          <h1 className="pp-display pp-hero-h1">{site.headline}</h1>
          <p className="pp-hero-sub">{site.subhead}</p>
          <div className="pp-hero-actions">
            <a href={primary.href} className={`pp-btn pp-btn-white ${primary.call ? 'pp-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`pp-btn pp-btn-ghost ${secondary.call ? 'pp-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
          {/* The family's italic serif tagline, under the actions. */}
          {site.foundedYear && <p className="pp-since">In business since {site.foundedYear}</p>}
        </div>
      </div>
      <PpRidge className="pp-ridge" />
    </section>
  )
}

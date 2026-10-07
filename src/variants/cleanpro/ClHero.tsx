import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

export default function ClHero() {
  const site = useSite()
  const palette = presetForVariant('cleanpro', site.vertical).palette
  const photo = heroPhotoFor('cleanpro', site.photos, site.crewPhotos)
  const { primary, secondary } = heroActions(site)
  return (
    <section className="cl-hero" aria-label="Introduction">
      <div className="cl-wrap cl-hero-grid">
        <div className="cl-hero-copy">
          <h1 className="cl-display cl-hero-h1">{site.headline}</h1>
          <p className="cl-hero-sub">{site.subhead}</p>
          <div className="cl-hero-actions">
            <a href={primary.href} className={`cl-btn cl-btn-gold ${primary.call ? 'cl-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`cl-btn cl-btn-outline ${secondary.call ? 'cl-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </div>

        <div className="cl-panel">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="cl-panel-img" />
          <div className="cl-panel-vignette" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

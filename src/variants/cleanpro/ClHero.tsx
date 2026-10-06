import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('cleanpro').palette
const photo = heroPhotoFor('cleanpro')

export default function ClHero() {
  return (
    <section className="cl-hero" aria-label="Introduction">
      <div className="cl-wrap cl-hero-grid">
        <div className="cl-hero-copy">
          <h1 className="cl-display cl-hero-h1">{site.headline}</h1>
          <p className="cl-hero-sub">{site.subhead}</p>
          <div className="cl-hero-actions">
            <a href={site.cta.href} className="cl-btn cl-btn-gold">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="cl-btn cl-btn-outline cl-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>

        <figure className="cl-panel">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="cl-panel-img" />
          <div className="cl-panel-vignette" aria-hidden="true" />
        </figure>
      </div>
    </section>
  )
}

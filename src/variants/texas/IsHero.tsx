import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('texas').palette
const photo = heroPhotoFor('texas')

export default function IsHero() {
  return (
    <section className="is-hero" aria-label="Introduction">
      <div className="is-wrap is-hero-grid">
        <div className="is-hero-art">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="is-hero-img" />
        </div>
        <div className="is-hero-copy">
          <h1 className="is-display is-hero-h1">{site.headline}</h1>
          <p className="is-hero-sub">{site.subhead}</p>
          <div className="is-hero-actions">
            <a href={site.cta.href} className="is-btn is-btn-amber">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="is-btn is-btn-blue is-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

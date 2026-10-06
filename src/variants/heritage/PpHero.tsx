import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('heritage').palette
const photo = heroPhotoFor('heritage')

export default function PpHero() {
  return (
    <section className="pp-hero" aria-label="Introduction">
      <div className="pp-wrap pp-hero-grid">
        <div className="pp-hero-copy">
          <h1 className="pp-display pp-hero-h1">{site.headline}</h1>
          <p className="pp-hero-sub">{site.subhead}</p>
          <div className="pp-hero-actions">
            <a href={site.cta.href} className="pp-btn pp-btn-orange">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="pp-btn pp-btn-blue pp-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
        <div className="pp-hero-media">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="4 / 3" className="pp-hero-img" />
        </div>
      </div>
    </section>
  )
}

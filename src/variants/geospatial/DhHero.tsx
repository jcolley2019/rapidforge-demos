import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('geospatial').palette
const photo = heroPhotoFor('geospatial')

export default function DhHero() {
  return (
    <section className="dh-hero" aria-label="Introduction">
      <div className="dh-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="dh-hero-img" />
        <div className="dh-hero-grade" />
      </div>
      <div className="dh-wrap dh-hero-inner">
        <div className="dh-hero-block">
          <h1 className="dh-display dh-hero-h1">{site.headline}</h1>
          <p className="dh-hero-sub">{site.subhead}</p>
          <div className="dh-hero-actions">
            <a href={site.cta.href} className="dh-btn dh-btn-orange">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="dh-btn dh-btn-outline dh-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

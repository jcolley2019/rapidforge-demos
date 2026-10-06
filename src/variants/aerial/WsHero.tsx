import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('aerial').palette
const photo = heroPhotoFor('aerial')

export default function WsHero() {
  return (
    <section className="ws-hero" aria-label="Introduction">
      <div className="ws-wrap">
        <div className="ws-hero-copy">
          <h1 className="ws-display ws-hero-h1">{site.headline}</h1>
          <p className="ws-hero-sub">{site.subhead}</p>
          <div className="ws-hero-actions">
            <a href={site.cta.href} className="ws-btn ws-btn-blue">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="ws-btn ws-btn-outline ws-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
        <div className="ws-hero-band">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="ws-hero-img" />
        </div>
      </div>
    </section>
  )
}

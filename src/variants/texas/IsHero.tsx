import { useSite } from '../../brief/site-context'
import { badgeScore, heroActions } from '../../brief/site-helpers'
import { PHOTO_SIZES } from '../../brief/photo-sizes'
import PlaceholderImage from '../../components/PlaceholderImage'
import Stars from '../../components/Stars'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5.2 3.5h3l1.6 4.2-2 1.3a11 11 0 0 0 7.2 7.2l1.3-2 4.2 1.6v3a1.7 1.7 0 0 1-1.8 1.7A16.6 16.6 0 0 1 3.5 5.3a1.7 1.7 0 0 1 1.7-1.8Z" />
    </svg>
  )
}

export default function IsHero() {
  const site = useSite()
  const palette = presetForVariant('texas', site.vertical).palette
  const photo = heroPhotoFor('texas', site.photos, site.crewPhotos)
  const rating = site.badges.find((b) => b.kind === 'rating')
  const score = rating ? badgeScore(rating) : null
  const { primary, secondary } = heroActions(site)
  return (
    <section className="is-hero" aria-label="Introduction">
      <div className="is-hero-photo" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="is-hero-img" sizes={PHOTO_SIZES.halfHero} />
      </div>
      <div className="is-wrap is-hero-inner">
        <div className="is-hero-copy">
          {rating && score !== null && (
            <p className="is-pill">
              <Stars rating={score} className="is-pill-stars" />
              {/* The stars announce the score; these digits are for the eye. */}
              <span className="is-pill-score" aria-hidden="true">
                {rating.value}
              </span>
              <span className="is-pill-label">{rating.label}</span>
            </p>
          )}
          <h1 className="is-display is-hero-h1">{site.headline}</h1>
          <p className="is-hero-sub">{site.subhead}</p>
          <div className="is-hero-actions">
            <a href={primary.href} className={`is-btn is-btn-lime ${primary.call ? 'is-num' : ''}`.trim()}>
              {primary.label}
              {primary.call && <PhoneGlyph />}
            </a>
            {secondary && (
              <a href={secondary.href} className={`is-btn is-btn-outline ${secondary.call ? 'is-num' : ''}`.trim()}>
                {secondary.label}
                {secondary.call && <PhoneGlyph />}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

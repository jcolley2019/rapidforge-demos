import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import BadgeRow from '../../components/BadgeRow'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('geospatial').palette

/**
 * The family's risk, taken the In-Law way: the whole trust bar (marks and
 * big-number stats) runs along the bottom of the darkened photo, clear of
 * the crew's faces.
 */
export default function DhHero() {
  const site = useSite()
  const photo = heroPhotoFor('geospatial', site.photos, site.crewPhotos)
  const { primary, secondary } = heroActions(site)
  return (
    <section className="dh-hero" aria-label="Introduction">
      <div className="dh-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="dh-hero-img" />
      </div>
      <div className="dh-wrap dh-hero-inner">
        <div className="dh-hero-copy">
          <h1 className="dh-display dh-hero-h1">{site.headline}</h1>
          <p className="dh-hero-sub">{site.subhead}</p>
          <div className="dh-hero-actions">
            <a href={primary.href} className={`dh-btn dh-btn-red ${primary.call ? 'dh-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`dh-btn dh-btn-ghost ${secondary.call ? 'dh-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </div>
        <BadgeRow site={site} className="dh-trustbar" />
      </div>
    </section>
  )
}

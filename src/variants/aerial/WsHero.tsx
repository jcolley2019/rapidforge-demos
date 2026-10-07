import { useSite } from '../../brief/site-context'
import { heroActions } from '../../brief/site-helpers'
import BadgeRow from '../../components/BadgeRow'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import { heroPhotoFor } from '../heroPhoto'

const palette = presetForVariant('aerial').palette

/**
 * The family's risk, taken: a black rounded tab cut into the bottom of the
 * photo carries the stats, the proof, with a link down to the reviews.
 */
export default function WsHero() {
  const site = useSite()
  const photo = heroPhotoFor('aerial', site.photos, site.crewPhotos)
  const hasStats = site.stats.length > 0
  const { primary, secondary } = heroActions(site)
  return (
    <section className="ws-hero" aria-label="Introduction">
      <div className="ws-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="ws-hero-img" />
      </div>
      <div className="ws-wrap ws-hero-inner">
        <div className="ws-hero-copy">
          <h1 className="ws-display ws-hero-h1">{site.headline}</h1>
          <p className="ws-hero-sub">{site.subhead}</p>
          <div className="ws-hero-actions">
            <a href={primary.href} className={`ws-btn ws-btn-red ${primary.call ? 'ws-num' : ''}`.trim()}>
              {primary.label}
            </a>
            {secondary && (
              <a href={secondary.href} className={`ws-btn ws-btn-ghost ${secondary.call ? 'ws-num' : ''}`.trim()}>
                {secondary.label}
              </a>
            )}
          </div>
        </div>
        {hasStats && (
          <div className="ws-tab">
            <BadgeRow site={site} part="stats" />
            {site.reviews.length > 0 && (
              <a href="#reviews" className="ws-tab-link">
                What customers say
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

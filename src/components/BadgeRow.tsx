import Stars from './Stars'
import { BadgeIcon } from './Icons'
import type { SiteBadge, SiteContent } from '../brief/site-content'
import { averageRating, badgeFace, badgeScore } from '../brief/site-helpers'

/**
 * Trust proof under (or inside) every hero. With badges or stats in the
 * brief it shows marks (BBB shield, license seal, award ribbon, rating with
 * its count) and big-number stat tiles. Without either it falls back to the
 * text chips, average rating and call link the trust strip always showed.
 *
 * Structural class names only: br, br-mark, br-stat, … for the marks and
 * tiles; ts, ts-chip, ts-rating, ts-call for the fallback. Each variant
 * styles them inside its own scope.
 */
export default function BadgeRow({
  site,
  part = 'all',
  skip = [],
  className = '',
}: {
  site: SiteContent
  /** Render both halves, or only the marks or only the stat tiles. */
  part?: 'all' | 'marks' | 'stats'
  /** Badge kinds this variant already shows elsewhere, e.g. a rating pill in the hero. */
  skip?: SiteBadge['kind'][]
  className?: string
}) {
  if (site.badges.length === 0 && site.stats.length === 0) {
    return part === 'stats' ? null : <TrustChips site={site} className={className} />
  }

  const badges = part === 'stats' ? [] : site.badges.filter((b) => !skip.includes(b.kind))
  const stats = part === 'marks' ? [] : site.stats
  if (badges.length === 0 && stats.length === 0) return null

  return (
    <div className={`br ${className}`.trim()}>
      {badges.length > 0 && (
        <ul className="br-marks" aria-label="Credentials">
          {badges.map((badge) => {
            const { big, small } = badgeFace(badge)
            const score = badgeScore(badge)
            return (
              <li key={`${badge.kind}-${badge.label}`} className={`br-mark br-mark-${badge.kind}`}>
                <BadgeIcon kind={badge.kind} className="br-icon" />
                <span className="br-mark-text">
                  <span className="br-mark-big">
                    {/* With stars, the stars announce the score; the digits are for the eye. */}
                    {score !== null ? <span aria-hidden="true">{big}</span> : big}
                    {score !== null && <Stars rating={score} className="br-stars" />}
                  </span>
                  {small && <span className="br-mark-small">{small}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {stats.length > 0 && (
        <dl className="br-stats">
          {stats.map((stat) => (
            // A word ("Licensed") is set smaller than a number ("22") so it
            // never out-shouts the figures beside it.
            <div key={stat.label} className={/\d/.test(stat.value) ? 'br-stat' : 'br-stat br-stat-word'}>
              <dt className="br-stat-label">{stat.label}</dt>
              <dd className="br-stat-value">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

/** The fallback: trust chips, the average star rating, and click-to-call. */
function TrustChips({ site, className }: { site: SiteContent; className: string }) {
  const rating = averageRating(site)
  const count = site.reviews.length
  const chips = site.trust
  if (chips.length === 0 && rating === null && !site.phoneHref) return null

  return (
    <div className={`ts ${className}`.trim()}>
      {chips.length > 0 && (
        <ul className="ts-chips" aria-label="Why choose us">
          {chips.map((chip) => (
            <li key={chip} className="ts-chip">
              {chip}
            </li>
          ))}
        </ul>
      )}
      {rating !== null && (
        <p className="ts-rating">
          <Stars rating={rating} className="ts-stars" />
          <span className="ts-rating-text">
            {rating.toFixed(1)} / 5 from {count} review{count === 1 ? '' : 's'}
          </span>
        </p>
      )}
      {site.phoneHref && (
        <a href={site.phoneHref} className="ts-call">
          Call {site.phone}
        </a>
      )}
    </div>
  )
}

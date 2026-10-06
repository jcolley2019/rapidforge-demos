import Stars from './Stars'
import type { SiteContent } from '../brief/site-content'
import { averageRating } from '../brief/site-helpers'

/**
 * Shared trust strip mounted directly under every hero: trust chips, the
 * average star rating when there is at least one review, and a click-to-call
 * link. It carries only structural class names (ts, ts-chip, ts-rating,
 * ts-call); each variant styles them inside its own scope so the strip
 * takes on that page's look.
 */
export default function TrustStrip({ site, className = '' }: { site: SiteContent; className?: string }) {
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

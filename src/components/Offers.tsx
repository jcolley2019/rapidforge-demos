import type { SiteContent, SiteOffer } from '../brief/site-content'

const KIND_LABEL: Record<SiteOffer['kind'], string> = {
  coupon: 'Coupon',
  financing: 'Financing',
  special: 'Special',
}

/**
 * Current offers, mounted directly under the hero on a residential page:
 * a coupon is a ticket (dashed edge, perforated stub), financing and
 * specials are plain cards. Hidden when the brief has no offers and always
 * on a commercial page. Structural class names only (of, of-item,
 * of-coupon, of-stub, of-body, …).
 */
export default function Offers({
  site,
  className = '',
  wrapClassName = '',
}: {
  site: SiteContent
  className?: string
  wrapClassName?: string
}) {
  if (site.mode !== 'residential' || site.offers.length === 0) return null
  return (
    <section className={`of ${className}`.trim()} aria-label="Current offers">
      <ul className={`of-list ${wrapClassName}`.trim()}>
        {site.offers.map((offer) => (
          <li key={offer.title} className={`of-item of-${offer.kind}`}>
            <p className="of-stub">{KIND_LABEL[offer.kind]}</p>
            <div className="of-body">
              <p className="of-title">{offer.title}</p>
              <p className="of-detail">{offer.detail}</p>
              {offer.expires && <p className="of-expires">Ends {offer.expires}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

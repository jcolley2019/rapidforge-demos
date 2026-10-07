import { PinIcon } from './Icons'
import type { SiteContent } from '../brief/site-content'
import { servingHeading } from '../brief/site-helpers'

/**
 * The towns served, as chips with a pin, under a heading built from the
 * data ("Serving <city> and 7 nearby towns"); no region name is written in
 * code. Residential pages only: a commercial page puts "Who we work with"
 * here instead. Hidden when the brief lists no towns.
 */
export default function ServiceAreas({
  site,
  className = '',
  wrapClassName = '',
  titleClassName = '',
}: {
  site: SiteContent
  className?: string
  wrapClassName?: string
  titleClassName?: string
}) {
  if (site.mode !== 'residential' || site.serviceAreas.length === 0) return null
  return (
    <section id="areas" className={`sa ${className}`.trim()} aria-labelledby="areas-title">
      <div className={`sa-inner ${wrapClassName}`.trim()}>
        <h2 id="areas-title" className={`sa-title ${titleClassName}`.trim()}>
          {servingHeading(site)}
        </h2>
        <ul className="sa-chips">
          {site.serviceAreas.map((town) => (
            <li key={town} className="sa-chip">
              <PinIcon className="sa-pin" />
              {town}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

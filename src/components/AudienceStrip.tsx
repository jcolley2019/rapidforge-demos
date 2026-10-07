import type { SiteContent } from '../brief/site-content'

/**
 * "Who we work with": three or four audience tiles on a commercial page, in
 * the slot a residential page gives its service areas. Hidden on a
 * residential page. Structural class names only (ww, ww-tiles, ww-tile, …).
 */
export default function AudienceStrip({
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
  if (site.mode !== 'commercial' || site.audiences.length === 0) return null
  return (
    <section id="who" className={`ww ${className}`.trim()} aria-labelledby="who-title">
      <div className={`ww-inner ${wrapClassName}`.trim()}>
        <h2 id="who-title" className={`ww-title ${titleClassName}`.trim()}>
          Who we work with
        </h2>
        <ul className="ww-tiles">
          {site.audiences.map((audience) => (
            <li key={audience.title} className="ww-tile">
              <h3 className="ww-tile-title">{audience.title}</h3>
              <p className="ww-tile-blurb">{audience.blurb}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

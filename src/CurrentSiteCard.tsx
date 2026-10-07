import type { SiteCurrentSite } from './brief/site-content'

/**
 * "Your site today": the prospect's homepage as it is now, desktop and
 * phone side by side, captioned with what is wrong with it, leading down
 * into the five looks. Renders nothing when the brief has no screenshots,
 * so the picker is unchanged for every brief without a current site.
 */
export default function CurrentSiteCard({
  current,
  problem,
}: {
  current: SiteCurrentSite | null
  problem: string
}) {
  if (!current) return null
  return (
    <section className="pk-now" aria-labelledby="pk-now-title">
      <h2 id="pk-now-title" className="pk-now-title">
        Your site today
      </h2>
      <div className="pk-now-body">
        <div className="pk-now-shots">
          <img
            className="pk-now-desktop"
            src={current.desktopUrl}
            alt="Your current homepage on a desktop screen"
            width={1440}
            height={900}
            decoding="async"
          />
          <img
            className="pk-now-mobile"
            src={current.mobileUrl}
            alt="Your current homepage on a phone"
            width={390}
            height={844}
            decoding="async"
          />
        </div>
        <p className="pk-now-problem">{problem}</p>
      </div>
      <p className="pk-now-next">
        <span>Five ways forward</span>
        <svg className="pk-now-arrow" viewBox="0 0 12 16" aria-hidden="true" focusable="false">
          <path d="M6 1v13M1.5 9.5 6 14l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </p>
    </section>
  )
}

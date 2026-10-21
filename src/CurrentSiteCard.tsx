import type { SiteCurrentSite } from './brief/site-content'

/**
 * "Your site today": the prospect's homepage as it is now, desktop and
 * phone side by side, captioned with what is wrong with it, leading down
 * into the five looks.
 *
 * RFD.INTAKE.16: a prospect with no website (no screenshots and no
 * website_url) gets a short card saying so instead, with no frames and no
 * problem line. With a website_url but no screenshots it renders nothing.
 */
export default function CurrentSiteCard({
  current,
  problem,
  websiteUrl,
  looks,
}: {
  current: SiteCurrentSite | null
  problem: string
  websiteUrl: string | null
  /** How many looks the picker shows, as a word: "five", or "six" with the Scroll Story. */
  looks: string
}) {
  if (!current) {
    if (websiteUrl) return null
    return (
      <section className="pk-none" aria-labelledby="pk-none-title">
        <h2 id="pk-none-title" className="pk-none-title">
          You don't have a website yet
        </h2>
        <p className="pk-none-line">
          {`Here are ${looks} ways to start — every one is a complete, working site built from your Google listing.`}
        </p>
      </section>
    )
  }
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

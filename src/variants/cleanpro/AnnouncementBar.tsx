import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'

export default function AnnouncementBar() {
  return (
    <div
      className="cp-on-blue px-4 py-2 text-center text-sm text-white"
      style={{ background: 'var(--cp-blue)' }}
    >
      {localityLine(site)}
      {site.phoneHref && (
        <>
          {' — '}
          <a
            href={site.phoneHref}
            className="cp-num font-semibold underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current focus-visible:decoration-current"
          >
            {site.phone}
          </a>
        </>
      )}
    </div>
  )
}

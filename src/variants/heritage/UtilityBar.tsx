import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'

export default function UtilityBar() {
  return (
    <div className="bg-(--parchment-deep)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
        {site.phoneHref ? (
          <a
            href={site.phoneHref}
            className="h-num text-sm font-semibold tracking-wide text-(--ink) transition-colors duration-300 hover:text-(--brass) focus-visible:text-(--brass)"
          >
            {site.phone}
          </a>
        ) : (
          <span />
        )}
        <p className="h-eyebrow hidden text-(--ink-faint) sm:block">{localityLine(site)}</p>
      </div>
      <hr className="h-rule" />
    </div>
  )
}

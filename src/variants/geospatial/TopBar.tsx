import { siteContent as site } from '../../brief/current'
import { LOCALITY_TAG } from './localityTag'

export default function TopBar() {
  return (
    <div className="border-b border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
        {site.phoneHref ? (
          <a href={site.phoneHref} className="g-mono g-quiet-link text-xs tracking-[0.08em]">
            TEL {site.phone}
          </a>
        ) : (
          <span className="g-meta">{site.shortName.toUpperCase()}</span>
        )}
        <p className="g-meta hidden sm:block">{LOCALITY_TAG}</p>
      </div>
    </div>
  )
}

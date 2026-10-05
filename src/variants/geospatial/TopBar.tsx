import { content } from '../../content/content'

export const FW_COORDS = '32.6866° N, 97.3345° W'

export default function TopBar() {
  return (
    <div className="border-b border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2">
        <a
          href={content.contact.phoneHref}
          className="g-mono g-quiet-link text-xs tracking-[0.08em]"
        >
          TEL {content.contact.phone}
        </a>
        <p className="g-meta hidden sm:block">
          {FW_COORDS} &middot; FORT_WORTH_TX
        </p>
      </div>
    </div>
  )
}

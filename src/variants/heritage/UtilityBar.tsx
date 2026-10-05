import { content } from '../../content/content'

export default function UtilityBar() {
  return (
    <div className="bg-(--parchment-deep)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-2.5">
        <a
          href={content.contact.phoneHref}
          className="h-num text-sm font-semibold tracking-wide text-(--ink) transition-colors duration-300 hover:text-(--brass) focus-visible:text-(--brass)"
        >
          {content.contact.phone}
        </a>
        <p className="h-eyebrow hidden text-(--ink-faint) sm:block">
          Serving {content.serviceArea} since {content.founded.year}
        </p>
      </div>
      <hr className="h-rule" />
    </div>
  )
}

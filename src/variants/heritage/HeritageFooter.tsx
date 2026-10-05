import { content } from '../../content/content'

export default function HeritageFooter() {
  return (
    <footer className="border-t border-(--brass)/40 bg-(--parchment-deep)">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="h-display text-xl font-semibold">{content.shortName}</p>
            <p className="mt-2 text-sm text-(--ink-soft)">{content.taglines.primary}</p>
            <p className="mt-4 text-sm text-(--ink-soft)">{content.contact.address}</p>
          </div>
          <div>
            <p className="h-eyebrow">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href={content.contact.phoneHref} className="h-quiet-link h-num">
                  {content.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${content.contact.quoteEmail}`}
                  className="h-quiet-link"
                >
                  {content.contact.quoteEmail}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="h-eyebrow">Elsewhere</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={content.contact.clientPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-quiet-link"
                >
                  Client portal (ShareFile)
                </a>
              </li>
              <li>
                <a
                  href={content.contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-quiet-link"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href={content.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-quiet-link"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <hr className="h-rule mt-12" />
        <p className="h-num mt-6 text-center text-xs tracking-wide text-(--ink-faint)">
          &copy; {new Date().getFullYear()} {content.name}. Serving{' '}
          {content.serviceArea}.
        </p>
      </div>
    </footer>
  )
}

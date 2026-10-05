import { content } from '../../content/content'

export default function GeoFooter() {
  return (
    <footer className="border-t border-(--geo-line) bg-(--geo-base-deep)">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {content.shortName}
              <span className="text-(--geo-accent)">.</span>
            </p>
            <p className="mt-2 text-sm text-(--geo-text-dim)">{content.taglines.primary}</p>
            <p className="mt-4 text-sm text-(--geo-text-dim)">{content.contact.address}</p>
          </div>
          <div>
            <p className="g-eyebrow">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href={content.contact.phoneHref} className="g-quiet-link g-num">
                  {content.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${content.contact.quoteEmail}`}
                  className="g-quiet-link"
                >
                  {content.contact.quoteEmail}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="g-eyebrow">Links</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={content.contact.clientPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="g-quiet-link"
                >
                  Client portal (ShareFile)
                </a>
              </li>
              <li>
                <a
                  href={content.contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="g-quiet-link"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href={content.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="g-quiet-link"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-(--geo-line) pt-6 sm:flex-row">
          <p className="g-num text-xs text-(--geo-text-faint)">
            &copy; {new Date().getFullYear()} {content.name}
          </p>
          <p className="g-meta">DATUM: NAD83 / TX_NORTH_CENTRAL_4202</p>
        </div>
      </div>
    </footer>
  )
}

import { content } from '../../content/content'
import Reveal from './Reveal'

export default function QuoteCta() {
  return (
    <section id="contact" className="h-on-ink bg-(--ink) text-(--parchment)">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center lg:py-28">
        <Reveal>
          <p className="h-eyebrow text-(--brass-soft)">Request a quote</p>
          <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
            Put five decades of precision on your project.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-(--parchment)/75">
            Email a brief description of your project — site address, survey
            type, and timeline — to{' '}
            <a href={`mailto:${content.contact.quoteEmail}`} className="h-inline-link">
              {content.contact.quoteEmail}
            </a>{' '}
            and we&rsquo;ll respond with a scope and fee. Prefer to talk it
            through? Call the office.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={`mailto:${content.contact.quoteEmail}`} className="h-btn h-btn-brass">
              Email {content.contact.quoteEmail}
            </a>
            <a href={content.contact.phoneHref} className="h-btn h-btn-outline-light h-num">
              {content.contact.phone}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

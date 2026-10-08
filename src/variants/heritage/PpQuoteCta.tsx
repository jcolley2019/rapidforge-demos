import { useSite } from '../../brief/site-context'
import { quoteActions } from '../../brief/site-helpers'
import Reveal from '../../components/Reveal'
import PpRidge from './PpRidge'

export default function PpQuoteCta() {
  const site = useSite()
  const { primary, secondary } = quoteActions(site)
  return (
    <section id="quote" className="pp-plate">
      <PpRidge className="pp-ridge-top" />
      <div className="pp-wrap pp-section text-center">
        <Reveal>
          <h2 className="pp-display pp-h2 pp-plate-title mx-auto max-w-[18ch]">{site.ctaHeadline}</h2>
          {site.phoneHref && (
            <a href={site.phoneHref} className="pp-display pp-plate-phone pp-num">
              {site.phone}
              {/* The family's hand-drawn underline under the number. */}
              <svg className="pp-scribble" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="M3 9.5c38-5.5 79-7.4 121-6 34 1.1 61 3.5 96 3.9 26 .3 52-1.2 77-3.8" />
              </svg>
            </a>
          )}
          <p className="pp-plate-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          {primary && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href={primary.href} className={`pp-btn pp-btn-white ${primary.call ? 'pp-num' : ''}`.trim()}>
                {primary.label}
              </a>
              {secondary && (
                <a href={secondary.href} className={`pp-btn pp-btn-ghost ${secondary.call ? 'pp-num' : ''}`.trim()}>
                  {secondary.label}
                </a>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}

import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'

export default function DhQuoteCta() {
  return (
    <section id="quote" className="dh-quote-band">
      <div className="dh-wrap dh-section">
        <Reveal>
          <p className="dh-label">{site.cta.label}</p>
          <h2 className="dh-display dh-h2 mx-auto max-w-[14ch]">
            <strong>Ready when</strong> <span className="dh-tone">you are.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-(--dh-muted)">{site.subhead}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
            <a href={site.cta.href} className="dh-btn dh-btn-ember">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="dh-quote-phone dh-num">
                {site.phone}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

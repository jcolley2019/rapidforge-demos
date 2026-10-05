import { siteContent as site } from '../../brief/current'
import Reveal from '../../components/Reveal'
import ClOrbits from './ClOrbits'

export default function ClQuoteCta() {
  return (
    <section id="quote" className="cl-plate">
      <ClOrbits stroke="#a9bdf0" />
      <div className="cl-wrap cl-section">
        <Reveal>
          <p className="cl-eyebrow">{site.cta.label}</p>
          <h2 className="cl-display cl-h2 mx-auto max-w-[16ch]">
            Ready when you <em>are.</em>
          </h2>
          <p className="cl-plate-sub mx-auto mt-5 max-w-xl">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <a href={site.cta.href} className="cl-btn cl-btn-white">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="cl-plate-phone cl-num">
                {site.phone}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

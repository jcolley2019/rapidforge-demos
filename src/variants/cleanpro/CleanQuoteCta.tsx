import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function CleanQuoteCta() {
  return (
    <section id="quote" className="cp-section" style={{ background: 'var(--cp-white)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="cp-bezel" style={{ boxShadow: 'var(--cp-shadow-lift)' }}>
            <div className="cp-on-navy px-8 py-14 text-center sm:px-14" style={{ background: 'var(--cp-navy)' }}>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-4 max-w-xl" style={{ color: '#c9d6ec' }}>
                {site.subhead}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a href={site.cta.href} className="cp-btn cp-btn-primary">
                  {site.cta.label}
                  <span className="cp-btn-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </span>
                </a>
                {site.phoneHref && (
                  <a
                    href={site.phoneHref}
                    className="cp-btn cp-num text-white"
                    style={{ border: '1.5px solid rgba(255,255,255,0.35)' }}
                  >
                    Call {site.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

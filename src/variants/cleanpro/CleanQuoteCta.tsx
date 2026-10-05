import { content } from '../../content/content'
import Reveal from './Reveal'

export default function CleanQuoteCta() {
  return (
    <section id="contact" className="cp-section" style={{ background: 'var(--cp-white)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="cp-bezel" style={{ boxShadow: 'var(--cp-shadow-lift)' }}>
          <div
            className="cp-on-navy px-8 py-14 text-center sm:px-14"
            style={{ background: 'var(--cp-navy)' }}
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to get your property surveyed?
            </h2>
            <p className="mx-auto mt-4 max-w-xl" style={{ color: '#c9d6ec' }}>
              Tell us about your project and a licensed surveyor will follow up with a quote.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a href={`mailto:${content.contact.quoteEmail}`} className="cp-btn cp-btn-primary">
                Request a Quote
                <span className="cp-btn-icon" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </span>
              </a>
              <a
                href={content.contact.phoneHref}
                className="cp-btn cp-num text-white"
                style={{ border: '1.5px solid rgba(255,255,255,0.35)' }}
              >
                Call {content.contact.phone}
              </a>
            </div>
            <p className="mt-6 text-sm" style={{ color: '#b9c8e2' }}>
              No obligation. A licensed surveyor scopes every request.
            </p>
          </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

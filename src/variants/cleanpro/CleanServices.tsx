import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

export default function CleanServices() {
  return (
    <section id="services" className="cp-section" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">What We Do</p>
            <h2 className="cp-h2">{site.verticalLabel} services</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 90} stagger={i % 3}>
              <div className="cp-card group flex h-full flex-col p-7">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'var(--cp-blue-tint)' }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--cp-blue)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h3 className="mt-5 text-lg font-bold leading-snug" style={{ color: 'var(--cp-navy)' }}>
                  {service.title}
                </h3>
                {service.blurb && (
                  <p className="mt-3 flex-1 text-[0.9375rem]" style={{ color: 'var(--cp-navy-soft)' }}>
                    {service.blurb}
                  </p>
                )}
                <a href={site.cta.href} className="cp-cardlink mt-5">
                  {site.cta.label}
                  <span className="cp-cardlink-mark" aria-hidden="true">
                    &rarr;
                  </span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

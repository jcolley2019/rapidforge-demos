import type { CSSProperties } from 'react'
import { content } from '../../content/content'
import PlaceholderImage from '../../components/PlaceholderImage'

const chips = ['50+ Years in Business', 'BBB Accredited Since 2003', '4 Licensed RPLS on Staff']

/** Arrival stagger for the hero — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--cp-delay': `${s}s` }) as CSSProperties

export default function CleanHero() {
  return (
    <section className="cp-section relative overflow-hidden" style={{ background: 'var(--cp-white)' }}>
      {/* Soft blue blob behind the image column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--cp-blue-tint-2), transparent 70%)' }}
      />
      <div className="cp-container relative grid items-center gap-12 lg:grid-cols-2">
        <div className="cp-load">
          <p className="cp-eyebrow">Fort Worth Land Surveying</p>
          <h1 className="cp-h1">{content.taglines.primary}</h1>
          <p className="cp-lead mt-6 text-[1.1875rem]">{content.taglines.secondary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${content.contact.quoteEmail}`} className="cp-btn cp-btn-primary">
              Request a Quote
              <span className="cp-btn-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </a>
            <a href="#services" className="cp-btn cp-btn-ghost">
              Explore Services
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {chips.map((chip) => (
              <li key={chip} className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--cp-navy-soft)' }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="9" fill="var(--cp-blue-tint)" />
                  <path d="M6 10.3 8.8 13 14 7.4" stroke="var(--cp-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {chip}
              </li>
            ))}
          </ul>
        </div>
        <div className="cp-load" style={at(0.14)}>
          <div className="relative">
            <div className="cp-bezel">
              <PlaceholderImage
                aspectRatio="5 / 4"
                gradientFrom="#eaf1fb"
                gradientTo="#d8e6f9"
                lineColor="#1d6fe0"
                lineOpacity={0.35}
                seed={31}
                label="Site imagery coming soon"
                labelColor="#4b5a74"
                className="overflow-hidden"
              />
            </div>
            <div
              className="absolute -bottom-6 -left-4 rounded-2xl bg-white px-5 py-4 sm:-left-8"
              style={{ boxShadow: 'var(--cp-shadow-lift)' }}
            >
              <p className="cp-num text-2xl font-extrabold" style={{ color: 'var(--cp-blue)' }}>
                {content.stats[0].value}
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--cp-navy-soft)' }}>
                Years surveying North Texas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

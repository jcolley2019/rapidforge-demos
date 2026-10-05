import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { averageRating, localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'

/** Arrival stagger for the hero — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--cp-delay': `${s}s` }) as CSSProperties

const rating = averageRating(site)

export default function CleanHero() {
  return (
    <section className="cp-section relative overflow-hidden" style={{ background: 'var(--cp-white)' }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--cp-blue-tint-2), transparent 70%)' }}
      />
      <div className="cp-container relative grid items-center gap-12 lg:grid-cols-2">
        <div className="cp-load">
          <p className="cp-eyebrow">{localityLine(site)}</p>
          <h1 className="cp-h1">{site.headline}</h1>
          <p className="cp-lead mt-6 text-[1.1875rem]">{site.subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.cta.href} className="cp-btn cp-btn-primary">
              {site.cta.label}
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
          {site.phoneHref && (
            <p className="mt-8 text-sm font-medium" style={{ color: 'var(--cp-navy-soft)' }}>
              Or call{' '}
              <a href={site.phoneHref} className="cp-inline-link cp-num">
                {site.phone}
              </a>
            </p>
          )}
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
                label="Photo coming soon"
                labelColor="#4b5a74"
                className="overflow-hidden"
              />
            </div>
            {rating !== null && (
              <div
                className="absolute -bottom-6 -left-4 rounded-2xl bg-white px-5 py-4 sm:-left-8"
                style={{ boxShadow: 'var(--cp-shadow-lift)' }}
              >
                <p className="cp-num text-2xl font-extrabold" style={{ color: 'var(--cp-blue)' }}>
                  {rating.toFixed(1)} <span aria-hidden="true">★</span>
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--cp-navy-soft)' }}>
                  Average from {site.reviews.length} {site.reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

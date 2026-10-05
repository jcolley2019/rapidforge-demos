import type { CSSProperties } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage'
import { siteContent as site } from '../../brief/current'
import { averageRating } from '../../brief/site-helpers'
import Ticks from './Ticks'
import { LOCALITY_TAG } from './localityTag'

/** Arrival stagger for the hero readout — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--g-delay': `${s}s` }) as CSSProperties

const rating = averageRating(site)

export default function GeoHero() {
  return (
    <section className="relative flex min-h-[88dvh] items-center overflow-hidden">
      {/* Backdrop: drifting contour field + graticule + scan sweep */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="g-drift absolute inset-0">
          <PlaceholderImage
            aspectRatio="auto"
            gradientFrom="#0a0f0d"
            gradientTo="#0e1a15"
            lineColor="#3ddc97"
            lineOpacity={0.34}
            seed={5}
            className="h-full w-full"
          />
        </div>
        <div className="g-grid absolute inset-0" />
        <div className="g-scanline" />
        <div className="absolute inset-0 bg-gradient-to-b from-(--geo-base)/40 via-transparent to-(--geo-base)" />
        <div className="g-hero-scrim absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 lg:py-32">
        <p className="g-mono g-load text-xs tracking-[0.16em] text-(--geo-accent)">{LOCALITY_TAG}</p>
        <h1
          className="g-load mt-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          style={at(0.1)}
        >
          {site.headline.replace(/\.$/, '')}
          <span className="g-glow text-(--geo-accent)">.</span>
        </h1>
        <p className="g-load mt-7 max-w-xl text-lg text-(--geo-text-dim)" style={at(0.2)}>
          {site.subhead}
        </p>
        <div className="g-load mt-10 flex flex-wrap items-center gap-4" style={at(0.3)}>
          <a href={site.cta.href} className="g-btn g-btn-accent">
            {site.cta.label}
          </a>
          {site.phoneHref && (
            <a href={site.phoneHref} className="g-btn g-btn-outline g-num">
              {site.phone}
            </a>
          )}
        </div>
        <div className="g-load relative mt-16 inline-block max-w-full" style={at(0.42)}>
          <Ticks />
          <dl className="g-mono flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 text-[0.7rem] tracking-[0.1em] text-(--geo-text-faint) uppercase">
            <div className="flex gap-2">
              <dt>SERVICES</dt>
              <dd className="text-(--geo-text-dim)">{String(site.services.length).padStart(2, '0')}</dd>
            </div>
            {rating !== null && (
              <div className="flex gap-2">
                <dt>RATING</dt>
                <dd className="text-(--geo-text-dim)">{rating.toFixed(1)}_OF_5</dd>
              </div>
            )}
            {site.hours && (
              <div className="flex gap-2">
                <dt>HOURS</dt>
                <dd className="text-(--geo-text-dim)">POSTED</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt>STATUS</dt>
              <dd className="g-glow text-(--geo-accent)">OPERATIONAL</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

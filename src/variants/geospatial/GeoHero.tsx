import type { CSSProperties } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage'
import { content } from '../../content/content'
import Ticks from './Ticks'
import { FW_COORDS } from './TopBar'

/** Arrival stagger for the hero readout — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--g-delay': `${s}s` }) as CSSProperties

export default function GeoHero() {
  return (
    <section className="relative flex min-h-[88dvh] items-center overflow-hidden">
      {/* Backdrop: drifting contour field + survey graticule + scan sweep */}
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
        {/* Reading scrim under the copy column so the contour field never
            competes with the headline. */}
        <div className="g-hero-scrim absolute inset-0" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-24 lg:py-32">
        <p className="g-mono g-load text-xs tracking-[0.16em] text-(--geo-accent)">
          EST_{content.founded.year} // FORT_WORTH_TX // {FW_COORDS.replace(/[°,]/g, '')}
        </p>
        <h1
          className="g-load mt-6 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          style={at(0.1)}
        >
          {content.taglines.primary.replace(/\.$/, '')}
          <span className="g-glow text-(--geo-accent)">.</span>
        </h1>
        <p
          className="g-load mt-7 max-w-xl text-lg text-(--geo-text-dim)"
          style={at(0.2)}
        >
          {content.taglines.secondary} The most advanced surveying
          instrumentation serving {content.serviceArea} — run by{' '}
          {content.stats[1].value} Registered Professional Land Surveyors.
        </p>
        <div className="g-load mt-10 flex flex-wrap items-center gap-4" style={at(0.3)}>
          <a href="#contact" className="g-btn g-btn-accent">
            Request Survey
          </a>
          <a href={content.contact.phoneHref} className="g-btn g-btn-outline g-num">
            {content.contact.phone}
          </a>
        </div>
        <div
          className="g-load relative mt-16 inline-block max-w-full"
          style={at(0.42)}
        >
          <Ticks />
          <dl className="g-mono flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 text-[0.7rem] tracking-[0.1em] text-(--geo-text-faint) uppercase">
            <div className="flex gap-2">
              <dt>SYS</dt>
              <dd className="text-(--geo-text-dim)">TX_STATE_PLANE</dd>
            </div>
            <div className="flex gap-2">
              <dt>GNSS</dt>
              <dd className="text-(--geo-text-dim)">{content.stats[4].value}_ON_NETWORK</dd>
            </div>
            <div className="flex gap-2">
              <dt>CREWS</dt>
              <dd className="text-(--geo-text-dim)">{content.stats[2].value}_FIELD</dd>
            </div>
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

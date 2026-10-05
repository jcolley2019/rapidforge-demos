import type { CSSProperties } from 'react'
import { content } from '../../content/content'
import ParallaxLayer from './ParallaxLayer'

/**
 * Open ridgeline contours seen from altitude. Three layers drift at
 * different rates for depth; each is a set of flowing horizontal paths.
 */
function ContourBand({
  stroke,
  opacity,
  offset,
  width,
}: {
  stroke: string
  opacity: number
  offset: number
  width: number
}) {
  // Gentle ridgelines, hand-drawn: each path is the previous nudged down.
  const rows = [0, 46, 96, 152, 214, 282]
  return (
    <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g
        fill="none"
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth={width}
        transform={`translate(0 ${offset})`}
      >
        {rows.map((y, i) => (
          <path
            key={y}
            d={`M -40 ${420 + y} C 180 ${330 + y - i * 8}, 340 ${470 + y}, 620 ${390 + y - i * 5} S 1030 ${450 + y}, 1210 ${360 + y - i * 6} S 1480 ${430 + y}, 1490 ${420 + y}`}
          />
        ))}
      </g>
    </svg>
  )
}

const delay = (s: number) => ({ '--ae-delay': `${s}s` }) as CSSProperties

export default function AerialHero() {
  return (
    <section className="ae-hero" aria-label="Introduction">
      {/* three depth layers: far, mid, near */}
      <div className="ae-hero-layer">
        <ParallaxLayer drift={1.5} style={{ height: '100%' }}>
          <ContourBand stroke="#aab4c5" opacity={0.1} offset={-140} width={0.8} />
        </ParallaxLayer>
      </div>
      <div className="ae-hero-layer">
        <ParallaxLayer drift={3.25} style={{ height: '100%' }}>
          <ContourBand stroke="#e8a552" opacity={0.13} offset={30} width={1} />
        </ParallaxLayer>
      </div>
      <div className="ae-hero-layer">
        <ParallaxLayer drift={5.5} style={{ height: '100%' }}>
          <ContourBand stroke="#e8a552" opacity={0.22} offset={210} width={1.3} />
        </ParallaxLayer>
      </div>

      <div className="ae-hero-content ae-wrap">
        <p className="ae-eyebrow ae-hero-rise">
          Aerial &amp; Ground Surveying — Fort Worth, TX
        </p>
        <h1 className="ae-hero-headline ae-hero-rise" style={delay(0.12)}>
          {content.taglines.primary}
        </h1>
        <p className="ae-hero-sub ae-hero-rise" style={delay(0.24)}>
          {content.taglines.secondary}
        </p>
        <div className="ae-hero-cta-row ae-hero-rise" style={delay(0.36)}>
          <a href="#quote" className="ae-cta">
            Request a survey
            <span className="ae-cta-mark" aria-hidden="true">
              &rarr;
            </span>
          </a>
        </div>
      </div>

      <div className="ae-scroll-cue" aria-hidden="true" />
    </section>
  )
}

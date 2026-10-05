import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { averageRating, localityLine } from '../../brief/site-helpers'
import ClOrbits from './ClOrbits'

const at = (s: number) => ({ '--cl-delay': `${s}s` }) as CSSProperties

/** Last word of the headline set in serif italic gold. */
function italicLast(text: string) {
  const clean = text.replace(/[.!?]+$/, '')
  const i = clean.lastIndexOf(' ')
  if (i < 0) return <em>{clean}</em>
  return (
    <>
      {clean.slice(0, i)} <em>{clean.slice(i + 1)}.</em>
    </>
  )
}

/**
 * The classical figure, in flat shapes: a draped form on a plinth under an
 * arch. It reads from across the room as "a painting", and gets its
 * texture from the canvas grain overlay.
 */
function ClassicalFigure() {
  return (
    <svg className="cl-panel-art" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f6fb" />
          <stop offset="1" stopColor="#c7d5ea" />
        </linearGradient>
        <linearGradient id="cl-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b981" />
          <stop offset="1" stopColor="#8c6a3f" />
        </linearGradient>
        <linearGradient id="cl-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef1f6" />
          <stop offset="1" stopColor="#b8c3d6" />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#cl-sky)" />
      {/* clouds */}
      <g fill="#ffffff" fillOpacity="0.7">
        <ellipse cx="90" cy="110" rx="70" ry="22" />
        <ellipse cx="130" cy="95" rx="50" ry="20" />
        <ellipse cx="330" cy="160" rx="60" ry="18" />
      </g>
      {/* arch */}
      <path d="M60 500 V260 a140 140 0 0 1 280 0 V500 H300 V270 a100 100 0 0 0 -200 0 V500 Z" fill="url(#cl-stone)" />
      {/* plinth */}
      <rect x="150" y="400" width="100" height="100" fill="#d7dfeb" />
      <rect x="140" y="392" width="120" height="12" fill="#eef1f6" />
      {/* draped figure */}
      <path d="M200 160 c-14 0 -24 10 -24 24 0 8 3 14 8 18 -22 12 -40 44 -46 98 -3 30 -2 62 2 92 h120 c4 -30 5 -62 2 -92 -6 -54 -24 -86 -46 -98 5 -4 8 -10 8 -18 0 -14 -10 -24 -24 -24 z" fill="url(#cl-gold)" />
      <path d="M176 230 c-10 40 -14 90 -10 162 h22 c-8 -70 -8 -118 0 -160 z" fill="#ffffff" fillOpacity="0.28" />
      {/* halo */}
      <circle cx="200" cy="150" r="46" fill="none" stroke="#d9b981" strokeOpacity="0.7" strokeWidth="2" />
    </svg>
  )
}

const photo = site.photos[0]
const rating = averageRating(site)

export default function ClHero() {
  return (
    <section className="cl-hero" aria-label="Introduction">
      <ClOrbits />
      <div className="cl-wrap cl-hero-grid">
        <div className="cl-load">
          <p className="cl-eyebrow">{localityLine(site)}</p>
          <h1 className="cl-display cl-hero-h1" style={at(0.1)}>
            {italicLast(site.headline)}
          </h1>
          <p className="cl-hero-sub">{site.subhead}</p>
          <div className="cl-hero-actions">
            <a href={site.cta.href} className="cl-btn cl-btn-blue">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="cl-btn cl-btn-ghost cl-num">
                Call {site.phone}
              </a>
            )}
          </div>
          <dl className="cl-trust">
            {rating !== null && (
              <div className="cl-trust-item">
                <dt className="cl-mono">Rated</dt>
                <dd className="cl-display cl-trust-value cl-num">{rating.toFixed(1)} / 5</dd>
              </div>
            )}
            <div className="cl-trust-item">
              <dt className="cl-mono">Services</dt>
              <dd className="cl-display cl-trust-value cl-num">{site.services.length}</dd>
            </div>
            {site.city && (
              <div className="cl-trust-item">
                <dt className="cl-mono">Based in</dt>
                <dd className="cl-display cl-trust-value">{site.city}</dd>
              </div>
            )}
          </dl>
        </div>

        <figure className="cl-panel cl-load" style={at(0.2)}>
          {photo ? <img src={photo} alt="" /> : <ClassicalFigure />}
          <figcaption className="cl-panel-caption cl-mono">
            {site.verticalLabel} · {site.shortName}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

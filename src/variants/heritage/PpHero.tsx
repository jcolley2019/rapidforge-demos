import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { averageRating, localityLine } from '../../brief/site-helpers'

const at = (s: number) => ({ '--pp-delay': `${s}s` }) as CSSProperties

/** Last word of the headline set as the single ember accent word. */
function emberLast(text: string) {
  const clean = text.replace(/[.!?]+$/, '')
  const i = clean.lastIndexOf(' ')
  if (i < 0) return <em>{clean}</em>
  return (
    <>
      {clean.slice(0, i)} <em>{clean.slice(i + 1)}</em>
    </>
  )
}

const photo = site.photos[0]
const rating = averageRating(site)

export default function PpHero() {
  return (
    <section className="pp-hero" aria-label="Introduction">
      <div className="pp-hero-media" aria-hidden="true">
        {photo ? <img src={photo} alt="" /> : <div className="pp-halftone" />}
      </div>
      <span className="pp-reg pp-reg-tl" aria-hidden="true" />
      <span className="pp-reg pp-reg-tr" aria-hidden="true" />

      <div className="pp-wrap pp-hero-inner">
        <p className="pp-mono pp-load">{localityLine(site)}</p>
        <h1 className="pp-display pp-hero-h1 pp-load" style={at(0.1)}>
          {emberLast(site.headline)}
        </h1>
        <p className="pp-hero-sub pp-load" style={at(0.2)}>
          {site.subhead}
        </p>
        <div className="pp-hero-actions pp-load" style={at(0.3)}>
          <a href={site.cta.href} className="pp-btn pp-btn-ink">
            {site.cta.label}
          </a>
          {site.phoneHref && (
            <a href={site.phoneHref} className="pp-btn pp-btn-ghost pp-num">
              Call {site.phone}
            </a>
          )}
        </div>
      </div>

      <div className="pp-wrap pp-hero-callouts" aria-hidden="true">
        <span className="pp-mono">No. 01 — {site.verticalLabel}</span>
        <span className="pp-mono">Services · {String(site.services.length).padStart(2, '0')}</span>
        {rating !== null && <span className="pp-mono">Rated · {rating.toFixed(1)} / 5</span>}
      </div>
    </section>
  )
}

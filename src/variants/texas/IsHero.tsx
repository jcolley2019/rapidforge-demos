import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'

const at = (s: number) => ({ '--is-delay': `${s}s` }) as CSSProperties

/** Headline with its final mark in red. */
function redMark(text: string) {
  const m = text.match(/^(.*?)([.!?]+)$/)
  if (!m) {
    return (
      <>
        {text}
        <span className="is-mark">.</span>
      </>
    )
  }
  return (
    <>
      {m[1]}
      <span className="is-mark">{m[2]}</span>
    </>
  )
}

const photo = site.photos[0]

export default function IsHero() {
  return (
    <>
      <section className="is-hero" aria-label="Introduction">
        <div className="is-hero-copy">
          <p className="is-mono is-load">{localityLine(site)}</p>
          <h1 className="is-display is-hero-h1 is-load" style={at(0.08)}>
            {redMark(site.headline)}
          </h1>
          <p className="is-hero-sub is-load" style={at(0.16)}>
            {site.subhead}
          </p>
          <div className="is-hero-actions is-load" style={at(0.24)}>
            <a href={site.cta.href} className="is-btn is-btn-black">
              {site.cta.label}
            </a>
            {site.phoneHref && (
              <a href={site.phoneHref} className="is-btn is-btn-outline is-num">
                {site.phone}
              </a>
            )}
          </div>
        </div>

        <div className={`is-hero-art ${photo ? 'is-hero-art-photo' : ''}`} aria-hidden="true">
          {photo ? (
            <>
              <img src={photo} alt="" />
              <div className="is-dither" />
            </>
          ) : (
            <>
              <div className="is-dither" />
              <div className="is-dither is-dither-2" />
              <div className="is-dither is-dither-3" />
              <div className="is-dither-sun" />
            </>
          )}
          <p className="is-mono is-hero-tag">
            {site.verticalLabel} · 1-bit
          </p>
        </div>
      </section>

      <div className="is-wordmark-band" aria-hidden="true">
        <span className="is-display is-wordmark">
          {site.shortName}
          <span className="is-mark">.</span>
        </span>
      </div>
    </>
  )
}

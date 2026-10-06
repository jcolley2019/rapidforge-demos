import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'

const at = (s: number) => ({ '--is-delay': `${s}s` }) as CSSProperties
const palette = presetForVariant('texas').palette
const photo = site.photos[0]

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
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="is-btn is-btn-outline is-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>

        <div className="is-hero-art" aria-hidden="true">
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="is-hero-img" />
          <div className="is-screen" />
          <p className="is-mono is-hero-tag">{localityLine(site)}</p>
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

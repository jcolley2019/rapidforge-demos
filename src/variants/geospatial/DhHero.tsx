import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'

const at = (s: number) => ({ '--dh-delay': `${s}s` }) as CSSProperties
const palette = presetForVariant('geospatial').palette
const photo = site.photos[0]
const tickerItems = site.services.map((s) => s.title)

export default function DhHero() {
  return (
    <section className="dh-hero" aria-label="Introduction">
      <div className="dh-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="dh-hero-img" />
        <div className="dh-hero-grade" />
      </div>

      <div className="dh-wrap dh-hero-body">
        <p className="dh-label dh-hero-eyebrow dh-load">{localityLine(site)}</p>
        <h1 className="dh-display dh-hero-h1 dh-load" style={at(0.12)}>
          {site.headline}
        </h1>
        <p className="dh-hero-sub dh-load" style={at(0.24)}>
          {site.subhead}
        </p>
        <div className="dh-hero-actions dh-load" style={at(0.36)}>
          <a href={site.cta.href} className="dh-btn dh-btn-ember">
            {site.cta.label}
          </a>
          {site.ctaSecondary && (
            <a href={site.ctaSecondary.href} className="dh-btn dh-btn-ghost dh-num">
              {site.ctaSecondary.label}
            </a>
          )}
        </div>
      </div>

      <div className="dh-hero-foot">
        <div className="dh-wrap dh-hero-foot-inner">
          <span className="dh-cue dh-mono" aria-hidden="true">
            <span className="dh-cue-line" />
            Scroll
          </span>
          <div className="dh-ticker" aria-label="Services">
            <div className="dh-ticker-track">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={`${item}-${i}`} className="dh-ticker-item" aria-hidden={i >= tickerItems.length}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

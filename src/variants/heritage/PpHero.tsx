import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'

const at = (s: number) => ({ '--pp-delay': `${s}s` }) as CSSProperties
const palette = presetForVariant('heritage').palette
const photo = site.photos[0]

export default function PpHero() {
  return (
    <section className="pp-hero" aria-label="Introduction">
      <div className="pp-hero-media" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="pp-hero-img" />
        <div className="pp-hero-screen" />
      </div>
      <span className="pp-reg pp-reg-tl" aria-hidden="true" />
      <span className="pp-reg pp-reg-tr" aria-hidden="true" />

      <div className="pp-wrap pp-hero-inner">
        <div className="pp-hero-panel pp-load">
          <span className="pp-reg pp-reg-tl" aria-hidden="true" />
          <span className="pp-reg pp-reg-br" aria-hidden="true" />
          <p className="pp-mono">{localityLine(site)}</p>
          <h1 className="pp-display pp-hero-h1" style={at(0.1)}>
            {site.headline}
          </h1>
          <p className="pp-hero-sub">{site.subhead}</p>
          <div className="pp-hero-actions">
            <a href={site.cta.href} className="pp-btn pp-btn-ink">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="pp-btn pp-btn-ghost pp-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

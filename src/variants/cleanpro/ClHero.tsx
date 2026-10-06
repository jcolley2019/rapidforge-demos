import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'
import ClOrbits from './ClOrbits'

const at = (s: number) => ({ '--cl-delay': `${s}s` }) as CSSProperties
const palette = presetForVariant('cleanpro').palette
const photo = site.photos[0]

export default function ClHero() {
  return (
    <section className="cl-hero" aria-label="Introduction">
      <ClOrbits />
      <div className="cl-wrap cl-hero-grid">
        <div className="cl-load">
          <p className="cl-eyebrow">{localityLine(site)}</p>
          <h1 className="cl-display cl-hero-h1" style={at(0.1)}>
            {site.headline}
          </h1>
          <p className="cl-hero-sub">{site.subhead}</p>
          <div className="cl-hero-actions">
            <a href={site.cta.href} className="cl-btn cl-btn-blue">
              {site.cta.label}
            </a>
            {site.ctaSecondary && (
              <a href={site.ctaSecondary.href} className="cl-btn cl-btn-ghost cl-num">
                {site.ctaSecondary.label}
              </a>
            )}
          </div>
        </div>

        <figure className="cl-panel cl-load" style={at(0.2)}>
          <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="cl-panel-img" />
          <figcaption className="cl-panel-caption cl-mono">
            {site.verticalLabel} · {site.shortName}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'
import PlaceholderImage from '../../components/PlaceholderImage'
import { presetForVariant } from '../../presets/presets'

const at = (s: number) => ({ '--ws-delay': `${s}s` }) as CSSProperties
const palette = presetForVariant('aerial').palette
const photo = site.photos[0]

/** The headline's last word goes terracotta. */
function warmLast(text: string) {
  const clean = text.replace(/[.!?]+$/, '')
  const mark = text.slice(clean.length) || '.'
  const i = clean.lastIndexOf(' ')
  if (i < 0) return <span className="ws-warm">{text}</span>
  return (
    <>
      {clean.slice(0, i)}{' '}
      <span className="ws-warm">
        {clean.slice(i + 1)}
        {mark}
      </span>
    </>
  )
}

export default function WsHero() {
  return (
    <section className="ws-hero" aria-label="Introduction">
      <div className="ws-hero-copy">
        <p className="ws-eyebrow ws-load">{localityLine(site)}</p>
        <h1 className="ws-display ws-hero-h1 ws-load" style={at(0.1)}>
          {warmLast(site.headline)}
        </h1>
        <p className="ws-hero-sub ws-load" style={at(0.2)}>
          {site.subhead}
        </p>
        <div className="ws-hero-actions ws-load" style={at(0.3)}>
          <a href={site.cta.href} className="ws-btn ws-btn-green">
            {site.cta.label}
          </a>
          {site.ctaSecondary && (
            <a href={site.ctaSecondary.href} className="ws-btn ws-btn-outline ws-num">
              {site.ctaSecondary.label}
            </a>
          )}
        </div>
      </div>

      <div className="ws-hero-art" aria-hidden="true">
        <PlaceholderImage src={photo} palette={palette} aspectRatio="auto" className="ws-hero-img" />
        <p className="ws-mono ws-hero-tag">{localityLine(site)}</p>
      </div>
    </section>
  )
}

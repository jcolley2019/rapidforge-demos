import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'

const at = (s: number) => ({ '--dh-delay': `${s}s` }) as CSSProperties

/** Two-tone headline: the first clause bright, the rest in the fog tone. */
function twoTone(text: string) {
  const words = text.trim().split(/\s+/)
  if (words.length < 4) return <strong>{text}</strong>
  const cut = Math.ceil(words.length / 2)
  return (
    <>
      <strong>{words.slice(0, cut).join(' ')}</strong>{' '}
      <span className="dh-tone">{words.slice(cut).join(' ')}</span>
    </>
  )
}

const photo = site.photos[0]
const tickerItems = site.services.map((s) => s.title)

export default function DhHero() {
  return (
    <section className="dh-hero" aria-label="Introduction">
      <div className="dh-hero-media" aria-hidden="true">
        {photo ? <img src={photo} alt="" /> : <div className="dh-dusk" />}
      </div>

      <div className="dh-wrap dh-hero-body">
        <p className="dh-label dh-hero-eyebrow dh-load">{localityLine(site)}</p>
        <h1 className="dh-display dh-hero-h1 dh-load" style={at(0.12)}>
          {twoTone(site.headline)}
        </h1>
        <p className="dh-hero-sub dh-load" style={at(0.24)}>
          {site.subhead}
        </p>
        <div className="dh-hero-actions dh-load" style={at(0.36)}>
          <a href={site.cta.href} className="dh-btn dh-btn-ember">
            {site.cta.label}
          </a>
          {site.phoneHref && (
            <a href={site.phoneHref} className="dh-btn dh-btn-ghost dh-num">
              {site.phone}
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

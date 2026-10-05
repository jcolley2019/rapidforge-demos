import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import { localityLine } from '../../brief/site-helpers'

const at = (s: number) => ({ '--ws-delay': `${s}s` }) as CSSProperties

/** The headline's last word goes terracotta. */
function warmLast(text: string) {
  const clean = text.replace(/[.!?]+$/, '')
  const i = clean.lastIndexOf(' ')
  if (i < 0) return <span className="ws-warm">{clean}</span>
  return (
    <>
      {clean.slice(0, i)} <span className="ws-warm">{clean.slice(i + 1)}.</span>
    </>
  )
}

/**
 * The painted panel in flat gouache shapes: stepped sky, a low sun,
 * rolling hills and a small house with its lights on. Paper tooth comes
 * from the overlay in aerial.css.
 */
function StorybookScene() {
  return (
    <svg className="ws-scene" viewBox="0 0 600 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ws-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9d3e3" />
          <stop offset="0.55" stopColor="#e7d9c3" />
          <stop offset="1" stopColor="#f0c7a9" />
        </linearGradient>
      </defs>
      <rect width="600" height="800" fill="url(#ws-sky)" />
      {/* sky bands */}
      <rect y="120" width="600" height="18" fill="#ffffff" fillOpacity="0.35" />
      <rect y="210" width="600" height="10" fill="#ffffff" fillOpacity="0.25" />
      {/* sun */}
      <circle cx="420" cy="330" r="78" fill="#d97a4a" />
      <circle cx="420" cy="330" r="96" fill="#d97a4a" fillOpacity="0.18" />
      {/* far hills */}
      <ellipse cx="120" cy="520" rx="330" ry="120" fill="#6f8f6b" />
      <ellipse cx="560" cy="540" rx="300" ry="110" fill="#5d7f5c" />
      {/* mid hills */}
      <ellipse cx="380" cy="620" rx="380" ry="130" fill="#3f6a44" />
      <ellipse cx="40" cy="660" rx="300" ry="120" fill="#2f5233" />
      {/* house */}
      <rect x="250" y="500" width="120" height="86" fill="#f6efe4" />
      <polygon points="238,502 310,446 382,502" fill="#d97a4a" />
      <rect x="296" y="540" width="28" height="46" fill="#2f5233" />
      <rect x="264" y="520" width="22" height="22" fill="#f0c04a" />
      <rect x="334" y="520" width="22" height="22" fill="#f0c04a" />
      <rect x="344" y="456" width="14" height="30" fill="#8c4a2a" />
      {/* path and trees */}
      <path d="M310 586 C 300 640, 260 690, 180 800 L 420 800 C 360 700, 330 650, 310 586 Z" fill="#e3cfae" />
      <g fill="#24412a">
        <ellipse cx="120" cy="560" rx="26" ry="42" />
        <ellipse cx="500" cy="590" rx="30" ry="48" />
        <ellipse cx="545" cy="570" rx="20" ry="34" />
      </g>
      <g fill="#5a3a22">
        <rect x="116" y="596" width="8" height="26" />
        <rect x="496" y="634" width="8" height="30" />
      </g>
      {/* foreground */}
      <ellipse cx="300" cy="860" rx="420" ry="120" fill="#1e2a22" />
    </svg>
  )
}

const photo = site.photos[0]

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
          {site.phoneHref && (
            <a href={site.phoneHref} className="ws-btn ws-btn-outline ws-num">
              Call {site.phone}
            </a>
          )}
        </div>
      </div>

      <div className="ws-hero-art" aria-hidden="true">
        {photo ? <img src={photo} alt="" /> : <StorybookScene />}
        <p className="ws-mono ws-hero-tag">
          Chapter one · {site.verticalLabel}
        </p>
      </div>
    </section>
  )
}

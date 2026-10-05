import '@fontsource-variable/inter'
import './picker.css'

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PlaceholderImage from './components/PlaceholderImage'
import { siteContent as site } from './brief/current'
import { presetForVariant, swatchesOf } from './presets/presets'
import { variants } from './variants/variants'

/* Five directions across a six-column field: three wide, then two wider —
   a deliberate composition rather than a ragged third row. */
const SPANS = ['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-3']

export default function PickerPage() {
  useEffect(() => {
    document.title = 'RapidForge Demos'
  }, [])

  return (
    <main className="pk">
      <div className="pk-shell">
        <header className="pk-head">
          <h1 className="pk-title">{site.name} &mdash; five design directions</h1>
          <p className="pk-lead">
            Each direction is a complete, working one-page site built on the same
            content. Open any of them to review it, then use the link in the
            corner to come back here.
          </p>
        </header>

        <ul className="pk-grid">
          {variants.map((variant, i) => {
            const preset = presetForVariant(variant.slug)
            const swatches = swatchesOf(preset)
            return (
              <li key={variant.slug} className={SPANS[i] ?? 'lg:col-span-2'}>
                <Link to={`/${variant.slug}`} className="pk-card">
                  <div className="pk-card-media">
                    <PlaceholderImage
                      aspectRatio="16 / 7"
                      palette={preset.palette}
                      lineOpacity={0.5}
                      seed={i + 1}
                    />
                  </div>
                  <div className="pk-card-body">
                    <p className="pk-card-index">
                      {String(i + 1).padStart(2, '0')} &middot; {site.name}
                    </p>
                    <h2 className="pk-card-name">
                      {preset.name}
                      <span className="pk-card-mark" aria-hidden="true">
                        &rarr;
                      </span>
                    </h2>
                    <p className="pk-card-desc">{variant.description}</p>
                    <div className="pk-swatches" aria-hidden="true">
                      {swatches.map((color, j) => (
                        <span key={`${color}-${j}`} className="pk-swatch" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <footer className="pk-foot">
          <span>{site.name}</span>
          {site.address && <span>{site.address}</span>}
          {site.phoneHref && (
            <a href={site.phoneHref} className="pk-foot-link">
              {site.phone}
            </a>
          )}
        </footer>
      </div>
    </main>
  )
}

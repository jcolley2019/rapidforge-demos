import '@fontsource-variable/inter'
import './picker.css'

import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { siteContent as site } from './brief/current'
import { presetForVariant, swatchesOf } from './presets/presets'
import { previewFor } from './presets/previews'
import { variants } from './variants/variants'

export default function PickerPage() {
  useEffect(() => {
    document.title = 'RapidForge Demos'
  }, [])

  return (
    <main className="pk">
      <div className="pk-shell">
        <header className="pk-head">
          <h1 className="pk-title">{`${site.name} — five looks, pick one`}</h1>
          <p className="pk-lead">
            Each one is a complete, working site. Open any of them; use the link
            in the corner to come back.
          </p>
        </header>

        <ul className="pk-grid">
          {variants.map((variant) => {
            const preset = presetForVariant(variant.slug)
            const preview = previewFor(variant.slug)
            return (
              <li key={variant.slug}>
                <Link to={`/${variant.slug}`} className="pk-card">
                  {/* The screenshots repeat what the name and description
                      say, so they stay out of the link's accessible name. */}
                  <div className="pk-frame">
                    <img
                      className="pk-shot"
                      src={preview.desktop}
                      alt=""
                      width={1280}
                      height={800}
                      decoding="async"
                    />
                    <img
                      className="pk-phone"
                      src={preview.mobile}
                      alt=""
                      width={390}
                      height={844}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h2 className="pk-name">{preset.name}</h2>
                  <p className="pk-desc">{variant.description}</p>
                  <div className="pk-swatches" aria-hidden="true">
                    {swatchesOf(preset).map((color, j) => (
                      <span key={`${color}-${j}`} className="pk-swatch" style={{ backgroundColor: color }} />
                    ))}
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

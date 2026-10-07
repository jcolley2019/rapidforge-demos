import '@fontsource-variable/inter'
import './picker.css'

import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { briefName, twinsFor } from './brief/current'
import CurrentSiteCard from './CurrentSiteCard'
import { useBriefName, useSite } from './brief/site-context'
import { presetForVariant, swatchesOf } from './presets/presets'
import { previewFor } from './presets/previews'
import { variants } from './variants/variants'

export default function PickerPage() {
  const site = useSite()
  const brief = useBriefName()
  const twins = twinsFor(brief)
  const { search } = useLocation()
  const [, setParams] = useSearchParams()

  useEffect(() => {
    document.title = 'RapidForge Demos'
  }, [])

  // The build's own brief needs no query; the other twin is named in ?brief=.
  function show(stem: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (stem === briefName) next.delete('brief')
        else next.set('brief', stem)
        return next
      },
      { replace: true },
    )
  }

  const commercialShown = twins !== null && brief === twins.commercial

  return (
    <main className="pk">
      <div className="pk-shell">
        <header className="pk-head">
          {twins && (
            <div className="pk-segment" role="group" aria-label="Which of your sites to show">
              <button
                type="button"
                className="pk-seg"
                aria-pressed={brief === twins.residential}
                onClick={() => show(twins.residential)}
              >
                Residential
              </button>
              <button
                type="button"
                className="pk-seg"
                aria-pressed={brief === twins.commercial}
                onClick={() => show(twins.commercial)}
              >
                Commercial
              </button>
            </div>
          )}
          <h1 className="pk-title">{`${site.name} — five looks, pick one`}</h1>
          <p className="pk-lead">
            Each one is a complete, working site. Open any of them; use the link
            in the corner to come back.
            {commercialShown && ' The pictures show the residential site; each look opens on your commercial one.'}
          </p>
        </header>

        <CurrentSiteCard current={site.currentSite} problem={site.problemLine} />

        <ul className="pk-grid">
          {variants.map((variant) => {
            const preset = presetForVariant(variant.slug)
            const preview = previewFor(variant.slug)
            return (
              <li key={variant.slug}>
                <Link to={{ pathname: `/${variant.slug}`, search }} className="pk-card">
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
                  <p className="pk-desc">{preset.description}</p>
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

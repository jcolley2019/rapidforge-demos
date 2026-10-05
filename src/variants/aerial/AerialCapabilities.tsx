import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from './Reveal'

/** Up to three featured services get the full-bleed treatment. */
export const FEATURED_COUNT = 3
const FEATURED = site.services.slice(0, FEATURED_COUNT)

const PANEL_TONES = [
  { from: '#26375a', to: '#131c2b', seed: 41 },
  { from: '#1c2a44', to: '#0b1120', seed: 42 },
  { from: '#22334f', to: '#101827', seed: 43 },
]

/**
 * The showcase: tall full-bleed panels, each an aspect-stable imagery
 * slot (real photos drop in later with zero layout shift) with a parallax
 * depth offset and a bottom-edge scrim.
 */
export default function AerialCapabilities() {
  if (FEATURED.length === 0) return null
  return (
    <section className="ae-cap" id="featured" aria-label="Featured services">
      {FEATURED.map((service, i) => {
        const tone = PANEL_TONES[i % PANEL_TONES.length]
        return (
          <article key={service.title} className="ae-cap-panel">
            <div className="ae-cap-media">
              <div className="ae-cap-drift">
                <PlaceholderImage
                  aspectRatio="auto"
                  gradientFrom={tone.from}
                  gradientTo={tone.to}
                  lineColor="#e8a552"
                  lineOpacity={0.32}
                  seed={tone.seed}
                  label="Photo placeholder"
                  labelColor="#aab4c5"
                  className="h-full"
                />
              </div>
            </div>
            <div className="ae-cap-scrim">
              <Reveal>
                <div className="ae-cap-inner">
                  <span className="ae-cap-index">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="ae-cap-title">{service.title}</h2>
                  {service.blurb && <p className="ae-cap-desc">{service.blurb}</p>}
                </div>
              </Reveal>
            </div>
          </article>
        )
      })}
    </section>
  )
}

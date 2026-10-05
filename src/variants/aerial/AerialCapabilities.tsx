import { content } from '../../content/content'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from './Reveal'

/** The three aerial capabilities: last three services in content.ts. */
const AERIAL_SERVICES = content.services.slice(6)

const PANEL_TONES = [
  { from: '#26375a', to: '#131c2b', seed: 41 },
  { from: '#1c2a44', to: '#0b1120', seed: 42 },
  { from: '#22334f', to: '#101827', seed: 43 },
]

/**
 * The showcase: three tall full-bleed panels, each an aspect-stable
 * imagery slot (real drone footage drops in later with zero layout
 * shift) with a parallax depth offset and a bottom-edge scrim.
 */
export default function AerialCapabilities() {
  return (
    <section className="ae-cap" id="aerial" aria-label="Aerial capabilities">
      {AERIAL_SERVICES.map((service, i) => {
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
                  label="Drone imagery placeholder"
                  labelColor="#aab4c5"
                  className="h-full"
                />
              </div>
            </div>
            <div className="ae-cap-scrim">
              <Reveal>
                <div className="ae-cap-inner">
                  <span className="ae-cap-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="ae-cap-title">{service.title}</h2>
                  <p className="ae-cap-desc">{service.description}</p>
                </div>
              </Reveal>
            </div>
          </article>
        )
      })}
    </section>
  )
}

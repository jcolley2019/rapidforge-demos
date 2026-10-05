import { useId } from 'react'
import { content } from '../../content/content'
import Reveal from './Reveal'

const FLIGHT_PATH = 'M 0 46 C 260 8, 560 60, 840 30 S 1300 22, 1440 40'

/**
 * Calm typographic statement between the hero and the aerial showcase.
 * A dashed flight path draws across as the section moves through the
 * viewport; the crosshair marker rides the same scroll timeline.
 */
export default function AltitudeInterlude() {
  const maskId = useId()
  return (
    <section className="ae-interlude" aria-label="Since 1973">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-statement">
            Measuring North Texas from the ground <em>and the sky</em> since{' '}
            {content.founded.year} — founded by {content.founded.founder},{' '}
            {content.founded.founderCredential}.
          </p>
        </Reveal>

        <svg
          className="ae-flightpath"
          viewBox="0 0 1440 92"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <path
                className="ae-fp-mask"
                d={FLIGHT_PATH}
                pathLength={1}
                stroke="#fff"
                strokeWidth={12}
                fill="none"
              />
            </mask>
          </defs>
          <path
            className="ae-fp-line"
            d={FLIGHT_PATH}
            strokeWidth={1.25}
            mask={`url(#${maskId})`}
          />
          {/* crosshair marker riding the path */}
          <g className="ae-fp-marker" strokeWidth={1.25} aria-hidden="true">
            <circle r={7} />
            <line x1={-11} y1={0} x2={-4} y2={0} />
            <line x1={4} y1={0} x2={11} y2={0} />
            <line x1={0} y1={-11} x2={0} y2={-4} />
            <line x1={0} y1={4} x2={0} y2={11} />
          </g>
        </svg>
      </div>
    </section>
  )
}

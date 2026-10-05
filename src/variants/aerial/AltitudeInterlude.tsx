import { useId } from 'react'
import { siteContent as site } from '../../brief/current'
import Reveal from './Reveal'

const FLIGHT_PATH = 'M 0 46 C 260 8, 560 60, 840 30 S 1300 22, 1440 40'

/**
 * Calm typographic statement between the hero and the showcase. A dashed
 * flight path draws across as the section moves through the viewport;
 * the crosshair marker rides the same scroll timeline.
 */
export default function AltitudeInterlude() {
  const maskId = useId()
  return (
    <section className="ae-interlude" aria-label="About">
      <div className="ae-wrap">
        <Reveal>
          <p className="ae-statement">
            {site.shortName} — <em>{site.verticalLabel.toLowerCase()}</em>
            {site.city ? ` in ${site.city}` : ''}, done with care.
          </p>
        </Reveal>

        <svg className="ae-flightpath" viewBox="0 0 1440 92" fill="none" aria-hidden="true">
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
          <path className="ae-fp-line" d={FLIGHT_PATH} strokeWidth={1.25} mask={`url(#${maskId})`} />
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

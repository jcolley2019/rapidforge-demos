import type { CSSProperties } from 'react'
import { content } from '../../content/content'
import PlaceholderImage from '../../components/PlaceholderImage'

/** Arrival stagger for the hero — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--tx-delay': `${s}s` }) as CSSProperties

export default function TxHero() {
  return (
    <section style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container pt-16 pb-0 sm:pt-24">
        <h1 className="tx-display tx-load" style={{ fontSize: 'var(--tx-t6)', fontWeight: 700 }}>
          <span className="block">Precision</span>
          <span className="block pl-[8vw] sm:pl-[10rem]">Since</span>
          <span className="block" style={{ color: 'var(--tx-orange)' }}>
            1973.
          </span>
        </h1>
        <div
          className="tx-load mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
          style={at(0.18)}
        >
          <p className="max-w-md text-lg" style={{ color: 'var(--tx-steel-on-dark)' }}>
            {content.taglines.secondary}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${content.contact.quoteEmail}`} className="tx-btn tx-btn-orange">
              Get a Quote
            </a>
            <a href="#services" className="tx-btn tx-btn-outline-light">
              See Services
            </a>
          </div>
        </div>
      </div>
      <div className="tx-container mt-14">
        <div className="tx-parallax" style={{ borderTop: '4px solid var(--tx-orange)' }}>
          <PlaceholderImage
            aspectRatio="21 / 7"
            gradientFrom="#1c1c1c"
            gradientTo="#232323"
            lineColor="#f66b0e"
            lineOpacity={0.5}
            seed={41}
            label="Site imagery pending"
            labelColor="#a3a39c"
          />
        </div>
      </div>
    </section>
  )
}

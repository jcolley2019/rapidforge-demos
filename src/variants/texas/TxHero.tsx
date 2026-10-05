import type { CSSProperties } from 'react'
import { siteContent as site } from '../../brief/current'
import PlaceholderImage from '../../components/PlaceholderImage'

/** Arrival stagger for the hero — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--tx-delay': `${s}s` }) as CSSProperties

/** Split the headline so its last clause lands in orange on its own line. */
function splitHeadline(headline: string): [string, string] {
  const words = headline.trim().split(/\s+/)
  if (words.length < 3) return [headline, '']
  const cut = Math.max(1, Math.ceil(words.length * 0.6))
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

const [lead, tail] = splitHeadline(site.headline)

export default function TxHero() {
  return (
    <section style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container pt-16 pb-0 sm:pt-24">
        <h1 className="tx-display tx-load" style={{ fontSize: 'var(--tx-t5)', fontWeight: 700 }}>
          <span className="block">{lead}</span>
          {tail && (
            <span className="block" style={{ color: 'var(--tx-orange)' }}>
              {tail}
            </span>
          )}
        </h1>
        <div
          className="tx-load mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
          style={at(0.18)}
        >
          <p className="max-w-md text-lg" style={{ color: 'var(--tx-steel-on-dark)' }}>
            {site.subhead}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={site.cta.href} className="tx-btn tx-btn-orange">
              {site.cta.label}
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
            label="Photo pending"
            labelColor="#a3a39c"
          />
        </div>
      </div>
    </section>
  )
}

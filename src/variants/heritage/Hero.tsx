import type { CSSProperties } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage'
import { content } from '../../content/content'

/** Arrival stagger for the hero — a load entrance, not a scroll reveal. */
const at = (s: number) => ({ '--h-delay': `${s}s` }) as CSSProperties

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-16 pb-8 sm:pt-20 lg:pt-24 lg:pb-12">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <span className="h-load inline-flex items-center gap-2 border border-(--brass)/60 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-(--flag-red)" aria-hidden="true" />
            <span className="h-eyebrow h-num">Est. {content.founded.year}</span>
          </span>
          <h1
            className="h-display h-load mt-7 text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-[3.6rem]"
            style={at(0.1)}
          >
            {content.taglines.secondary.replace(/\.$/, '')}
          </h1>
          <p className="h-load mt-6 max-w-xl text-lg text-(--ink-soft)" style={at(0.2)}>
            {content.taglines.primary} Founded by {content.founded.founder},{' '}
            {content.founded.founderCredential} — boundary, title, and design
            surveys for {content.serviceArea}.
          </p>
          <div className="h-load mt-9 flex flex-wrap items-center gap-4" style={at(0.3)}>
            <a href={content.contact.phoneHref} className="h-btn h-btn-ink h-num">
              Call {content.contact.phone}
            </a>
            <a href="#contact" className="h-btn h-btn-outline">
              Request a Quote
            </a>
          </div>
        </div>
        <figure className="h-load" style={at(0.2)}>
          <div className="border border-(--brass)/50 bg-(--parchment-deep) p-2 shadow-[0_30px_70px_-35px_rgba(43,33,25,0.45)]">
            <div className="overflow-hidden border border-(--brass)/30">
              <PlaceholderImage
                aspectRatio="4 / 3"
                gradientFrom="#efe6d3"
                gradientTo="#ddcba4"
                lineColor="#8a6b34"
                lineOpacity={0.55}
                seed={19}
                label="Survey exhibit — placeholder"
                labelColor="#5d4d3b"
              />
            </div>
          </div>
          <figcaption className="h-eyebrow mt-4 text-center text-(--ink-faint)">
            Field exhibit &middot;{' '}
            {content.contact.address.split(',').slice(-2).join(',').trim()}
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

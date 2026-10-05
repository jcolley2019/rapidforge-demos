import { content } from '../../content/content'
import Reveal from './Reveal'
import SectionTag from './SectionTag'
import Ticks from './Ticks'

function serialTag(credential: string): string {
  return credential.replace(/\./g, '').replace(/\s+/g, '_').toUpperCase()
}

export default function GeoTeam() {
  return (
    <section id="team" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <SectionTag index="03" label="Team" />
        <h2 className="mt-5 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          Licensed operators
        </h2>
        <p className="mt-4 max-w-2xl text-(--geo-text-dim)">
          {content.stats[1].value} Registered Professional Land Surveyors sign
          every deliverable that leaves the building.
        </p>
      </Reveal>
      <div className="g-matrix mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {content.team.map((member, i) => (
          <Reveal key={member.name} stagger={i} delay={i * 80}>
            <article className="g-matrix-cell">
              <Ticks className="opacity-40" />
              <p className="g-mono w-fit border border-(--geo-line-strong) px-2 py-1 text-[0.65rem] tracking-[0.12em] text-(--geo-accent)">
                {serialTag(member.credential)}
              </p>
              <h3 className="mt-4 text-lg leading-snug font-semibold">{member.name}</h3>
              <p className="g-meta g-meta-amber mt-1.5">{member.role}</p>
              <p className="mt-3 text-sm text-(--geo-text-dim)">{member.blurb}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

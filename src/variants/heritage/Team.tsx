import PlaceholderImage from '../../components/PlaceholderImage'
import { content } from '../../content/content'
import Reveal from './Reveal'

function initials(name: string): string {
  const words = name.split(' ').filter((w) => /^[A-Z]/.test(w) && !w.endsWith('.'))
  const first = words[0]?.[0] ?? ''
  const last = words[words.length - 1]?.[0] ?? ''
  return `${first}${last}`
}

export default function Team() {
  return (
    <section id="team" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <p className="h-eyebrow">The team</p>
          <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
            The surveyors of record
          </h2>
          <hr className="h-rule h-rule-short h-rule-draw mt-7" />
          <p className="mt-7 text-(--ink-soft)">
            {content.stats[1].value} Registered Professional Land Surveyors —
            most of whom have spent their entire careers at this firm.
          </p>
        </div>
      </Reveal>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
        {content.team.map((member, i) => (
          <Reveal key={member.name} delay={i * 90} stagger={i}>
            <article className="h-card">
              <div className="relative border-b border-(--brass)/30 p-1.5">
                <PlaceholderImage
                  aspectRatio="4 / 3.4"
                  gradientFrom="#f2ecdd"
                  gradientTo="#e0d0ac"
                  lineColor="#a67c3d"
                  lineOpacity={0.35}
                  seed={70 + i}
                />
                <span
                  className="h-display absolute inset-1.5 flex items-center justify-center text-5xl font-semibold text-(--brass)/80"
                  aria-hidden="true"
                >
                  {initials(member.name)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="h-display text-lg leading-snug font-semibold">{member.name}</h3>
                <p className="h-eyebrow h-num mt-1.5">{member.credential}</p>
                <p className="mt-3 text-sm font-semibold text-(--ink)">{member.role}</p>
                <p className="mt-2 text-sm text-(--ink-soft)">{member.blurb}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

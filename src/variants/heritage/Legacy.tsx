import { content } from '../../content/content'
import Reveal from './Reveal'

const founder = content.team[0]
const smith = content.team[1]
const blevins = content.team[2]

const milestones = [
  {
    year: String(content.founded.year),
    title: 'The founding',
    text: `${content.founded.founder}, ${content.founded.founderCredential}, opens the firm at the southern edge of downtown Fort Worth — already a licensed Texas surveyor for three years.`,
  },
  {
    year: '1977',
    title: 'Licensed to the last frontier',
    text: `${founder.name} adds an Alaska licensure to his Texas registration, carrying the firm's standards from Tarrant County to the far north.`,
  },
  {
    year: '2001–2004',
    title: 'The next generation',
    text: `${smith.name} (licensed 2001) and ${blevins.name} (licensed 2004) — both career-long members of the firm — take their registrations. BBB accreditation follows in ${content.stats[5].value}.`,
  },
  {
    year: 'Today',
    title: 'Instruments change. Standards don’t.',
    text: `${content.stats[1].value} Registered Professional Land Surveyors, ${content.stats[2].value} field crews, and ${content.stats[4].value.toLowerCase()} on-network GNSS systems — plus drone mapping and 3D laser scanning.`,
  },
]

export default function Legacy() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal>
            <p className="h-eyebrow">Our legacy</p>
            <h2 className="h-display mt-4 text-3xl leading-tight font-semibold sm:text-4xl">
              Fifty years of precision
            </h2>
            <hr className="h-rule h-rule-short h-rule-draw mt-8" />
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 text-(--ink-soft)">
              {content.shortName} has been measuring North Texas since{' '}
              {content.founded.year} — before most of the firms working this
              market existed. What began as one surveyor&rsquo;s practice on the
              South Freeway is now {content.stats[1].value} licensed
              professionals and {content.stats[2].value} field crews serving{' '}
              {content.serviceArea}.
            </p>
            <p className="mt-5 text-(--ink-soft)">
              The tools have changed. The obligation hasn&rsquo;t: a boundary
              you can build on, a plat that records without questions, and a
              survey that holds up decades after the crew leaves the site.
            </p>
          </Reveal>
        </div>
        <ol className="relative border-l border-(--brass)/50 pl-8 sm:pl-10">
          {milestones.map((m, i) => (
            <li key={m.year} className={i === milestones.length - 1 ? '' : 'pb-12'}>
              <Reveal delay={i * 100} stagger={i}>
                <span
                  className="absolute -left-[5px] mt-2 h-[9px] w-[9px] rounded-full border border-(--brass) bg-(--parchment)"
                  aria-hidden="true"
                />
                <p className="h-display h-num text-2xl font-semibold text-(--brass)">{m.year}</p>
                <h3 className="mt-1.5 text-sm font-semibold tracking-[0.14em] uppercase">
                  {m.title}
                </h3>
                <p className="mt-2 max-w-lg text-[0.95rem] text-(--ink-soft)">{m.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

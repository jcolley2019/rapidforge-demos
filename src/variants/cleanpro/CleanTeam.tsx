import { content } from '../../content/content'
import Reveal from './Reveal'

function initials(name: string) {
  return name
    .split(' ')
    .filter((part) => part.length > 1 || /^[A-Z]$/.test(part))
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
}

export default function CleanTeam() {
  return (
    <section id="team" className="cp-section" style={{ background: 'var(--cp-white)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">Our Team</p>
            <h2 className="cp-h2">Licensed surveyors who know North Texas</h2>
            <p className="cp-lead mx-auto mt-4">
              Four Registered Professional Land Surveyors lead a staff of field crews and drafting
              technicians — many of whom have spent their entire careers here.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.team.map((member, i) => (
            <Reveal key={member.credential} delay={i * 90} stagger={i}>
              <div className="cp-card h-full p-6 text-center">
                <span
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                  style={{ background: 'var(--cp-blue)' }}
                  aria-hidden="true"
                >
                  {initials(member.name)}
                </span>
                <h3 className="mt-4 text-lg font-bold" style={{ color: 'var(--cp-navy)' }}>
                  {member.name}
                </h3>
                <span
                  className="cp-num mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'var(--cp-blue-tint)', color: 'var(--cp-blue-dark)' }}
                >
                  {member.credential}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--cp-navy-soft)' }}>
                  {member.role}
                </p>
                <p className="mt-3 text-sm" style={{ color: 'var(--cp-navy-soft)' }}>
                  {member.blurb}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxTeam() {
  return (
    <section id="team" className="tx-section" style={{ background: 'var(--tx-paper)' }}>
      <div className="tx-container">
        <Reveal>
          <p className="tx-label" style={{ color: 'var(--tx-orange-deep)' }}>
            The Crew
          </p>
          <h2 className="tx-display mt-3 max-w-[20ch]" style={{ fontSize: 'var(--tx-t5)' }}>
            Licensed. Local. Long-tenured.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.team.map((member, i) => (
            <Reveal
              key={member.credential}
              className="tx-reveal-stagger"
              style={{ '--tx-ar': `${i * 5}%` } as React.CSSProperties}
            >
              <div
                className="flex h-full flex-col p-6"
                style={{
                  background: 'var(--tx-black)',
                  color: 'var(--tx-paper)',
                  borderTop: '4px solid var(--tx-orange)',
                }}
              >
                <h3 className="tx-display" style={{ fontSize: 'var(--tx-t2)' }}>
                  {member.name}
                </h3>
                <span
                  className="tx-label tx-num mt-3 self-start px-2 py-1"
                  style={{ border: '1px solid var(--tx-orange)', color: 'var(--tx-orange)' }}
                >
                  {member.credential}
                </span>
                <p className="tx-label mt-4" style={{ color: 'var(--tx-steel-on-dark)', letterSpacing: '0.12em' }}>
                  {member.role}
                </p>
                <p className="mt-3 text-sm" style={{ color: 'var(--tx-steel-on-dark)' }}>
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

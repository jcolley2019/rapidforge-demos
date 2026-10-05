import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TrustedByStrip() {
  return (
    <section className="px-6 py-12" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container">
        <Reveal>
          <p
            className="text-center text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--cp-navy-soft)' }}
          >
            Trusted by North Texas engineering leaders
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {content.trustedBy.map((client) => (
              <li
                key={client}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium"
                style={{ color: 'var(--cp-navy-soft)', border: '1px solid var(--cp-border)' }}
              >
                {client}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

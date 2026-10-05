import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxServices() {
  return (
    <section id="services" className="tx-section" style={{ background: 'var(--tx-paper)' }}>
      <div className="tx-container">
        <Reveal>
          <p className="tx-label" style={{ color: 'var(--tx-orange-deep)' }}>
            Services
          </p>
          <h2 className="tx-display mt-3 max-w-[18ch]" style={{ fontSize: 'var(--tx-t5)' }}>
            Nine ways we put a boundary on it
          </h2>
        </Reveal>
        <div
          className="mt-12 grid md:grid-cols-2"
          style={{ borderTop: '1px solid var(--tx-black)', borderLeft: '1px solid var(--tx-black)' }}
        >
          {content.services.map((service, i) => (
            <Reveal
              key={service.title}
              className="tx-reveal-stagger"
              style={{ '--tx-ar': `${(i % 2) * 6}%` } as React.CSSProperties}
            >
              <div
                className="tx-cell flex h-full gap-5 p-7"
                style={{
                  borderRight: '1px solid var(--tx-black)',
                  borderBottom: '1px solid var(--tx-black)',
                }}
              >
                <span
                  className="tx-display tx-num shrink-0"
                  style={{ fontSize: 'var(--tx-t4)', color: 'var(--tx-orange)', lineHeight: 1 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="tx-display" style={{ fontSize: 'var(--tx-t2)' }}>
                    {service.title}
                  </h3>
                  <p className="tx-cell-desc mt-3 text-[0.9375rem]">
                    {service.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

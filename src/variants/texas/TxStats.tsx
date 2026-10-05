import { content } from '../../content/content'
import Reveal from './Reveal'

export default function TxStats() {
  const [marquee, ...rest] = content.stats
  return (
    <section style={{ background: 'var(--tx-black)', color: 'var(--tx-paper)' }}>
      <div className="tx-container tx-section !pt-10">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-10">
          <Reveal slide>
            <span
              className="tx-display tx-num block"
              style={{ fontSize: 'var(--tx-num)', fontWeight: 700, color: 'var(--tx-orange)', lineHeight: 0.9 }}
            >
              {marquee.value}
            </span>
          </Reveal>
          <Reveal>
            <p className="tx-display max-w-[16ch]" style={{ fontSize: 'var(--tx-t4)' }}>
              Years surveying North Texas
            </p>
          </Reveal>
        </div>
        <div
          className="mt-16 grid sm:grid-cols-2 lg:grid-cols-5"
          style={{ borderTop: '1px solid var(--tx-steel-on-dark)', borderLeft: '1px solid var(--tx-steel-on-dark)' }}
        >
          {rest.map((stat, i) => (
            <Reveal
              key={stat.label}
              className="tx-reveal-stagger"
              style={{ '--tx-ar': `${i * 5}%` } as React.CSSProperties}
            >
              <div
                className="flex h-full flex-col gap-3 p-6"
                style={{
                  borderRight: '1px solid var(--tx-steel-on-dark)',
                  borderBottom: '1px solid var(--tx-steel-on-dark)',
                }}
              >
                <span
                  className="tx-display tx-num"
                  style={{ fontSize: 'var(--tx-t5)', color: 'var(--tx-orange)' }}
                >
                  {stat.value}
                </span>
                <span className="text-sm" style={{ color: 'var(--tx-steel-on-dark)' }}>
                  {stat.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

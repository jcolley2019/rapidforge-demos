import { content } from '../../content/content'
import PlaceholderImage from '../../components/PlaceholderImage'
import Reveal from './Reveal'

const gnssStat = content.stats.find((s) => s.label.includes('GNSS'))
const drone = content.services.find((s) => s.title.includes('Drone'))
const laser = content.services.find((s) => s.title.includes('Laser'))

const rows = [
  {
    index: '01',
    title: 'On-Network GNSS',
    copy: `${gnssStat?.value} ${gnssStat?.label}. Every point we shoot lands on the same datum your engineers design on.`,
    dark: true,
    seed: 51,
  },
  {
    index: '02',
    title: drone?.title ?? '',
    copy: drone?.description ?? '',
    dark: false,
    seed: 52,
  },
  {
    index: '03',
    title: laser?.title ?? '',
    copy: laser?.description ?? '',
    dark: true,
    seed: 53,
  },
]

export default function TxTechnology() {
  return (
    <section id="technology">
      {rows.map((row) => (
        <div
          key={row.index}
          style={{
            background: row.dark ? 'var(--tx-black)' : 'var(--tx-paper)',
            color: row.dark ? 'var(--tx-paper)' : 'var(--tx-black)',
            borderTop: '4px solid var(--tx-orange)',
          }}
        >
          <div className="tx-container tx-section grid items-center gap-10 md:grid-cols-2">
            <div className="tx-parallax-text">
              <Reveal>
                <span
                  className="tx-display tx-num block"
                  style={{ fontSize: 'var(--tx-t5)', color: 'var(--tx-orange)' }}
                >
                  {row.index}
                </span>
                <h3 className="tx-display mt-4" style={{ fontSize: 'var(--tx-t4)' }}>
                  {row.title}
                </h3>
                <p
                  className="mt-5 max-w-lg"
                  style={{ color: row.dark ? 'var(--tx-steel-on-dark)' : 'var(--tx-steel-on-light)' }}
                >
                  {row.copy}
                </p>
              </Reveal>
            </div>
            <div className="tx-parallax">
              <PlaceholderImage
                aspectRatio="4 / 3"
                gradientFrom={row.dark ? '#1c1c1c' : '#e8e4db'}
                gradientTo={row.dark ? '#232323' : '#ded9cd'}
                lineColor="#f66b0e"
                lineOpacity={0.5}
                seed={row.seed}
                label="Equipment imagery pending"
                labelColor={row.dark ? '#a3a39c' : '#6b6963'}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

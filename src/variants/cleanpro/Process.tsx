import { content } from '../../content/content'
import Reveal from './Reveal'

const steps = [
  {
    title: 'Send property details',
    copy: (
      <>
        Email your property information and project goals to{' '}
        <a href={`mailto:${content.contact.quoteEmail}`} className="cp-inline-link">
          {content.contact.quoteEmail}
        </a>{' '}
        or call <span className="cp-num">{content.contact.phone}</span>.
      </>
    ),
  },
  {
    title: 'We scope & schedule',
    copy: 'A licensed surveyor reviews your request, researches the records, and schedules one of our six field crews for your site.',
  },
  {
    title: 'Sealed survey delivered',
    copy: 'You receive a professionally sealed survey, drafted by our AutoCAD team and reviewed by a Registered Professional Land Surveyor.',
  },
]

export default function Process() {
  return (
    <section id="process" className="cp-section" style={{ background: 'var(--cp-gray)' }}>
      <div className="cp-container">
        <Reveal>
          <div className="text-center">
            <p className="cp-eyebrow">How It Works</p>
            <h2 className="cp-h2">From first call to sealed survey</h2>
          </div>
        </Reveal>
        <div className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-6 hidden border-t-2 border-dashed md:block"
            style={{ borderColor: 'var(--cp-blue-tint-2)' }}
          />
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 120} stagger={i}>
              <div className="relative text-center">
                <span
                  className="cp-num relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-white"
                  style={{ background: 'var(--cp-blue)', boxShadow: '0 0 0 8px var(--cp-gray)' }}
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-bold" style={{ color: 'var(--cp-navy)' }}>
                  {step.title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-[0.9375rem]" style={{ color: 'var(--cp-navy-soft)' }}>
                  {step.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
